
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <header class="mb-8 border-b border-stone-200 pb-4">
        <h2 class="text-3xl font-serif text-stone-800">🏆 排行榜</h2>
        <p class="text-stone-500 mt-2">看看谁是云端日记的明星</p>
      </header>

      <div class="grid md:grid-cols-2 gap-8">
        
        <!-- Most Followed -->
        <div class="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
           <div class="bg-indigo-600 px-6 py-4">
             <h3 class="text-white font-bold text-lg flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
               </svg>
               最具人气 (粉丝数)
             </h3>
           </div>
           <div class="divide-y divide-stone-100">
             @for (user of topFollowed(); track user.uid; let i = $index) {
               <div class="p-4 flex items-center gap-4 hover:bg-stone-50 transition-colors">
                 <div class="w-8 h-8 flex items-center justify-center font-bold rounded-full shadow-sm"
                      [ngClass]="{
                        'bg-yellow-400 text-white': i === 0,
                        'bg-stone-200 text-stone-600': i > 0
                      }">
                   {{ i + 1 }}
                 </div>
                 <div class="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold">
                    {{ user.username.charAt(0).toUpperCase() }}
                 </div>
                 <div class="flex-1">
                   <p class="font-bold text-stone-800">{{ user.username }}</p>
                   <p class="text-xs text-stone-500">UID: {{ user.uid }}</p>
                 </div>
                 <div class="text-indigo-600 font-bold">
                   {{ user.followers.length }} <span class="text-xs font-normal text-stone-400">粉丝</span>
                 </div>
               </div>
             }
           </div>
        </div>

        <!-- Most Liked -->
        <div class="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
           <div class="bg-pink-600 px-6 py-4">
             <h3 class="text-white font-bold text-lg flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
               </svg>
               最受喜爱 (获赞数)
             </h3>
           </div>
           <div class="divide-y divide-stone-100">
             @for (user of topLiked(); track user.uid; let i = $index) {
               <div class="p-4 flex items-center gap-4 hover:bg-stone-50 transition-colors">
                 <div class="w-8 h-8 flex items-center justify-center font-bold rounded-full shadow-sm"
                      [ngClass]="{
                        'bg-yellow-400 text-white': i === 0,
                        'bg-stone-200 text-stone-600': i > 0
                      }">
                   {{ i + 1 }}
                 </div>
                 <div class="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold">
                    {{ user.username.charAt(0).toUpperCase() }}
                 </div>
                 <div class="flex-1">
                   <p class="font-bold text-stone-800">{{ user.username }}</p>
                   <p class="text-xs text-stone-500">UID: {{ user.uid }}</p>
                 </div>
                 <div class="text-pink-600 font-bold">
                   {{ user.likesReceived }} <span class="text-xs font-normal text-stone-400">赞</span>
                 </div>
               </div>
             }
           </div>
        </div>

      </div>
    </div>
  `
})
export class LeaderboardComponent {
  authService = inject(AuthService);

  topFollowed = computed(() => {
    return this.authService.allUsers()
      .sort((a, b) => b.followers.length - a.followers.length)
      .slice(0, 10);
  });

  topLiked = computed(() => {
    return this.authService.allUsers()
      .sort((a, b) => b.likesReceived - a.likesReceived)
      .slice(0, 10);
  });
}
