
import { Injectable, signal, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { db } from './firebase.config';
import { collection, doc, setDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';

export interface Feedback {
  id: string;
  uid?: string; // Track who sent it
  username?: string;
  type: string; 
  content: string;
  contact?: string;
  date: number;
  reply?: string;
  replyDate?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  private feedbackSignal = signal<Feedback[]>([]);

  readonly allFeedback = this.feedbackSignal.asReadonly();

  constructor() {
    this.init();
  }

  private init() {
      onSnapshot(collection(db, 'feedback'), (snap) => {
          const list: Feedback[] = [];
          snap.forEach(d => list.push(d.data() as Feedback));
          // sort by date desc
          list.sort((a,b) => b.date - a.date);
          this.feedbackSignal.set(list);
      });
  }

  async addFeedback(feedback: Pick<Feedback, 'type' | 'content' | 'contact'>) {
    const user = this.authService.currentUser();
    const id = crypto.randomUUID();
    const newFeedback: Feedback = {
      ...feedback,
      id,
      uid: user ? user.uid : undefined,
      username: user ? user.username : 'Guest',
      date: Date.now()
    };
    
    await setDoc(doc(db, 'feedback', id), newFeedback);
  }

  async replyToFeedback(id: string, reply: string) {
    const target = this.feedbackSignal().find(f => f.id === id);
    
    await updateDoc(doc(db, 'feedback', id), {
        reply,
        replyDate: Date.now()
    });

    // Send Notification
    if (target && target.uid) {
        this.notificationService.notify(
            target.uid, 
            'reply', 
            `管理员回复了你的反馈: "${reply.substring(0, 20)}${reply.length > 20 ? '...' : ''}"`
        );
    }
  }

  async deleteFeedback(id: string) {
    await deleteDoc(doc(db, 'feedback', id));
  }
}
