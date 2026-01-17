
import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FeedbackService } from '../services/feedback.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="max-w-4xl mx-auto">
      <header class="mb-8 border-b border-stone-200 pb-4">
        <h2 class="text-3xl font-serif text-stone-800">用户反馈</h2>
        <p class="text-stone-500 mt-2">您的建议是我们改进的动力</p>
      </header>

      <!-- Feedback Form -->
      <div class="bg-white p-8 rounded-xl shadow-sm border border-stone-200 mb-10">
        @if (submitted()) {
          <div class="text-center py-10">
            <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-stone-800 mb-2">感谢您的反馈！</h3>
            <p class="text-stone-500 mb-6">我们已收到您的建议，将尽快处理。</p>
            <button (click)="resetForm()" class="text-indigo-600 hover:underline">继续提交</button>
            <span class="mx-2 text-stone-300">|</span>
            <button (click)="goHome()" class="text-stone-500 hover:underline">返回首页</button>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-2">反馈类型</label>
              <select [(ngModel)]="type" name="type" class="w-full px-4 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-200">
                <option value="suggestion">💡 产品建议</option>
                <option value="bug">🐛 问题反馈</option>
                <option value="other">📝 其他</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-600 mb-2">详细内容</label>
              <textarea [(ngModel)]="content" name="content" rows="6" required placeholder="请详细描述您的建议或遇到的问题..."
                        class="w-full px-4 py-3 rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-200 resize-none"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-600 mb-2">联系方式 (选填)</label>
              <input type="text" [(ngModel)]="contact" name="contact" placeholder="邮箱或手机号，方便我们联系您"
                     class="w-full px-4 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-200">
            </div>

            <div class="pt-4">
              <button type="submit" [disabled]="!content || isSubmitting()" 
                      class="w-full bg-stone-800 hover:bg-stone-900 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {{ isSubmitting() ? '提交中...' : '提交反馈' }}
              </button>
            </div>
          </form>
        }
      </div>

      <!-- Admin Feedback Management Section -->
      @if (auth.isAdmin()) {
        <div class="mt-12">
           <h3 class="text-2xl font-serif text-stone-800 mb-6 flex items-center gap-2">
             <span class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-sm font-sans font-bold">Admin</span>
             反馈管理
           </h3>

           <div class="space-y-4">
             @if (feedbackService.allFeedback().length === 0) {
                <p class="text-stone-500 italic">暂无反馈记录。</p>
             }

             @for (item of feedbackService.allFeedback(); track item.id) {
               <div class="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                 <div class="flex justify-between items-start mb-4">
                   <div class="flex items-center gap-3">
                      <span [ngClass]="{
                        'bg-blue-100 text-blue-700': item.type === 'suggestion',
                        'bg-red-100 text-red-700': item.type === 'bug',
                        'bg-stone-100 text-stone-700': item.type === 'other'
                      }" class="px-2 py-1 rounded text-xs font-bold uppercase">
                        {{ item.type }}
                      </span>
                      <span class="text-xs text-stone-400">
                        {{ item.date | date:'yyyy/MM/dd HH:mm' }}
                      </span>
                      @if (item.contact) {
                        <span class="text-xs text-stone-500 bg-stone-50 px-2 py-1 rounded">
                          联系: {{ item.contact }}
                        </span>
                      }
                   </div>
                   <button (click)="deleteFeedback(item.id)" class="text-stone-400 hover:text-red-500" title="删除">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                       <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                     </svg>
                   </button>
                 </div>

                 <p class="text-stone-800 mb-4 whitespace-pre-wrap">{{ item.content }}</p>

                 <!-- Reply Section -->
                 <div class="bg-stone-50 p-4 rounded-lg border border-stone-100">
                    @if (item.reply) {
                      <div class="mb-3">
                        <p class="text-xs text-stone-400 font-bold mb-1">管理员回复 ({{ item.replyDate | date:'MM/dd HH:mm' }}):</p>
                        <p class="text-stone-700">{{ item.reply }}</p>
                      </div>
                    }
                    
                    <div class="mt-2">
                       <input #replyInput type="text" 
                              placeholder="输入回复内容..." 
                              (keyup.enter)="submitReply(item.id, replyInput.value); replyInput.value = ''"
                              class="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:outline-none focus:border-indigo-500 mb-2">
                       <button (click)="submitReply(item.id, replyInput.value); replyInput.value = ''"
                               class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700">
                         {{ item.reply ? '更新回复' : '发送回复' }}
                       </button>
                    </div>
                 </div>
               </div>
             }
           </div>
        </div>
      }
    </div>
  `
})
export class FeedbackComponent {
  router = inject(Router);
  feedbackService = inject(FeedbackService);
  auth = inject(AuthService);
  
  type = 'suggestion';
  content = '';
  contact = '';
  submitted = signal(false);
  isSubmitting = signal(false);

  async onSubmit() {
    if (!this.content) return;
    
    this.isSubmitting.set(true);
    await this.feedbackService.addFeedback({
      type: this.type,
      content: this.content,
      contact: this.contact
    });
    
    this.isSubmitting.set(false);
    this.submitted.set(true);
  }

  resetForm() {
    this.submitted.set(false);
    this.content = '';
    this.type = 'suggestion';
  }

  goHome() {
    this.router.navigate(['/']);
  }

  submitReply(id: string, reply: string) {
    if (!reply.trim()) return;
    // Replies are small updates, okay to be fire-and-forget, but theoretically could await
    this.feedbackService.replyToFeedback(id, reply);
  }

  deleteFeedback(id: string) {
    if(confirm('确定删除此反馈？')) {
      this.feedbackService.deleteFeedback(id);
    }
  }
}
