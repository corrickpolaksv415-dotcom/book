
import { Injectable, signal } from '@angular/core';
import { db } from './firebase.config';
import { collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';

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
  private announcementSignal = signal<Announcement | null>(null);
  readonly currentAnnouncement = this.announcementSignal.asReadonly();

  constructor() {
    this.init();
  }

  private init() {
    // We assume only 1 active announcement for simplicity, stored in a fixed doc or collection
    onSnapshot(collection(db, 'announcements'), (snap) => {
        if (snap.empty) {
            this.announcementSignal.set(null);
        } else {
            // Get the most recent one
            const anns: Announcement[] = [];
            snap.forEach(d => anns.push(d.data() as Announcement));
            // Sort by date desc
            anns.sort((a,b) => b.date - a.date);
            this.announcementSignal.set(anns[0] || null);
        }
    });
  }

  async setAnnouncement(content: string) {
    const id = crypto.randomUUID();
    const ann: Announcement = {
      id,
      content,
      active: true,
      date: Date.now()
    };
    // For this app logic, let's clear old ones first or just add new one and frontend picks top
    await setDoc(doc(db, 'announcements', id), ann);
  }

  async clearAnnouncement() {
    // Delete the current one
    const current = this.announcementSignal();
    if (current) {
        await deleteDoc(doc(db, 'announcements', current.id));
    }
  }
}
