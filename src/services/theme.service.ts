
import { Injectable, signal, computed, effect } from '@angular/core';

export interface AppTheme {
  id: string;
  name: string;
  bgClass: string; // Main background
  accentClass: string; // Sidebar highlight / active state (used for styling references)
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'app_theme_v1';

  readonly themes: AppTheme[] = [
    { id: 'warm', name: '暖阳 (默认)', bgClass: 'bg-stone-50', accentClass: 'stone' },
    { id: 'cool', name: '清凉', bgClass: 'bg-blue-50', accentClass: 'blue' },
    { id: 'rose', name: '蔷薇', bgClass: 'bg-rose-50', accentClass: 'rose' },
    { id: 'fresh', name: '森系', bgClass: 'bg-emerald-50', accentClass: 'emerald' },
    { id: 'lavender', name: '薰衣草', bgClass: 'bg-purple-50', accentClass: 'purple' },
  ];

  private currentThemeIdSignal = signal<string>(this.loadThemeId());

  readonly currentTheme = computed(() => 
    this.themes.find(t => t.id === this.currentThemeIdSignal()) || this.themes[0]
  );

  constructor() {
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, this.currentThemeIdSignal());
    });
  }

  private loadThemeId(): string {
    return localStorage.getItem(this.STORAGE_KEY) || 'warm';
  }

  setTheme(id: string) {
    if (this.themes.find(t => t.id === id)) {
      this.currentThemeIdSignal.set(id);
    }
  }
}
