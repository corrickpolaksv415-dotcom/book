
import { Injectable, signal, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

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

  private readonly STORAGE_KEY = 'app_feedback_v1';
  private feedbackSignal = signal<Feedback[]>(this.loadFeedback());

  readonly allFeedback = this.feedbackSignal.asReadonly();

  constructor() {}

  private loadFeedback(): Feedback[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.feedbackSignal()));
    } catch (e) {
      console.error('Failed to save feedback', e);
    }
  }

  addFeedback(feedback: Pick<Feedback, 'type' | 'content' | 'contact'>) {
    const user = this.authService.currentUser();
    const newFeedback: Feedback = {
      ...feedback,
      id: crypto.randomUUID(),
      uid: user ? user.uid : undefined,
      username: user ? user.username : 'Guest',
      date: Date.now()
    };
    this.feedbackSignal.update(list => [newFeedback, ...list]);
    this.save();
  }

  replyToFeedback(id: string, reply: string) {
    const target = this.feedbackSignal().find(f => f.id === id);
    
    this.feedbackSignal.update(list => list.map(f => {
      if (f.id === id) {
        return { ...f, reply, replyDate: Date.now() };
      }
      return f;
    }));
    this.save();

    // Send Notification
    if (target && target.uid) {
        this.notificationService.notify(
            target.uid, 
            'reply', 
            `管理员回复了你的反馈: "${reply.substring(0, 20)}${reply.length > 20 ? '...' : ''}"`
        );
    }
  }

  deleteFeedback(id: string) {
    this.feedbackSignal.update(list => list.filter(f => f.id !== id));
    this.save();
  }
}
