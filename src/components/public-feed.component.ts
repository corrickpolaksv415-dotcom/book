
import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DiaryService } from '../services/diary.service';
import { AuthService } from '../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <div class="space-y-8">
      <header class="mb-8 border-b border-stone-200 pb-4">
        <h2 class="text-3xl font-serif text-stone-800">公共广场</h2>
        <p class="text-stone-500 mt-2">探索他人的生活点滴与故事</p>
      </header>

      @if (diaryService.publicFeed().length === 0) {
        <div class="text-center py-20 text-stone-400 bg-white rounded-xl border border-stone-100 shadow-sm">
          <p class="text-lg">暂无公开日记，快去分享第一篇吧！</p>
        </div>
      }

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        @for (diary of diaryService.publicFeed(); track diary.id) {
          <div class="group bg-white rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col">
             
            @if (diary.isPinned) {
              <div class="absolute top-0 right-0 z-10 bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-bl-lg font-bold shadow-sm">
                ★ 置顶
              </div>
            }

            <!-- Cover Image Preview -->
            @if (diary.coverImage) {
               <div class="h-48 w-full overflow-hidden bg-stone-100 relative">
                 <img [src]="diary.coverImage" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
               </div>
            }

            <div class="p-6 flex-1 flex flex-col">
              <div class="flex items-center gap-2 mb-4 text-xs text-stone-400">
                <span class="bg-stone-100 px-2 py-1 rounded text-stone-600 font-medium">
                  {{ diary.authorName }}
                </span>
                <span>•</span>
                <span>{{ diary.date | date:'yyyy年MM月dd日' }}</span>
              </div>

              <a [routerLink]="['/diary', diary.id]" class="block flex-1">
                <h3 class="text-xl font-bold text-stone-800 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {{ diary.title }}
                </h3>
                
                <p class="text-stone-600 leading-relaxed line-clamp-3 mb-4 text-sm">
                  {{ diary.content }}
                </p>
              </a>

              @if (diary.majorEvents && diary.majorEvents.length > 0) {
                <div class="mb-4 flex flex-wrap gap-2">
                  @for (event of diary.majorEvents.slice(0, 2); track event) {
                     <span class="text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                       {{ event }}
                     </span>
                  }
                </div>
              }

              <!-- Action Footer -->
              <div class="pt-4 border-t border-stone-100 flex items-center justify-between mt-auto">
                 <!-- Like Button -->
                 <button (click)="toggleLike(diary.id)" 
                         [class.text-red-500]="diaryService.isLikedInSession(diary.id)"
                         [class.text-stone-400]="!diaryService.isLikedInSession(diary.id)"
                         class="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" [attr.fill]="diaryService.isLikedInSession(diary.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    <span class="text-sm font-medium">{{ diary.likes || 0 }}</span>
                 </button>

                 <!-- Admin Pin Button -->
                 @if (auth.isAdmin()) {
                   <button (click)="togglePin(diary.id)" class="text-xs px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-600">
                     {{ diary.isPinned ? '取消置顶' : '置顶' }}
                   </button>
                 }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class PublicFeedComponent {
  diaryService = inject(DiaryService);
  auth = inject(AuthService);

  toggleLike(id: string) {
    this.diaryService.toggleLike(id);
  }

  togglePin(id: string) {
    this.diaryService.togglePin(id);
  }
}
