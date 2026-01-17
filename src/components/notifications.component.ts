
import { Component, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="max-w-2xl mx-auto">
      <header class="mb-8 flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
           <h2 class="text-3xl font-serif text-stone-800">通知中心</h2>
           <p class="text-stone-500 mt-2">查看您的最新动态</p>
        </div>
        <button (click)="markAllRead()" class="text-sm text-indigo-600 hover:underline">
          全部标记为已读
        </button>
      </header>

      @if (notifications().length === 0) {
        <div class="text-center py-20 text-stone-400">
          暂无通知
        </div>
      }

      <div class="space-y-4">
        @for (note of notifications(); track note.id) {
          <div class="bg-white p-4 rounded-xl shadow-sm border transition-colors flex items-start gap-4"
               [ngClass]="note.read ? 'border-stone-100 opacity-75' : 'border-indigo-100 bg-indigo-50/30'">
            
            <div class="p-2 rounded-full flex-shrink-0" 
                 [ngClass]="{
                   'bg-blue-100 text-blue-600': note.type === 'reply',
                   'bg-green-100 text-green-600': note.type === 'follow',
                   'bg-pink-100 text-pink-600': note.type === 'like',
                   'bg-amber-100 text-amber-600': note.type === 'system'
                 }">
               @switch (note.type) {
                 @case ('reply') {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                 }
                 @case ('follow') {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                    </svg>
                 }
                 @case ('like') {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                 }
                 @default {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                 }
               }
            </div>

            <div class="flex-1">
              <p class="text-stone-800 text-sm md:text-base">{{ note.content }}</p>
              <p class="text-xs text-stone-400 mt-1">{{ note.date | date:'yyyy/MM/dd HH:mm' }}</p>
            </div>

            @if (!note.read) {
              <div class="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class NotificationsComponent {
  auth = inject(AuthService);
  notificationService = inject(NotificationService);

  notifications = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    const signal = this.notificationService.getUserNotifications(user.uid);
    // Mark as read when viewed is a bit tricky with computed, so we do it explicitly on actions or leave it manual/bulk
    return signal();
  });

  markAllRead() {
    const user = this.auth.currentUser();
    if (user) {
      this.notificationService.markAllAsRead(user.uid);
    }
  }
}
