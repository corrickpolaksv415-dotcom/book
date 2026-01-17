
import { Injectable, signal, computed, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { db } from './firebase.config';
import { collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

export interface User {
  uid: string;
  username: string;
  password?: string; // Stored in DB
  isAdmin: boolean;
  
  // Profile Customization
  bio?: string;
  profileCover?: string; // URL or base64

  // Social
  followers: string[]; // List of UIDs following this user
  following: string[]; // List of UIDs this user follows
  likesReceived: number; // Total likes on user profile
  
  // Tracking for limits
  likedUsersLog?: Record<string, number>; // { targetUid: timestamp }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private notificationService = inject(NotificationService);
  
  private readonly STORAGE_KEY = 'app_session_v1';
  
  private readonly MASTER_USER = {
    username: 'awealy',
    uid: '100000',
    password: '111121'
  };
  private readonly ADMIN_KEY = 'wyxrl_小樾';

  // Reactive State
  private currentUserSignal = signal<User | null>(this.loadSession());
  private usersSignal = signal<User[]>([]);
  
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly allUsers = this.usersSignal.asReadonly();
  readonly isAdmin = computed(() => this.currentUserSignal()?.isAdmin ?? false);

  constructor() {
    this.initRealtimeUsers();
  }

  // --- Realtime Data Sync ---

  private initRealtimeUsers() {
    // Listen to 'users' collection changes in real-time
    onSnapshot(collection(db, 'users'), (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      
      this.usersSignal.set(users);

      // Check if Master User exists, if not create it (Seed DB)
      if (!users.find(u => u.uid === this.MASTER_USER.uid)) {
        this.createMasterUser();
      }

      // Refresh current user session data from latest DB data
      const current = this.currentUserSignal();
      if (current) {
        const fresh = users.find(u => u.uid === current.uid);
        if (fresh) {
           // Don't overwrite the local session password if it's missing in some flows, but usually fine
           this.setSession(fresh); 
        } else {
           // User was deleted remotely
           this.logout(); 
        }
      }
    });
  }

  private async createMasterUser() {
    const master: User = {
      uid: this.MASTER_USER.uid,
      username: this.MASTER_USER.username,
      password: this.MASTER_USER.password,
      isAdmin: true,
      followers: [],
      following: [],
      likesReceived: 9999,
      likedUsersLog: {},
      bio: '我是站主，欢迎来到云端日记！',
      profileCover: undefined
    };
    await setDoc(doc(db, 'users', master.uid), master);
  }

  // --- Session Management (Local) ---

  private loadSession(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private setSession(user: User) {
    // We store the session locally so page refresh remembers login
    this.currentUserSignal.set(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  // --- Auth Logic ---

  async register(username: string, password: string): Promise<boolean> {
    const users = this.usersSignal();
    
    if (users.find(u => u.username === username)) return false;
    if (username === this.MASTER_USER.username) return false;

    const uid = crypto.randomUUID();
    const newUser: User = {
      uid,
      username,
      password,
      isAdmin: false,
      followers: [],
      following: [],
      likesReceived: 0,
      likedUsersLog: {}
    };

    try {
      await setDoc(doc(db, 'users', uid), newUser);
      this.setSession(newUser);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  login(username: string, password: string): boolean {
    const users = this.usersSignal();
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

  async activateAdmin(inputKey: string): Promise<boolean> {
    if (inputKey === this.ADMIN_KEY) {
      const current = this.currentUserSignal();
      if (current) {
         try {
           await updateDoc(doc(db, 'users', current.uid), { isAdmin: true });
           return true;
         } catch (e) {
           console.error(e);
         }
      }
    }
    return false;
  }
  
  async deleteUser(uid: string) {
    if (!this.isAdmin()) return;
    if (uid === this.MASTER_USER.uid) return;

    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      console.error('Delete user failed', e);
    }
  }

  async updateUserProfile(updates: Partial<Pick<User, 'bio' | 'profileCover' | 'username'>>) {
    const current = this.currentUserSignal();
    if (!current) return;

    try {
      await updateDoc(doc(db, 'users', current.uid), updates);
    } catch (e) {
      console.error('Update profile failed', e);
    }
  }

  // --- Social Logic ---

  async toggleFollow(targetUid: string) {
    const me = this.currentUserSignal();
    if (!me || me.uid === targetUid) return;

    const users = this.usersSignal();
    const targetUser = users.find(u => u.uid === targetUid);
    if (!targetUser) return;

    // We need to update BOTH documents. 
    // Ideally use a transaction, but separate updates are fine for this scale.

    const isFollowing = me.following.includes(targetUid);
    
    let newMyFollowing = [...me.following];
    let newTargetFollowers = [...targetUser.followers];

    if (isFollowing) {
      newMyFollowing = newMyFollowing.filter(id => id !== targetUid);
      newTargetFollowers = newTargetFollowers.filter(id => id !== me.uid);
    } else {
      newMyFollowing.push(targetUid);
      newTargetFollowers.push(me.uid);
      // Notify
      this.notificationService.notify(targetUid, 'follow', `${me.username} 关注了你`);
    }

    try {
      await updateDoc(doc(db, 'users', me.uid), { following: newMyFollowing });
      await updateDoc(doc(db, 'users', targetUid), { followers: newTargetFollowers });
    } catch (e) {
      console.error('Follow failed', e);
    }
  }

  async likeUser(targetUid: string): Promise<{ success: boolean, msg: string }> {
    const me = this.currentUserSignal();
    if (!me) return { success: false, msg: '请先登录' };
    if (me.uid === targetUid) return { success: false, msg: '不能给自己点赞' };

    const users = this.usersSignal();
    const targetUser = users.find(u => u.uid === targetUid);
    if (!targetUser) return { success: false, msg: '用户不存在' };

    // Check Daily Limit locally first
    const lastLikeTime = me.likedUsersLog?.[targetUid] || 0;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (now - lastLikeTime < oneDay) {
        return { success: false, msg: '每天只能给该用户点赞一次' };
    }

    // Process Like
    try {
       // Update Target
       await updateDoc(doc(db, 'users', targetUid), {
         likesReceived: (targetUser.likesReceived || 0) + 1
       });

       // Update Me (Log)
       const newLog = { ...(me.likedUsersLog || {}) };
       newLog[targetUid] = now;
       await updateDoc(doc(db, 'users', me.uid), { likedUsersLog: newLog });
       
       this.notificationService.notify(targetUid, 'like', `${me.username} 给你的主页点赞了`);
       return { success: true, msg: '点赞成功' };
    } catch (e) {
       console.error(e);
       return { success: false, msg: '点赞失败' };
    }
  }
}
