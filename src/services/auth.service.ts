
import { Injectable, signal, computed } from '@angular/core';

export interface User {
  uid: string;
  username: string;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'app_session_v1';
  private readonly DB_KEY = 'app_users_db_v1';
  
  // Specific requirements from prompt
  private readonly MASTER_USER = {
    username: 'awealy',
    uid: '100000',
    password: '111121'
  };
  private readonly ADMIN_KEY = 'wyxrl_小樾';

  private currentUserSignal = signal<User | null>(this.loadSession());
  
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAdmin = computed(() => this.currentUserSignal()?.isAdmin ?? false);

  constructor() {}

  private loadSession(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private getUsers(): any[] {
    try {
      const stored = localStorage.getItem(this.DB_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: any[]) {
    localStorage.setItem(this.DB_KEY, JSON.stringify(users));
  }

  register(username: string, password: string): boolean {
    const users = this.getUsers();
    
    // Check duplicates
    if (users.find(u => u.username === username)) return false;
    
    // Prevent registering as the reserved station master username
    if (username === this.MASTER_USER.username) return false;

    const newUser = {
      uid: crypto.randomUUID(),
      username,
      password,
      isAdmin: false
    };

    users.push(newUser);
    this.saveUsers(users);
    
    // Auto login
    this.setSession({
      uid: newUser.uid,
      username: newUser.username,
      isAdmin: newUser.isAdmin
    });
    
    return true;
  }

  login(username: string, password: string): boolean {
    // 1. Station Master Login Check
    if (username === this.MASTER_USER.username && password === this.MASTER_USER.password) {
      // Station master is set as admin by default, but can also use key if needed.
      this.setSession({
        uid: this.MASTER_USER.uid,
        username: this.MASTER_USER.username,
        isAdmin: true
      });
      return true;
    }

    // 2. Regular User Login Check
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      this.setSession({
        uid: user.uid,
        username: user.username,
        isAdmin: user.isAdmin || false
      });
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
        // Update current session
        const updated = { ...current, isAdmin: true };
        this.setSession(updated);

        // Update persistence for regular users
        if (current.uid !== this.MASTER_USER.uid) {
          const users = this.getUsers();
          const idx = users.findIndex(u => u.uid === current.uid);
          if (idx !== -1) {
            users[idx].isAdmin = true;
            this.saveUsers(users);
          }
        }
        return true;
      }
    }
    return false;
  }

  private setSession(user: User) {
    this.currentUserSignal.set(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }
}
