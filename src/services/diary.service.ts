
import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type Visibility = 'public' | 'private' | 'secret' | 'group';

export interface Diary {
  id: string;
  uid: string;
  authorName: string;
  title: string;
  content: string;
  coverImage?: string; // Base64 string for the cover
  date: number;
  visibility: Visibility;
  secretKey?: string; // For 'secret' visibility
  allowedUsers?: string[]; // For 'group' visibility (list of usernames)
  majorEvents: string[];
  isPinned: boolean;
  likes: number; // Like count
}

@Injectable({
  providedIn: 'root'
})
export class DiaryService {
  private authService = inject(AuthService);
  private storageKey = 'app_diaries_v1';
  
  // State
  private diariesSignal = signal<Diary[]>(this.loadDiaries());
  
  // Track which diaries the current session has liked (for UI state only, as we don't have a backend to track user-likes persistently per user)
  private sessionLikedIds = signal<Set<string>>(new Set());

  // Selectors
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

  // Admin view: All diaries
  readonly adminAllDiaries = computed(() => {
    if (!this.authService.isAdmin()) return [];
    return this.diariesSignal().sort((a, b) => b.date - a.date);
  });

  constructor() {}

  private loadDiaries(): Diary[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      const parsed = data ? JSON.parse(data) : [];
      // Migration: Ensure new fields exist on old records
      return parsed.map((d: any) => ({
        ...d,
        likes: d.likes || 0,
        coverImage: d.coverImage || undefined
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

  addDiary(diary: Omit<Diary, 'id' | 'date' | 'isPinned' | 'uid' | 'authorName' | 'likes'>) {
    const user = this.authService.currentUser();
    if (!user) return;

    const newDiary: Diary = {
      ...diary,
      id: crypto.randomUUID(),
      date: Date.now(),
      uid: user.uid,
      authorName: user.username,
      isPinned: false,
      likes: 0,
      majorEvents: diary.majorEvents || [] // Ensure array
    };

    const current = this.diariesSignal();
    this.saveDiaries([newDiary, ...current]);
  }

  updateDiary(id: string, updates: Partial<Diary>) {
    const current = this.diariesSignal();
    const index = current.findIndex(d => d.id === id);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = { ...updated[index], ...updates };
      this.saveDiaries(updated);
    }
  }

  deleteDiary(id: string) {
    const current = this.diariesSignal();
    this.saveDiaries(current.filter(d => d.id !== id));
  }

  togglePin(id: string) {
    if (!this.authService.isAdmin()) return;
    const diary = this.diariesSignal().find(d => d.id === id);
    if (diary) {
      this.updateDiary(id, { isPinned: !diary.isPinned });
    }
  }

  toggleLike(id: string) {
    // If already liked in this session, don't increase count (simple prevention)
    if (this.sessionLikedIds().has(id)) {
        return; 
    }

    const diary = this.diariesSignal().find(d => d.id === id);
    if (diary) {
      this.updateDiary(id, { likes: (diary.likes || 0) + 1 });
      
      // Update session tracking
      const newSet = new Set(this.sessionLikedIds());
      newSet.add(id);
      this.sessionLikedIds.set(newSet);
    }
  }

  isLikedInSession(id: string): boolean {
      return this.sessionLikedIds().has(id);
  }

  getDiaryById(id: string): Diary | undefined {
    return this.diariesSignal().find(d => d.id === id);
  }

  // Permission Logic
  canView(diary: Diary, secretKeyInput?: string): boolean {
    const user = this.authService.currentUser();
    
    // 1. Admin & Owner can view EVERYTHING
    if (this.authService.isAdmin()) return true;

    // 2. Author can always view
    if (user && user.uid === diary.uid) return true;

    // 3. Public
    if (diary.visibility === 'public') return true;

    // 4. Private
    if (diary.visibility === 'private') return false; // Handled by Author check above

    // 5. Secret
    if (diary.visibility === 'secret') {
      return diary.secretKey === secretKeyInput;
    }

    // 6. Group
    if (diary.visibility === 'group') {
      if (!user) return false;
      // Simple username check
      const allowed = diary.allowedUsers || [];
      return allowed.includes(user.username);
    }

    return false;
  }
}
