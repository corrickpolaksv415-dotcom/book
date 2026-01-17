
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiaryService, Diary } from '../services/diary.service';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import * as htmlToImage from 'html-to-image';

@Component({
  selector: 'app-diary-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    @if (diary()) {
      <div class="max-w-3xl mx-auto">
        <!-- Access Control Gate -->
        @if (!canView()) {
          <div class="bg-white p-10 rounded-xl shadow-lg border border-stone-200 text-center mt-10">
            
            @if (diary()!.visibility === 'secret') {
              <!-- Secret Key Required -->
              <div class="text-4xl mb-4">🔐</div>
              <h2 class="text-2xl font-serif text-stone-800 mb-2">此日记已加密</h2>
              <p class="text-stone-500 mb-6">请输入密钥以查看内容</p>
              
              <div class="max-w-xs mx-auto flex gap-2">
                <input type="text" [(ngModel)]="accessKey" placeholder="输入密钥" 
                       class="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none">
                <button (click)="checkAccess()" class="bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-stone-900 transition-colors">
                  解锁
                </button>
              </div>
              @if (accessError()) {
                <p class="text-red-500 mt-4 text-sm bg-red-50 py-1 px-3 rounded inline-block">{{ accessError() }}</p>
              }
            } @else {
              <!-- Private or Group Access Denied -->
              <div class="text-4xl mb-4">🚫</div>
              <h2 class="text-2xl font-serif text-stone-800 mb-2">无权访问</h2>
              <p class="text-stone-500 mb-6">
                @if (diary()!.visibility === 'private') {
                  这是一篇私密日记，仅作者可见。
                } @else {
                  您不在允许查看的成员列表中。
                }
              </p>
              <a (click)="goBack()" class="text-indigo-600 hover:underline cursor-pointer">返回上一页</a>
            }

          </div>
        } @else {
          <!-- Diary Content -->
          <article id="diary-content" class="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden print:shadow-none print:border-none">
            
            <!-- Hero Image -->
            @if (diary()!.coverImage) {
              <div class="w-full h-64 md:h-80 overflow-hidden relative">
                <img [src]="diary()!.coverImage" class="w-full h-full object-cover">
              </div>
            }

            <div class="p-8 md:p-12">
              <!-- Header -->
              <header class="mb-8 border-b border-stone-100 pb-6">
                <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div class="flex items-center gap-2">
                      <span [ngClass]="{
                        'bg-green-100 text-green-700': diary()!.visibility === 'public',
                        'bg-stone-100 text-stone-600': diary()!.visibility === 'private',
                        'bg-amber-100 text-amber-700': diary()!.visibility === 'secret',
                        'bg-blue-100 text-blue-700': diary()!.visibility === 'group'
                      }" class="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                          {{ getVisibilityLabel(diary()!.visibility) }}
                      </span>
                  </div>
                  <span class="text-stone-400 text-sm font-serif italic">
                    {{ diary()!.date | date:'yyyy年MM月dd日 HH:mm' }}
                  </span>
                </div>
                
                <h1 class="text-3xl md:text-4xl font-serif text-stone-900 leading-tight mb-4">
                  {{ diary()!.title }}
                </h1>
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-xs font-bold">
                      {{ diary()!.authorName.charAt(0).toUpperCase() }}
                    </div>
                    <span class="text-stone-600 font-medium text-sm">By {{ diary()!.authorName }}</span>
                  </div>
                  
                  <!-- Share/Action Buttons -->
                  <div class="flex gap-2 no-print items-center">
                    
                    @if (diary()!.visibility === 'public') {
                      <button (click)="toggleLike()" 
                              [class.text-red-500]="diaryService.isLikedInSession(diaryId())"
                              [class.text-stone-400]="!diaryService.isLikedInSession(diaryId())"
                              class="p-2 hover:bg-stone-100 rounded flex items-center gap-1 mr-2" title="点赞">
                        <svg xmlns="http://www.w3.org/2000/svg" [attr.fill]="diaryService.isLikedInSession(diaryId()) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        <span class="text-xs font-bold">{{ diary()!.likes || 0 }}</span>
                      </button>
                    }

                    <!-- Export Dropdown -->
                    <div class="relative group">
                      <button class="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded flex items-center gap-1" title="导出">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                          </svg>
                          <span class="text-xs font-medium">导出</span>
                      </button>
                      <!-- Dropdown Menu -->
                      <div class="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-stone-100 hidden group-hover:block z-50">
                          <button (click)="printPdf()" class="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-indigo-600 flex items-center gap-2">
                            📄 PDF / 打印
                          </button>
                          <button (click)="exportImage()" class="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-indigo-600 flex items-center gap-2">
                            🖼️ 图片 (PNG)
                          </button>
                          <button (click)="exportHtml()" class="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-indigo-600 flex items-center gap-2">
                            🌐 网页 (HTML)
                          </button>
                      </div>
                    </div>

                    <button (click)="copyLink()" class="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded" title="复制链接">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                    </button>
                    
                    @if (auth.isAdmin()) {
                      <div class="w-px h-4 bg-stone-300 mx-1"></div>
                      <button (click)="togglePin()" [class.text-amber-500]="diary()!.isPinned" class="p-2 text-stone-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="置顶">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                      </button>
                      <button (click)="deleteDiary()" class="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded" title="删除">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    }
                  </div>
                </div>
              </header>

              <!-- Major Events AI Section -->
              @if (diary()!.majorEvents && diary()!.majorEvents.length > 0) {
                <div class="mb-8 p-4 bg-stone-50 border-l-4 border-indigo-400 rounded-r-lg">
                  <h3 class="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                    重大事件 (AI识别)
                  </h3>
                  <ul class="list-disc list-inside text-stone-700 space-y-1 text-sm">
                    @for (event of diary()!.majorEvents; track event) {
                      <li>{{ event }}</li>
                    }
                  </ul>
                </div>
              }

              <!-- Main Body -->
              <div class="prose prose-stone prose-lg max-w-none font-serif text-stone-800 whitespace-pre-wrap leading-loose">
                {{ diary()!.content }}
              </div>
              
              <footer class="mt-12 pt-8 border-t border-stone-100 text-center text-stone-400 text-sm">
                <p>云端日记 • 记录生活</p>
              </footer>
            </div>
          </article>
        }
      </div>
    } @else {
      <div class="text-center mt-20 text-stone-500">
        <p>找不到日记或已被删除</p>
        <a routerLink="/feed" class="text-indigo-600 underline mt-4 inline-block">返回广场</a>
      </div>
    }
  `
})
export class DiaryDetailComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  diaryService = inject(DiaryService);
  auth = inject(AuthService);
  
  diaryId = signal<string>('');
  accessKey = '';
  accessError = signal('');
  isUnlocked = signal(false);

  diary = computed(() => {
    return this.diaryService.getDiaryById(this.diaryId());
  });

  canView = computed(() => {
    const d = this.diary();
    if (!d) return false;
    
    // If unlocked locally
    if (this.isUnlocked()) return true;

    // Use service logic which checks user/admin/public
    // Note: service.canView(d) returns false for 'secret' without key.
    if (this.diaryService.canView(d)) return true;
    
    return false;
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.diaryId.set(id);
    });
  }

  checkAccess() {
    const d = this.diary();
    if (d && d.visibility === 'secret') {
      if (d.secretKey === this.accessKey) {
        this.isUnlocked.set(true);
        this.accessError.set('');
      } else {
        this.accessError.set('密钥错误');
      }
    }
  }

  getVisibilityLabel(v: string) {
    switch(v) {
      case 'public': return '公开';
      case 'private': return '私密';
      case 'secret': return '加密';
      case 'group': return '团体';
      default: return '未知';
    }
  }

  toggleLike() {
      this.diaryService.toggleLike(this.diaryId());
  }

  // --- Export Functions ---

  printPdf() {
    window.print();
  }

  async exportImage() {
    const node = document.getElementById('diary-content');
    if (!node) return;

    try {
      const dataUrl = await htmlToImage.toPng(node, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2, // Better quality
        style: { margin: '0' }
      });
      const link = document.createElement('a');
      link.download = `diary-${this.diary()?.title || 'image'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Image export failed:', error);
      alert('图片导出失败，请重试或使用截图功能。');
    }
  }

  exportHtml() {
    const d = this.diary();
    if (!d) return;

    // Create a standalone HTML string
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${d.title} - 云端日记</title>
    <style>
        body { font-family: "Georgia", "Noto Serif SC", serif; background: #fdfbf7; color: #333; padding: 40px; line-height: 1.8; max-width: 800px; margin: 0 auto; }
        header { border-bottom: 1px solid #ddd; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { margin: 0 0 10px 0; font-size: 2.5em; color: #1c1917; }
        .meta { color: #666; font-size: 0.9em; font-style: italic; display: flex; justify-content: space-between; }
        .content { white-space: pre-wrap; font-size: 1.1em; }
        .events { background: #eef2ff; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #6366f1; }
        .events h3 { margin: 0 0 10px 0; font-size: 0.9em; color: #4338ca; text-transform: uppercase; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 0.8em; color: #999; }
        .hero { width: 100%; height: auto; max-height: 400px; object-fit: cover; margin-bottom: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    ${d.coverImage ? `<img src="${d.coverImage}" class="hero" />` : ''}
    <header>
        <h1>${d.title}</h1>
        <div class="meta">
            <span>By ${d.authorName}</span>
            <span>${new Date(d.date).toLocaleDateString()}</span>
        </div>
    </header>

    ${d.majorEvents && d.majorEvents.length > 0 ? `
    <div class="events">
        <h3>AI 提取摘要</h3>
        <ul>${d.majorEvents.map(e => `<li>${e}</li>`).join('')}</ul>
    </div>` : ''}

    <div class="content">${d.content}</div>

    <div class="footer">
        Generated by 云端日记
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('链接已复制到剪贴板');
    });
  }

  deleteDiary() {
    if (confirm('确定要删除这篇日记吗？')) {
      this.diaryService.deleteDiary(this.diaryId());
      this.router.navigate(['/feed']);
    }
  }

  togglePin() {
    this.diaryService.togglePin(this.diaryId());
  }

  goBack() {
    window.history.back();
  }
}
