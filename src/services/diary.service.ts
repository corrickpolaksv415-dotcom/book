
import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type Visibility = 'public' | 'private' | 'secret' | 'group';

export interface Diary {
  id: string;
  uid: string;
  authorName: string;
  title: string;
  content: string;
  coverImage?: string;
  date: number; // Creation date
  lastEdited: number; // Last modification date
  visibility: Visibility;
  secretKey?: string; 
  allowedUsers?: string[]; 
  majorEvents: string[];
  isPinned: boolean;
  likedBy: string[]; // List of UIDs who liked this diary
}

@Injectable({
  providedIn: 'root'
})
export class DiaryService {
  private authService = inject(AuthService);
  private storageKey = 'app_diaries_v1';
  
  private diariesSignal = signal<Diary[]>(this.loadDiaries());
  
  readonly allDiaries = this.diariesSignal.asReadonly();
  
  readonly publicFeed = computed(() => {
    let list = this.diariesSignal().filter(d => d.visibility === 'public');
    
    return list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.date - a.date;
    });
  });

  readonly myDiaries = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.diariesSignal()
      .filter(d => d.uid === user.uid)
      .sort((a, b) => b.date - a.date);
  });

  readonly adminAllDiaries = computed(() => {
    if (!this.authService.isAdmin()) return [];
    return this.diariesSignal().sort((a, b) => b.date - a.date);
  });

  constructor() {}

  private loadDiaries(): Diary[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      const parsed = data ? JSON.parse(data) : [];
      // Migration
      return parsed.map((d: any) => ({
        ...d,
        likedBy: Array.isArray(d.likedBy) ? d.likedBy : [],
        coverImage: d.coverImage || undefined,
        // Migration: If lastEdited is missing, default to creation date
        lastEdited: d.lastEdited || d.date 
      }));
    } catch {
      return [];
    }
  }

  private saveDiaries(diaries: Diary[]) {
    this.diariesSignal.set(diaries);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(diaries));
    } catch (e) {
      console.error('Save failed', e);
    }
  }

  addDiary(diary: Omit<Diary, 'id' | 'date' | 'lastEdited' | 'isPinned' | 'uid' | 'authorName' | 'likedBy'>) {
    const user = this.authService.currentUser();
    if (!user) return;

    const now = Date.now();
    const newDiary: Diary = {
      ...diary,
      id: crypto.randomUUID(),
      date: now,
      lastEdited: now,
      uid: user.uid,
      authorName: user.username,
      isPinned: false,
      likedBy: [],
      majorEvents: diary.majorEvents || []
    };

    const current = this.diariesSignal();
    this.saveDiaries([newDiary, ...current]);
  }

  updateDiary(id: string, updates: Partial<Diary>) {
    const current = this.diariesSignal();
    const index = current.findIndex(d => d.id === id);
    if (index !== -1) {
      const updated = [...current];
      // Update lastEdited automatically if content or title changed
      const isContentChange = updates.title || updates.content || updates.coverImage;
      const finalUpdates = {
        ...updates,
        lastEdited: isContentChange ? Date.now() : updated[index].lastEdited
      };
      
      updated[index] = { ...updated[index], ...finalUpdates };
      this.saveDiaries(updated);
    }
  }

  deleteDiary(id: string) {
    const current = this.diariesSignal();
    this.saveDiaries(current.filter(d => d.id !== id));
  }

  deleteDiariesByAuthor(uid: string) {
    const current = this.diariesSignal();
    this.saveDiaries(current.filter(d => d.uid !== uid));
  }

  togglePin(id: string) {
    if (!this.authService.isAdmin()) return;
    const diary = this.diariesSignal().find(d => d.id === id);
    if (diary) {
      this.updateDiary(id, { isPinned: !diary.isPinned });
    }
  }

  toggleLike(id: string) {
    const user = this.authService.currentUser();
    if (!user) return; 

    const diary = this.diariesSignal().find(d => d.id === id);
    if (diary) {
      const hasLiked = diary.likedBy.includes(user.uid);
      let newLikedBy = [];
      
      if (hasLiked) {
         newLikedBy = diary.likedBy.filter(uid => uid !== user.uid);
      } else {
         newLikedBy = [...diary.likedBy, user.uid];
      }
      
      this.updateDiary(id, { likedBy: newLikedBy });
    }
  }

  hasLiked(id: string): boolean {
    const user = this.authService.currentUser();
    const diary = this.getDiaryById(id);
    if (!user || !diary) return false;
    return diary.likedBy.includes(user.uid);
  }
  
  getLikeCount(id: string): number {
      const diary = this.getDiaryById(id);
      return diary ? diary.likedBy.length : 0;
  }

  getDiaryById(id: string): Diary | undefined {
    return this.diariesSignal().find(d => d.id === id);
  }

  canView(diary: Diary, secretKeyInput?: string): boolean {
    const user = this.authService.currentUser();
    if (this.authService.isAdmin()) return true;
    if (user && user.uid === diary.uid) return true;
    if (diary.visibility === 'public') return true;
    if (diary.visibility === 'private') return false;
    if (diary.visibility === 'secret') return diary.secretKey === secretKeyInput;
    if (diary.visibility === 'group') {
      if (!user) return false;
      const allowed = diary.allowedUsers || [];
      return allowed.includes(user.username);
    }
    return false;
  }
}
