
import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { db } from './firebase.config';
import { collection, doc, setDoc, onSnapshot, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';

export type Visibility = 'public' | 'private' | 'secret' | 'group';

export interface Diary {
  id: string;
  uid: string;
  authorName: string;
  title: string;
  content: string;
  coverImage?: string;
  date: number; 
  lastEdited: number; 
  visibility: Visibility;
  secretKey?: string; 
  allowedUsers?: string[]; 
  majorEvents: string[];
  isPinned: boolean;
  likedBy: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DiaryService {
  private authService = inject(AuthService);
  
  private diariesSignal = signal<Diary[]>([]);
  
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

  constructor() {
    this.initRealtimeDiaries();
  }

  private initRealtimeDiaries() {
    const q = query(collection(db, 'diaries')); // We can sort in memory for simplicity or use orderBy in query
    onSnapshot(q, (snapshot) => {
      const diaries: Diary[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Diary;
        // Migration/Safety checks for missing fields
        if (!data.likedBy) data.likedBy = [];
        diaries.push(data);
      });
      this.diariesSignal.set(diaries);
    });
  }

  async addDiary(diary: Omit<Diary, 'id' | 'date' | 'lastEdited' | 'isPinned' | 'uid' | 'authorName' | 'likedBy'>) {
    const user = this.authService.currentUser();
    if (!user) return;

    const id = crypto.randomUUID();
    const now = Date.now();
    const newDiary: Diary = {
      ...diary,
      id,
      date: now,
      lastEdited: now,
      uid: user.uid,
      authorName: user.username,
      isPinned: false,
      likedBy: [],
      majorEvents: diary.majorEvents || []
    };

    try {
      await setDoc(doc(db, 'diaries', id), newDiary);
    } catch (e) {
      console.error('Add diary failed', e);
    }
  }

  async updateDiary(id: string, updates: Partial<Diary>) {
    // We need to fetch the current doc first to know if we need to update timestamp, 
    // OR we just trust the component passed the right logic.
    // Let's do a smart update.
    
    const isContentChange = updates.title || updates.content || updates.coverImage;
    const finalUpdates = {
      ...updates,
      ...(isContentChange ? { lastEdited: Date.now() } : {})
    };

    try {
      await updateDoc(doc(db, 'diaries', id), finalUpdates);
    } catch (e) {
      console.error('Update diary failed', e);
    }
  }

  async deleteDiary(id: string) {
    try {
      await deleteDoc(doc(db, 'diaries', id));
    } catch (e) {
      console.error('Delete diary failed', e);
    }
  }

  async deleteDiariesByAuthor(uid: string) {
    // In Firestore, we must delete individually or use batch.
    const userDiaries = this.diariesSignal().filter(d => d.uid === uid);
    userDiaries.forEach(d => this.deleteDiary(d.id));
  }

  togglePin(id: string) {
    if (!this.authService.isAdmin()) return;
    const diary = this.diariesSignal().find(d => d.id === id);
    if (diary) {
      this.updateDiary(id, { isPinned: !diary.isPinned });
    }
  }

  async toggleLike(id: string) {
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
      
      await this.updateDiary(id, { likedBy: newLikedBy });
    }
  }

  hasLiked(id: string): boolean {
    const user = this.authService.currentUser();
    const diary = this.getDiaryById(id);
    if (!user || !diary) return false;
    return diary.likedBy.includes(user.uid);
  }
  
  // Helper for UI to show optimistic or session-based state if needed, 
  // but hasLiked is reactive so it's fine.
  isLikedInSession(id: string): boolean {
      return this.hasLiked(id);
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
