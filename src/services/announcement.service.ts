
import { Injectable, signal } from '@angular/core';

export interface Announcement {
  id: string;
  content: string;
  active: boolean;
  date: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private readonly STORAGE_KEY = 'app_announcements_v1';
  
  private announcementSignal = signal<Announcement | null>(this.load());
  readonly currentAnnouncement = this.announcementSignal.asReadonly();

  constructor() {}

  private load(): Announcement | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setAnnouncement(content: string) {
    const ann: Announcement = {
      id: crypto.randomUUID(),
      content,
      active: true,
      date: Date.now()
    };
    this.announcementSignal.set(ann);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ann));
  }

  clearAnnouncement() {
    this.announcementSignal.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
