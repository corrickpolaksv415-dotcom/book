
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg border border-stone-100">
      <h2 class="text-3xl font-serif text-center mb-8 text-stone-800">
        {{ isRegister() ? '注册账号' : '欢迎回来' }}
      </h2>
      
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-stone-600 mb-1">用户名</label>
          <input type="text" formControlName="username" 
                 class="w-full px-4 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-stone-400 focus:outline-none bg-stone-50">
          @if (form.get('username')?.touched && form.get('username')?.errors) {
            <p class="text-red-500 text-xs mt-1">请输入用户名</p>
          }
        </div>

        <div>
          <label class="block text-sm font-medium text-stone-600 mb-1">密码</label>
          <input type="password" formControlName="password" 
                 class="w-full px-4 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-stone-400 focus:outline-none bg-stone-50">
          @if (form.get('password')?.touched && form.get('password')?.errors) {
            <p class="text-red-500 text-xs mt-1">请输入密码 (至少4位)</p>
          }
        </div>

        @if (error()) {
          <div class="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
            {{ error() }}
          </div>
        }

        <button type="submit" [disabled]="form.invalid"
                class="w-full bg-stone-800 hover:bg-stone-900 text-white py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          {{ isRegister() ? '立即注册' : '登录' }}
        </button>

        <div class="text-center text-sm text-stone-500">
          <button type="button" (click)="toggleMode()" class="text-indigo-600 hover:underline">
            {{ isRegister() ? '已有账号？去登录' : '没有账号？去注册' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class LoginComponent {
  fb: FormBuilder = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);

  isRegister = signal(false);
  error = signal('');

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  toggleMode() {
    this.isRegister.set(!this.isRegister());
    this.error.set('');
    this.form.reset();
  }

  onSubmit() {
    if (this.form.invalid) return;

    const { username, password } = this.form.value;
    if (!username || !password) return;

    if (this.isRegister()) {
      const success = this.auth.register(username, password);
      if (success) {
        this.router.navigate(['/personal']);
      } else {
        this.error.set('用户名已存在');
      }
    } else {
      const success = this.auth.login(username, password);
      if (success) {
        this.router.navigate(['/personal']);
      } else {
        this.error.set('用户名或密码错误');
      }
    }
  }
}
