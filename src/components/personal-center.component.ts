
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DiaryService } from '../services/diary.service';
import { AnnouncementService } from '../services/announcement.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-personal-center',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Profile Header (Personal Homepage) -->
      <div class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        <!-- Cover Image Area -->
        <div class="h-48 bg-stone-200 relative group">
          @if (isEditingProfile() && previewCover()) {
             <img [src]="previewCover()" class="w-full h-full object-cover">
             <button (click)="removeCover()" class="absolute top-4 right-4 z-20 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
             </button>
          } @else if (!isEditingProfile() && auth.currentUser()?.profileCover) {
             <img [src]="auth.currentUser()?.profileCover" class="w-full h-full object-cover">
          } @else {
             <div class="w-full h-full bg-gradient-to-r from-stone-200 to-stone-300 flex items-center justify-center text-stone-400">
               <span class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                  暂无封面
               </span>
             </div>
          }
          
          @if (isEditingProfile()) {
             <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <label class="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-colors border border-white/40 shadow-sm">
                  <span class="flex items-center gap-2 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    更换封面
                  </span>
                  <input type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)">
                </label>
             </div>
          }
        </div>

        <!-- Profile Info Area -->
        <div class="px-6 pb-6 relative">
           <div class="flex flex-wrap justify-between items-end -mt-12 mb-4">
              <!-- Avatar -->
              <div class="w-32 h-32 rounded-full border-4 border-white bg-stone-800 text-white flex items-center justify-center text-4xl font-bold font-serif shadow-md z-10 relative bg-cover bg-center"
                   [ngClass]="{'bg-stone-800': true}">
                 {{ auth.currentUser()?.username?.charAt(0)?.toUpperCase() }}
              </div>
              
              <!-- Edit Actions -->
              <div class="mb-2 mt-14 md:mt-0">
                 @if (!isEditingProfile()) {
                   <button (click)="startEdit()" class="px-4 py-2 bg-white border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                     编辑个人主页
                   </button>
                 } @else {
                   <div class="flex gap-2">
                     <button (click)="cancelEdit()" class="px-4 py-2 bg-white border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">取消</button>
                     <button (click)="saveProfile()" class="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-900 transition-colors">保存更改</button>
                   </div>
                 }
              </div>
           </div>

           <!-- User Details -->
           <div class="mb-6">
              <h2 class="text-2xl font-bold text-stone-800 flex items-center gap-2">
                 {{ auth.currentUser()?.username }}
                 @if (auth.isAdmin()) {
                   <span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded align-middle border border-amber-200">管理员</span>
                 }
              </h2>
              <p class="text-stone-400 text-xs mb-3 font-mono">UID: {{ auth.currentUser()?.uid }}</p>
              
              @if (isEditingProfile()) {
                <div class="animate-fade-in">
                  <label class="block text-xs font-bold text-stone-500 uppercase mb-1">个人简介</label>
                  <textarea [(ngModel)]="editBio" rows="3" class="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:outline-none bg-stone-50 text-sm" placeholder="介绍一下你自己..."></textarea>
                </div>
              } @else {
                <div class="text-stone-600 mt-2 whitespace-pre-wrap leading-relaxed max-w-2xl text-sm md:text-base border-l-2 border-stone-200 pl-4">
                  {{ auth.currentUser()?.bio || '这个人很懒，什么都没有写...' }}
                </div>
              }
           </div>

           <!-- Stats Bar -->
           <div class="flex flex-wrap items-center gap-x-8 gap-y-4 py-4 border-t border-stone-100">
              <div class="text-center min-w-[3rem]">
                 <div class="font-bold text-xl text-stone-800 font-serif">{{ auth.currentUser()?.following?.length || 0 }}</div>
                 <div class="text-xs text-stone-500 uppercase tracking-wide">关注</div>
              </div>
              <div class="text-center min-w-[3rem]">
                 <div class="font-bold text-xl text-stone-800 font-serif">{{ auth.currentUser()?.followers?.length || 0 }}</div>
                 <div class="text-xs text-stone-500 uppercase tracking-wide">粉丝</div>
              </div>
              <div class="text-center min-w-[3rem]">
                 <div class="font-bold text-xl text-pink-600 font-serif">{{ auth.currentUser()?.likesReceived || 0 }}</div>
                 <div class="text-xs text-stone-500 uppercase tracking-wide">获赞</div>
              </div>
              <div class="w-px h-8 bg-stone-200 hidden md:block"></div>
              <div class="text-center min-w-[3rem]">
                 <div class="font-bold text-xl text-indigo-600 font-serif">{{ diaryService.myDiaries().length }}</div>
                 <div class="text-xs text-stone-500 uppercase tracking-wide">日记</div>
              </div>
              
              <!-- Admin Verification -->
               @if (!auth.isAdmin() && !isEditingProfile()) {
                 <div class="ml-auto flex items-center gap-2">
                   <input type="password" [(ngModel)]="adminKey" placeholder="管理员密钥" 
                          class="px-2 py-1 text-xs border border-stone-200 rounded focus:outline-none w-24 bg-stone-50">
                   <button (click)="tryActivateAdmin()" class="text-xs bg-stone-800 text-white px-2 py-1 rounded hover:bg-stone-900 transition-colors">
                     验证
                   </button>
                   @if (msg()) { <span class="text-xs text-red-500">{{ msg() }}</span> }
                 </div>
               }
           </div>
        </div>
      </div>

      <!-- Cloud Sync Status Indicator -->
      <div class="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-3 text-green-700 text-sm">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
           <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
         </svg>
         <span>云端数据实时同步中。您的日记在所有设备上均可访问。</span>
      </div>

      <!-- Admin Panel (Only for admins) -->
      @if (auth.isAdmin()) {
        <div class="grid lg:grid-cols-3 gap-6">
           <!-- Global Diary Management -->
           <div class="bg-stone-900 text-stone-200 p-6 rounded-xl shadow-lg border border-stone-800 max-h-96 overflow-y-auto">
             <h3 class="text-lg font-bold mb-4 text-amber-500 flex items-center gap-2 sticky top-0 bg-stone-900 pb-2 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                日记管理
             </h3>
             <div class="space-y-2">
                @for (d of diaryService.adminAllDiaries(); track d.id) {
                  <div class="flex items-center justify-between bg-stone-800 p-3 rounded border border-stone-700">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                         <span class="text-xs bg-stone-700 px-1 rounded text-stone-300">{{ d.authorName }}</span>
                         <span class="text-xs text-stone-500">{{ d.visibility }}</span>
                         @if (d.isPinned) { <span class="text-xs text-amber-500">★ 置顶</span> }
                      </div>
                      <a [routerLink]="['/diary', d.id]" class="text-sm font-medium hover:text-indigo-400 truncate block">
                        {{ d.title }}
                      </a>
                    </div>
                    <div class="flex items-center gap-2 ml-4">
                       <button (click)="togglePin(d.id)" class="text-xs px-2 py-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-300">
                         {{ d.isPinned ? '取顶' : '置顶' }}
                       </button>
                       <button (click)="deleteDiary(d.id)" class="text-xs px-2 py-1 rounded bg-red-900/30 hover:bg-red-900 text-red-400 border border-red-900/50">
                         删除
                       </button>
                    </div>
                  </div>
                }
             </div>
           </div>

           <!-- User Management -->
           <div class="bg-gray-800 text-gray-200 p-6 rounded-xl shadow-lg border border-gray-700 max-h-96 overflow-y-auto">
             <h3 class="text-lg font-bold mb-4 text-blue-400 flex items-center gap-2 sticky top-0 bg-gray-800 pb-2 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
                用户管理
             </h3>
             <div class="space-y-2">
                @for (u of auth.allUsers(); track u.uid) {
                  <div class="flex items-center justify-between bg-gray-700 p-3 rounded border border-gray-600">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                         <span class="font-bold text-gray-100 truncate">{{ u.username }}</span>
                         @if (u.isAdmin) { <span class="text-xs bg-amber-500/20 text-amber-500 px-1 rounded">管理员</span> }
                      </div>
                      <div class="text-xs text-gray-400 flex gap-2 mt-1">
                        <span>UID: {{ u.uid.substring(0,6) }}...</span>
                        <span>粉丝: {{ u.followers.length }}</span>
                        <span>获赞: {{ u.likesReceived }}</span>
                      </div>
                    </div>
                    @if (!u.isAdmin) {
                      <button (click)="deleteUser(u.uid)" class="ml-2 text-xs px-2 py-1 rounded bg-red-900/30 hover:bg-red-900 text-red-400 border border-red-900/50">
                        注销
                      </button>
                    }
                  </div>
                }
             </div>
           </div>

           <!-- Announcement Management -->
           <div class="bg-indigo-900 text-indigo-100 p-6 rounded-xl shadow-lg border border-indigo-800">
             <h3 class="text-lg font-bold mb-4 text-white flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.43.72 1.068.72 1.96" />
               </svg>
               系统公告
             </h3>
             
             @if (announcementService.currentAnnouncement()) {
               <div class="bg-indigo-800 p-4 rounded mb-4">
                 <p class="text-sm opacity-75 mb-1">当前公告:</p>
                 <p class="font-medium whitespace-pre-wrap">{{ announcementService.currentAnnouncement()?.content }}</p>
                 <button (click)="clearAnnouncement()" class="mt-3 text-xs bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded">
                   撤销公告
                 </button>
               </div>
             }

             <div>
               <label class="block text-xs uppercase opacity-70 mb-2">发布新公告</label>
               <textarea [(ngModel)]="announcementText" rows="4" class="w-full bg-indigo-950/50 border border-indigo-700 rounded p-3 text-sm focus:outline-none focus:border-white mb-3" placeholder="输入公告内容..."></textarea>
               <button (click)="publishAnnouncement()" class="w-full bg-white text-indigo-900 font-bold py-2 rounded hover:bg-indigo-100 transition-colors">
                 发布
               </button>
             </div>
           </div>
        </div>
      }

      <!-- My Diaries -->
      <div>
        <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 border-l-4 border-stone-800 pl-3">
           <h3 class="text-xl font-bold text-stone-800 font-serif whitespace-nowrap">我的日记</h3>
           
           <!-- Filters and Sorting -->
           <div class="flex flex-col md:flex-row flex-wrap items-center gap-2 w-full xl:w-auto">
             <div class="relative w-full md:w-auto">
                <input type="text" [(ngModel)]="searchKeyword" 
                       (focus)="showHistory.set(true)" 
                       (blur)="delayHideHistory()" 
                       (keydown.enter)="saveSearch()"
                       placeholder="搜索标题或内容..." 
                       class="w-full md:w-48 pl-8 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-200 outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 absolute left-2.5 top-2 text-stone-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>

                <!-- Search History Dropdown -->
                @if (showHistory() && searchHistory().length > 0) {
                  <div class="absolute top-full left-0 w-full bg-white shadow-lg rounded-b-lg border border-t-0 border-stone-200 z-50 overflow-hidden">
                    <div class="text-xs text-stone-400 px-3 py-1 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                      <span>搜索历史</span>
                      <button (click)="clearHistory()" class="hover:text-red-500">清空</button>
                    </div>
                    <ul>
                      @for (item of searchHistory(); track item) {
                        <li>
                          <button (click)="selectHistory(item)" class="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 truncate">
                            {{ item }}
                          </button>
                        </li>
                      }
                    </ul>
                  </div>
                }
             </div>
             
             <div class="flex items-center gap-2 w-full md:w-auto">
               <input type="date" [(ngModel)]="startDate" class="flex-1 md:flex-none px-2 py-1.5 text-sm border border-stone-200 rounded-lg text-stone-600 outline-none">
               <span class="text-stone-400">-</span>
               <input type="date" [(ngModel)]="endDate" class="flex-1 md:flex-none px-2 py-1.5 text-sm border border-stone-200 rounded-lg text-stone-600 outline-none">
             </div>

             <div class="w-full md:w-auto">
               <select [(ngModel)]="sortOption" class="w-full md:w-auto px-2 py-1.5 text-sm border border-stone-200 rounded-lg text-stone-600 outline-none bg-white">
                 <option value="date-desc">📅 日期 (最新)</option>
                 <option value="date-asc">📅 日期 (最早)</option>
                 <option value="title-asc">🅰️ 标题 (A-Z)</option>
                 <option value="events-desc">✨ 事件数量 (多到少)</option>
               </select>
             </div>
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
  announcementService = inject(AnnouncementService);
  
  adminKey = '';
  msg = signal('');
  announcementText = '';

  // Profile Edit
  isEditingProfile = signal(false);
  editBio = '';
  previewCover = signal<string | null>(null);

  // Filter Signals
  searchKeyword = signal('');
  startDate = signal('');
  endDate = signal('');
  sortOption = signal('date-desc'); 

  // Search History
  searchHistory = signal<string[]>(this.loadSearchHistory());
  showHistory = signal(false);

  // Filter Logic
  filteredDiaries = computed(() => {
    let diaries = this.diaryService.myDiaries();
    const keyword = this.searchKeyword().toLowerCase().trim();
    const start = this.startDate() ? new Date(this.startDate()).setHours(0,0,0,0) : null;
    const end = this.endDate() ? new Date(this.endDate()).setHours(23,59,59,999) : null;

    // 1. Filter
    let filtered = diaries.filter(d => {
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

    // 2. Sort
    const sort = this.sortOption();
    return filtered.sort((a, b) => {
      switch (sort) {
        case 'date-desc':
          return b.date - a.date;
        case 'date-asc':
          return a.date - b.date;
        case 'title-asc':
          return a.title.localeCompare(b.title, 'zh-CN');
        case 'events-desc':
          return (b.majorEvents?.length || 0) - (a.majorEvents?.length || 0);
        default:
          return b.date - a.date;
      }
    });
  });

  constructor() {}

  // --- Profile Edit Logic ---
  startEdit() {
    const user = this.auth.currentUser();
    this.editBio = user?.bio || '';
    this.previewCover.set(user?.profileCover || null);
    this.isEditingProfile.set(true);
  }

  cancelEdit() {
    this.isEditingProfile.set(false);
    this.previewCover.set(null);
  }

  saveProfile() {
    this.auth.updateUserProfile({
      bio: this.editBio,
      profileCover: this.previewCover() || undefined
    });
    this.isEditingProfile.set(false);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        alert('图片大小不能超过 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.previewCover.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeCover() {
    this.previewCover.set(null);
  }

  // --- Search History Logic ---
  private loadSearchHistory(): string[] {
    try {
      const data = localStorage.getItem('app_search_history_v1');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveSearch() {
    const kw = this.searchKeyword().trim();
    if (!kw) {
      this.showHistory.set(false);
      return;
    }
    
    let history = this.searchHistory();
    // Remove existing if present to move to top
    history = history.filter(item => item !== kw);
    // Add to front
    history.unshift(kw);
    // Limit to 10
    if (history.length > 10) history.pop();
    
    this.searchHistory.set(history);
    localStorage.setItem('app_search_history_v1', JSON.stringify(history));
    this.showHistory.set(false);
  }

  selectHistory(item: string) {
    this.searchKeyword.set(item);
    this.showHistory.set(false);
  }

  clearHistory() {
    this.searchHistory.set([]);
    localStorage.removeItem('app_search_history_v1');
  }
  
  delayHideHistory() {
    // Delay hiding to allow click event on dropdown items to register
    setTimeout(() => {
      this.showHistory.set(false);
    }, 200);
  }

  // --- Admin User Logic ---
  deleteUser(uid: string) {
    if (confirm('警告：删除用户将同时删除该用户的所有日记且无法恢复。确定继续？')) {
      this.auth.deleteUser(uid);
      this.diaryService.deleteDiariesByAuthor(uid);
    }
  }

  // --- Existing Methods ---

  resetFilters() {
    this.searchKeyword.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.sortOption.set('date-desc');
  }

  async tryActivateAdmin() {
    const success = await this.auth.activateAdmin(this.adminKey);
    if (success) {
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

  publishAnnouncement() {
    if (!this.announcementText) return;
    this.announcementService.setAnnouncement(this.announcementText);
    this.announcementText = '';
    alert('公告已发布');
  }

  clearAnnouncement() {
    if(confirm('确定撤销当前公告？')) {
        this.announcementService.clearAnnouncement();
    }
  }
}
