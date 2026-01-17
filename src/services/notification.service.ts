
import { Injectable, signal, computed } from '@angular/core';
import { db } from './firebase.config';
import { collection, doc, setDoc, onSnapshot, updateDoc, query, where } from 'firebase/firestore';

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
  private notificationsSignal = signal<Notification[]>([]);

  constructor() {
    // In a real app, we would only subscribe to MY notifications.
    // Since we are simulating a full backend via firestore in test mode,
    // we will subscribe to the whole collection and filter in memory to save setup time,
    // OR ideally setup a query based on current user ID in AuthService, but AuthService depends on this.
    // To avoid circular dependency issues during init, we will just listen to all and filter.
    // (Optimization: Move subscription to a method called by AuthService when user logs in)
    this.init();
  }

  private init() {
     onSnapshot(collection(db, 'notifications'), (snap) => {
         const list: Notification[] = [];
         snap.forEach(d => list.push(d.data() as Notification));
         this.notificationsSignal.set(list);
     });
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

  async notify(targetUid: string, type: Notification['type'], content: string) {
    const id = crypto.randomUUID();
    const note: Notification = {
      id,
      targetUid,
      type,
      content,
      date: Date.now(),
      read: false
    };
    try {
      await setDoc(doc(db, 'notifications', id), note);
    } catch (e) {
      console.error(e);
    }
  }

  async markAsRead(id: string) {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) { console.error(e); }
  }

  async markAllAsRead(uid: string) {
    const userNotes = this.notificationsSignal().filter(n => n.targetUid === uid && !n.read);
    // Batch update
    userNotes.forEach(n => {
       this.markAsRead(n.id);
    });
  }
}
