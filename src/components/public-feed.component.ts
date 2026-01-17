
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
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2 text-xs text-stone-400">
                  <span class="bg-stone-100 px-2 py-1 rounded text-stone-600 font-medium">
                    {{ diary.authorName }}
                  </span>
                  <span>•</span>
                  <span>{{ diary.date | date:'yyyy年MM月dd日' }}</span>
                </div>
                
                <!-- Social Actions for Author -->
                @if (auth.currentUser() && auth.currentUser()?.uid !== diary.uid) {
                  <div class="flex items-center gap-1">
                    <button (click)="toggleFollow(diary.uid)" 
                            [class.text-indigo-600]="isFollowing(diary.uid)"
                            class="text-xs px-2 py-0.5 rounded border hover:bg-stone-50 transition-colors"
                            [class.border-indigo-200]="isFollowing(diary.uid)"
                            [class.border-stone-200]="!isFollowing(diary.uid)">
                      {{ isFollowing(diary.uid) ? '已关注' : '+ 关注' }}
                    </button>
                    <button (click)="likeUser(diary.uid)" 
                            class="text-xs p-0.5 rounded text-pink-400 hover:text-pink-600 hover:bg-pink-50" 
                            title="给作者点赞 (每天一次)">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                         <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                       </svg>
                    </button>
                  </div>
                }
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
                 <!-- Like Button (Diary) -->
                 <button (click)="toggleLike(diary.id)" 
                         [class.text-red-500]="hasLiked(diary.id)"
                         [class.text-stone-400]="!hasLiked(diary.id)"
                         class="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" [attr.fill]="hasLiked(diary.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    <span class="text-sm font-medium">{{ diary.likedBy.length || 0 }}</span>
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
    if (!this.auth.currentUser()) {
      alert('请先登录');
      return;
    }
    this.diaryService.toggleLike(id);
  }

  hasLiked(id: string): boolean {
    return this.diaryService.hasLiked(id);
  }

  togglePin(id: string) {
    this.diaryService.togglePin(id);
  }

  toggleFollow(targetUid: string) {
    this.auth.toggleFollow(targetUid);
  }

  isFollowing(targetUid: string): boolean {
    const user = this.auth.currentUser();
    return user ? user.following.includes(targetUid) : false;
  }

  async likeUser(targetUid: string) {
    const result = await this.auth.likeUser(targetUid);
    alert(result.msg);
  }
}
