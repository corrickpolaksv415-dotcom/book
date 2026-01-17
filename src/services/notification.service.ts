
import { Injectable, signal, computed } from '@angular/core';

export interface Notification {
  id: string;
  targetUid: string; // Who receives this
  type: 'reply' | 'follow' | 'like' | 'system';
  content: string;
  date: number;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly STORAGE_KEY = 'app_notifications_v1';
  private notificationsSignal = signal<Notification[]>(this.load());

  constructor() {}

  private load(): Notification[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private save(list: Notification[]) {
    this.notificationsSignal.set(list);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  }

  // Get notifications for a specific user
  getUserNotifications(uid: string) {
    return computed(() => 
      this.notificationsSignal()
        .filter(n => n.targetUid === uid)
        .sort((a, b) => b.date - a.date)
    );
  }

  getUnreadCount(uid: string) {
    return computed(() => 
      this.notificationsSignal().filter(n => n.targetUid === uid && !n.read).length
    );
  }

  notify(targetUid: string, type: Notification['type'], content: string) {
    const note: Notification = {
      id: crypto.randomUUID(),
      targetUid,
      type,
      content,
      date: Date.now(),
      read: false
    };
    this.save([note, ...this.notificationsSignal()]);
  }

  markAsRead(id: string) {
    const list = this.notificationsSignal().map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.save(list);
  }

  markAllAsRead(uid: string) {
    const list = this.notificationsSignal().map(n => 
      n.targetUid === uid ? { ...n, read: true } : n
    );
    this.save(list);
  }
}
