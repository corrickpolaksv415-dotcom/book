
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DiaryService, Visibility } from '../services/diary.service';
import { AiService } from '../services/ai.service';

@Component({
  selector: 'app-diary-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <h2 class="text-3xl font-serif text-stone-800 mb-6">写日记</h2>
      
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-stone-200 space-y-6">
        
        <!-- Cover Image Upload -->
        <div>
           <label class="block text-sm font-medium text-stone-600 mb-2">封面图片 (可选)</label>
           
           @if (previewImage()) {
             <div class="relative w-full h-48 md:h-64 mb-3 rounded-lg overflow-hidden group bg-stone-100">
               <img [src]="previewImage()" class="w-full h-full object-cover">
               <button type="button" (click)="removeImage()" 
                       class="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
           }

           <div class="flex items-center justify-center w-full">
             <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-stone-300 border-dashed rounded-lg cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                 <div class="flex flex-col items-center justify-center pt-5 pb-6">
                     <svg class="w-8 h-8 mb-4 text-stone-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                         <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                     </svg>
                     <p class="text-sm text-stone-500"><span class="font-semibold">点击上传封面</span> (最大 2MB)</p>
                 </div>
                 <input type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)" />
             </label>
           </div>
        </div>

        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-stone-600 mb-2">标题</label>
          <input type="text" formControlName="title" placeholder="今天发生了什么..."
                 class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-400 focus:outline-none bg-stone-50 text-lg font-serif">
        </div>

        <!-- Content -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-stone-600">正文</label>
            
            <!-- Template Selectors -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-stone-400">使用模板:</span>
              <div class="flex gap-1">
                <button type="button" (click)="useTemplate('travel')" class="text-xs px-2 py-1 rounded bg-stone-100 hover:bg-blue-50 text-stone-600 hover:text-blue-600 transition-colors">旅行</button>
                <button type="button" (click)="useTemplate('reading')" class="text-xs px-2 py-1 rounded bg-stone-100 hover:bg-green-50 text-stone-600 hover:text-green-600 transition-colors">读书</button>
                <button type="button" (click)="useTemplate('mood')" class="text-xs px-2 py-1 rounded bg-stone-100 hover:bg-pink-50 text-stone-600 hover:text-pink-600 transition-colors">心情</button>
              </div>
            </div>
          </div>
          
          <textarea formControlName="content" rows="12" placeholder="记录下此刻的心情..."
                    class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-400 focus:outline-none bg-stone-50 font-serif leading-relaxed resize-y"></textarea>
        </div>

        <!-- Visibility Settings -->
        <div class="bg-stone-50 p-4 rounded-lg border border-stone-100">
          <label class="block text-sm font-medium text-stone-700 mb-3">权限设置</label>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <button type="button" (click)="setVisibility('private')" 
                    [class]="visibility() === 'private' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'"
                    class="px-3 py-2 rounded-md text-sm transition-colors">
              🔒 私密
            </button>
            <button type="button" (click)="setVisibility('public')"
                    [class]="visibility() === 'public' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'"
                    class="px-3 py-2 rounded-md text-sm transition-colors">
              🌍 公开
            </button>
            <button type="button" (click)="setVisibility('secret')"
                    [class]="visibility() === 'secret' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'"
                    class="px-3 py-2 rounded-md text-sm transition-colors">
              🔑 密钥
            </button>
            <button type="button" (click)="setVisibility('group')"
                    [class]="visibility() === 'group' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'"
                    class="px-3 py-2 rounded-md text-sm transition-colors">
              👥 团体
            </button>
          </div>

          <!-- Dynamic fields based on visibility -->
          @if (visibility() === 'secret') {
            <div class="animate-fade-in">
              <label class="text-xs text-stone-500 mb-1 block">设置访问密钥</label>
              <input type="text" formControlName="secretKey" placeholder="输入查看密码"
                     class="w-full px-3 py-2 rounded border border-stone-300 text-sm">
            </div>
          }

          @if (visibility() === 'group') {
            <div class="animate-fade-in">
              <label class="text-xs text-stone-500 mb-1 block">允许查看的用户 (用逗号分隔用户名)</label>
              <input type="text" formControlName="allowedUsers" placeholder="例如: user1, user2"
                     class="w-full px-3 py-2 rounded border border-stone-300 text-sm">
            </div>
          }
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-stone-100">
           <div class="flex items-center gap-2">
             @if (isAnalyzing()) {
               <span class="flex items-center text-indigo-600 text-sm animate-pulse">
                 <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                   <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 AI 正在提取重大事件...
               </span>
             } @else {
               <span class="text-xs text-stone-400">将自动生成日期与AI摘要</span>
             }
           </div>

           <button type="submit" [disabled]="form.invalid || isAnalyzing()"
                   class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
             保存日记
           </button>
        </div>
      </form>
    </div>
  `
})
export class DiaryEditorComponent {
  fb: FormBuilder = inject(FormBuilder);
  diaryService = inject(DiaryService);
  aiService = inject(AiService);
  router = inject(Router);

  visibility = signal<Visibility>('private');
  isAnalyzing = signal(false);
  previewImage = signal<string | null>(null);

  form = this.fb.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    secretKey: [''],
    allowedUsers: ['']
  });

  templates: Record<string, string> = {
    travel: `📍 地点：
🌤️ 天气：
🚗 交通：

📝 今日见闻：
(在这里记录你的一天...)

📸 最难忘的瞬间：`,
    reading: `📖 书名：
👤 作者：
⭐ 评分：⭐⭐⭐⭐⭐

💭 核心感悟：
(在这里写下你的读书心得...)

🖊️ 金句摘抄：`,
    mood: `📅 心情指数：😊
🌈 此时此刻：

💭 碎碎念：
(记录当下的想法...)

✨ 小确幸：`
  };

  setVisibility(v: Visibility) {
    this.visibility.set(v);
  }

  useTemplate(type: string) {
    const currentContent = this.form.get('content')?.value;
    const templateContent = this.templates[type];

    if (currentContent && currentContent.trim().length > 0) {
      if (!confirm('当前内容不为空，使用模板将覆盖现有内容。确定继续吗？')) {
        return;
      }
    }
    
    this.form.patchValue({ content: templateContent });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit
        alert('图片大小不能超过 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.previewImage.set(null);
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.isAnalyzing.set(true);
    const formVal = this.form.value;
    
    // AI Extraction
    const events = await this.aiService.extractMajorEvents(formVal.content || '');

    // Parse allowed users
    let allowedList: string[] = [];
    if (formVal.allowedUsers) {
      allowedList = formVal.allowedUsers.split(',').map(u => u.trim()).filter(u => u.length > 0);
    }

    // Critical: Await the cloud save
    await this.diaryService.addDiary({
      title: formVal.title!,
      content: formVal.content!,
      coverImage: this.previewImage() || undefined,
      visibility: this.visibility(),
      secretKey: formVal.secretKey || undefined,
      allowedUsers: allowedList,
      majorEvents: events
    });

    this.isAnalyzing.set(false);
    this.router.navigate(['/personal']);
  }
}
