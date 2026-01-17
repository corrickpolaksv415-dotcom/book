
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DiaryService } from '../services/diary.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-personal-center',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Profile Header -->
      <div class="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex flex-col md:flex-row items-center gap-6">
        <div class="w-24 h-24 rounded-full bg-stone-800 text-white flex items-center justify-center text-3xl font-bold font-serif shadow-md">
          {{ auth.currentUser()?.username?.charAt(0)?.toUpperCase() }}
        </div>
        
        <div class="flex-1 text-center md:text-left">
          <h2 class="text-2xl font-bold text-stone-800 mb-1">
            {{ auth.currentUser()?.username }}
            @if (auth.isAdmin()) {
               <span class="inline-block align-middle ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">管理员</span>
            }
          </h2>
          <p class="text-stone-500 text-sm mb-4">UID: {{ auth.currentUser()?.uid }}</p>
          
          @if (!auth.isAdmin()) {
            <div class="flex items-center justify-center md:justify-start gap-2">
              <input type="password" [(ngModel)]="adminKey" placeholder="输入管理员密钥" 
                     class="px-3 py-1 text-sm border border-stone-300 rounded focus:outline-none focus:border-indigo-500 w-40 transition-all">
              <button (click)="tryActivateAdmin()" class="bg-stone-800 text-white px-3 py-1 rounded text-sm hover:bg-stone-900 transition-colors">
                验证
              </button>
            </div>
            @if (msg()) {
              <p class="text-xs text-red-500 mt-1">{{ msg() }}</p>
            }
          }
        </div>

        <div class="text-center md:text-right px-4">
          <div class="text-3xl font-bold text-indigo-600 font-serif">{{ diaryService.myDiaries().length }}</div>
          <div class="text-xs text-stone-500 uppercase tracking-wide">篇日记</div>
        </div>
      </div>

      <!-- Admin Panel (Only for admins) -->
      @if (auth.isAdmin()) {
        <div class="bg-stone-900 text-stone-200 p-6 rounded-xl shadow-lg border border-stone-800">
          <h3 class="text-lg font-bold mb-4 text-amber-500 flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
               <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.26 2.26 0 0 0 21 17.25l-5.83-5.83m0-5.66 5.66-5.66a2.26 2.26 0 0 0-3.18-3.18l-5.66 5.66m-5.66 9.19-2.58 2.58a2.26 2.26 0 0 1-3.18 0l-1.06-1.06a2.26 2.26 0 0 1 0-3.18l2.58-2.58m5.66 5.66-5.66-5.66m8.94.94a2.25 2.25 0 0 0-3.18 0l-3.37 3.37a2.25 2.25 0 0 0 0 3.18l1.72 1.72a2.25 2.25 0 0 0 3.18 0l3.37-3.37a2.25 2.25 0 0 0 0-3.18l-1.72-1.72Z" />
             </svg>
             管理员全站概览
          </h3>
          <p class="text-sm text-stone-400 mb-4">您可以查看、删除或置顶全站所有日记 (含私密)</p>
          
          <div class="space-y-2">
             @for (d of diaryService.adminAllDiaries(); track d.id) {
               <div class="flex items-center justify-between bg-stone-800 p-3 rounded border border-stone-700">
                 <div class="flex-1 min-w-0 flex items-center gap-3">
                   @if (d.coverImage) {
                      <img [src]="d.coverImage" class="w-10 h-10 object-cover rounded bg-stone-700">
                   }
                   <div class="min-w-0">
                     <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs bg-stone-700 px-1 rounded text-stone-300">{{ d.authorName }}</span>
                        <span class="text-xs text-stone-500">{{ d.visibility }}</span>
                        @if (d.isPinned) { <span class="text-xs text-amber-500">★ 置顶</span> }
                     </div>
                     <a [routerLink]="['/diary', d.id]" class="text-sm font-medium hover:text-indigo-400 truncate block">
                       {{ d.title }}
                     </a>
                   </div>
                 </div>
                 <div class="flex items-center gap-2 ml-4">
                    <button (click)="togglePin(d.id)" class="text-xs px-2 py-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-300">
                      {{ d.isPinned ? '取消置顶' : '置顶' }}
                    </button>
                    <button (click)="deleteDiary(d.id)" class="text-xs px-2 py-1 rounded bg-red-900/30 hover:bg-red-900 text-red-400 border border-red-900/50">
                      删除
                    </button>
                 </div>
               </div>
             }
          </div>
        </div>
      }

      <!-- My Diaries -->
      <div>
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-l-4 border-stone-800 pl-3">
           <h3 class="text-xl font-bold text-stone-800 font-serif">我的日记</h3>
           
           <!-- Filters -->
           <div class="flex flex-wrap items-center gap-2">
             <div class="relative">
                <input type="text" [(ngModel)]="searchKeyword" placeholder="搜索标题或内容..." 
                       class="pl-8 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-200 outline-none w-40 md:w-48">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 absolute left-2.5 top-2 text-stone-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
             </div>
             
             <input type="date" [(ngModel)]="startDate" class="px-2 py-1.5 text-sm border border-stone-200 rounded-lg text-stone-600 outline-none">
             <span class="text-stone-400">-</span>
             <input type="date" [(ngModel)]="endDate" class="px-2 py-1.5 text-sm border border-stone-200 rounded-lg text-stone-600 outline-none">
           </div>
        </div>
        
        @if (diaryService.myDiaries().length === 0) {
          <div class="text-center py-10 bg-white rounded-xl border border-dashed border-stone-300">
            <p class="text-stone-400 mb-4">还没有写过日记</p>
            <a routerLink="/write" class="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              开始记录
            </a>
          </div>
        } @else if (filteredDiaries().length === 0) {
           <div class="text-center py-10 text-stone-400">
             <p>没有找到符合条件的日记</p>
             <button (click)="resetFilters()" class="text-indigo-600 underline mt-2 text-sm">清除筛选</button>
           </div>
        }

        <div class="grid gap-4">
          @for (diary of filteredDiaries(); track diary.id) {
            <div class="bg-white p-5 rounded-xl shadow-sm border border-stone-100 flex group hover:border-indigo-100 transition-all relative overflow-hidden">
               
               @if (diary.isPinned) {
                 <div class="absolute top-0 right-0 z-10 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-bl font-bold">置顶</div>
               }

               <!-- Thumbnail -->
               @if (diary.coverImage) {
                 <div class="w-24 h-24 flex-shrink-0 mr-4 rounded-lg overflow-hidden bg-stone-100">
                   <img [src]="diary.coverImage" class="w-full h-full object-cover">
                 </div>
               }

               <div class="flex-1 min-w-0">
                 <div class="flex items-center gap-2 mb-1">
                   <span class="text-xs font-bold text-stone-400">
                     {{ diary.date | date:'yyyy/MM/dd' }}
                   </span>
                   <span class="text-[10px] px-2 py-0.5 rounded-full border border-stone-200 text-stone-500 uppercase">
                     {{ diary.visibility }}
                   </span>
                 </div>
                 <a [routerLink]="['/diary', diary.id]" class="block text-lg font-serif font-bold text-stone-800 truncate group-hover:text-indigo-600 transition-colors">
                   {{ diary.title }}
                 </a>
                 <p class="text-sm text-stone-500 truncate mt-1">{{ diary.content }}</p>
                 
                 @if (diary.majorEvents && diary.majorEvents.length > 0) {
                   <div class="mt-2 flex flex-wrap gap-2">
                     @for (event of diary.majorEvents; track event) {
                       <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                         ✨ {{ event }}
                       </span>
                     }
                   </div>
                 }
               </div>
               
               <div class="ml-4 flex flex-col justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                 <button (click)="deleteDiary(diary.id)" class="p-2 text-stone-300 hover:text-red-500" title="删除">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                     <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                   </svg>
                 </button>
                 
                 @if (auth.isAdmin()) {
                   <button (click)="togglePin(diary.id)" class="text-xs text-stone-400 hover:text-amber-500 mb-1">
                     {{ diary.isPinned ? '取消置顶' : '置顶' }}
                   </button>
                 }
               </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class PersonalCenterComponent {
  auth = inject(AuthService);
  diaryService = inject(DiaryService);
  
  adminKey = '';
  msg = signal('');

  // Filter Signals
  searchKeyword = signal('');
  startDate = signal('');
  endDate = signal('');

  // Filter Logic
  filteredDiaries = computed(() => {
    let diaries = this.diaryService.myDiaries();
    const keyword = this.searchKeyword().toLowerCase().trim();
    const start = this.startDate() ? new Date(this.startDate()).setHours(0,0,0,0) : null;
    const end = this.endDate() ? new Date(this.endDate()).setHours(23,59,59,999) : null;

    return diaries.filter(d => {
      // Keyword Match
      const matchKeyword = !keyword || 
                           d.title.toLowerCase().includes(keyword) || 
                           d.content.toLowerCase().includes(keyword) ||
                           (d.majorEvents && d.majorEvents.some(e => e.toLowerCase().includes(keyword)));
      
      // Date Match
      const diaryDate = new Date(d.date).setHours(0,0,0,0);
      const matchStart = !start || diaryDate >= start;
      const matchEnd = !end || diaryDate <= end;

      return matchKeyword && matchStart && matchEnd;
    });
  });

  resetFilters() {
    this.searchKeyword.set('');
    this.startDate.set('');
    this.endDate.set('');
  }

  tryActivateAdmin() {
    if (this.auth.activateAdmin(this.adminKey)) {
      this.msg.set('');
      this.adminKey = '';
      alert('管理员权限已开启！');
    } else {
      this.msg.set('密钥错误');
    }
  }

  deleteDiary(id: string) {
    if (confirm('确认删除？此操作不可恢复。')) {
      this.diaryService.deleteDiary(id);
    }
  }

  togglePin(id: string) {
    this.diaryService.togglePin(id);
  }
}
