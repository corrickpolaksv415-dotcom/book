
import { Injectable, signal, computed, inject } from '@angular/core';
import { NotificationService } from './notification.service';

export interface User {
  uid: string;
  username: string;
  password?: string; // Stored in DB, removed from session
  isAdmin: boolean;
  
  // Profile Customization
  bio?: string;
  profileCover?: string; // URL or base64

  // Social
  followers: string[]; // List of UIDs following this user
  following: string[]; // List of UIDs this user follows
  likesReceived: number; // Total likes on user profile
  
  // Tracking for limits
  likedUsersLog?: Record<string, number>; // { targetUid: timestamp } - Last time I liked this user
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private notificationService = inject(NotificationService);
  
  private readonly STORAGE_KEY = 'app_session_v1';
  private readonly DB_KEY = 'app_users_db_v1';
  
  private readonly MASTER_USER = {
    username: 'awealy',
    uid: '100000',
    password: '111121'
  };
  private readonly ADMIN_KEY = 'wyxrl_小樾';

  // Reactive State
  private currentUserSignal = signal<User | null>(this.loadSession());
  private usersSignal = signal<User[]>(this.loadUsersFromStorage());
  
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly allUsers = this.usersSignal.asReadonly(); // For Leaderboard
  readonly isAdmin = computed(() => this.currentUserSignal()?.isAdmin ?? false);

  constructor() {}

  // --- Data Access ---

  private loadSession(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private loadUsersFromStorage(): User[] {
    try {
      const stored = localStorage.getItem(this.DB_KEY);
      let users = stored ? JSON.parse(stored) : [];
      // Migration: Ensure arrays exist
      users = users.map((u: any) => ({
        ...u,
        followers: u.followers || [],
        following: u.following || [],
        likesReceived: u.likesReceived || 0,
        likedUsersLog: u.likedUsersLog || {},
        bio: u.bio || '',
        profileCover: u.profileCover || undefined
      }));

      // Ensure Master User exists for social interactions (Leaderboard etc)
      if (!users.find((u: User) => u.uid === this.MASTER_USER.uid)) {
        const master: User = {
          uid: this.MASTER_USER.uid,
          username: this.MASTER_USER.username,
          password: this.MASTER_USER.password,
          isAdmin: true,
          followers: [],
          following: [],
          likesReceived: 9999, // Master starts with some likes :)
          likedUsersLog: {},
          bio: '我是站主，欢迎来到云端日记！',
          profileCover: undefined
        };
        users.push(master);
      }

      return users;
    } catch {
      return [];
    }
  }

  getUsers(): User[] {
    return this.usersSignal();
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(this.DB_KEY, JSON.stringify(users));
    this.usersSignal.set(users);
    
    // Refresh session if current user changed
    const current = this.currentUserSignal();
    if (current) {
      const fresh = users.find(u => u.uid === current.uid);
      if (fresh) this.setSession(fresh);
    }
  }

  getUserByUid(uid: string): User | undefined {
    return this.usersSignal().find(u => u.uid === uid);
  }

  // --- Auth Logic ---

  register(username: string, password: string): boolean {
    const users = this.getUsers();
    
    if (users.find(u => u.username === username)) return false;
    if (username === this.MASTER_USER.username) return false;

    const newUser: User = {
      uid: crypto.randomUUID(),
      username,
      password,
      isAdmin: false,
      followers: [],
      following: [],
      likesReceived: 0,
      likedUsersLog: {}
    };

    const newUsers = [...users, newUser];
    this.saveUsers(newUsers);
    this.setSession(newUser);
    return true;
  }

  login(username: string, password: string): boolean {
    const users = this.getUsers();
    
    // Check Master explicitly or in list (list is better as it's pre-seeded now)
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      this.setSession(user);
      return true;
    }

    return false;
  }

  logout() {
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  activateAdmin(inputKey: string): boolean {
    if (inputKey === this.ADMIN_KEY) {
      const current = this.currentUserSignal();
      if (current) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.uid === current.uid);
        if (idx !== -1) {
          const newUsers = [...users];
          newUsers[idx] = { ...newUsers[idx], isAdmin: true };
          this.saveUsers(newUsers);
          return true;
        }
      }
    }
    return false;
  }
  
  deleteUser(uid: string) {
    if (!this.isAdmin()) return;
    if (uid === this.MASTER_USER.uid) return; // Cannot delete master user

    const users = this.usersSignal().filter(u => u.uid !== uid);
    this.saveUsers(users);
  }

  updateUserProfile(updates: Partial<Pick<User, 'bio' | 'profileCover' | 'username'>>): boolean {
    const current = this.currentUserSignal();
    if (!current) return false;

    const users = this.getUsers();
    const index = users.findIndex(u => u.uid === current.uid);
    if (index === -1) return false;

    // Merge updates
    const updatedUser = { ...users[index], ...updates };
    
    // Immutable update
    const newUsers = [...users];
    newUsers[index] = updatedUser;
    
    this.saveUsers(newUsers);
    return true;
  }

  private setSession(user: User) {
    // Don't store password in session
    const { password, ...safeUser } = user;
    this.currentUserSignal.set(safeUser as User);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safeUser));
  }

  // --- Social Logic ---

  toggleFollow(targetUid: string) {
    const me = this.currentUserSignal();
    if (!me || me.uid === targetUid) return;

    const users = this.getUsers();
    const myIndex = users.findIndex(u => u.uid === me.uid);
    const targetIndex = users.findIndex(u => u.uid === targetUid);

    if (myIndex === -1 || targetIndex === -1) return;

    // Create copies to maintain immutability principles although simple array mutation works in local var
    const newUsers = JSON.parse(JSON.stringify(users));
    const myData = newUsers[myIndex];
    const targetData = newUsers[targetIndex];

    const isFollowing = myData.following.includes(targetUid);

    if (isFollowing) {
      // Unfollow
      myData.following = myData.following.filter((id: string) => id !== targetUid);
      targetData.followers = targetData.followers.filter((id: string) => id !== me.uid);
    } else {
      // Follow
      myData.following.push(targetUid);
      targetData.followers.push(me.uid);
      
      // Notify
      this.notificationService.notify(targetUid, 'follow', `${me.username} 关注了你`);
    }

    this.saveUsers(newUsers);
  }

  likeUser(targetUid: string): { success: boolean, msg: string } {
    const me = this.currentUserSignal();
    if (!me) return { success: false, msg: '请先登录' };
    if (me.uid === targetUid) return { success: false, msg: '不能给自己点赞' };

    const users = this.getUsers();
    const myIndex = users.findIndex(u => u.uid === me.uid);
    const targetIndex = users.findIndex(u => u.uid === targetUid);

    if (myIndex === -1 || targetIndex === -1) return { success: false, msg: '用户不存在' };

    const newUsers = JSON.parse(JSON.stringify(users));
    const myData = newUsers[myIndex];
    const targetData = newUsers[targetIndex];
    
    // Check Daily Limit
    const lastLikeTime = myData.likedUsersLog?.[targetUid] || 0;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (now - lastLikeTime < oneDay) {
        return { success: false, msg: '每天只能给该用户点赞一次' };
    }

    // Process Like
    targetData.likesReceived = (targetData.likesReceived || 0) + 1;
    
    // Log Time
    if (!myData.likedUsersLog) myData.likedUsersLog = {};
    myData.likedUsersLog[targetUid] = now;

    this.saveUsers(newUsers);
    
    this.notificationService.notify(targetUid, 'like', `${me.username} 给你的主页点赞了`);

    return { success: true, msg: '点赞成功' };
  }
}
