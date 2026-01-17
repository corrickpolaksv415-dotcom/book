
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { PublicFeedComponent } from './components/public-feed.component';
import { PersonalCenterComponent } from './components/personal-center.component';
import { DiaryEditorComponent } from './components/diary-editor.component';
import { DiaryDetailComponent } from './components/diary-detail.component';
import { FeedbackComponent } from './components/feedback.component';
import { LeaderboardComponent } from './components/leaderboard.component';
import { NotificationsComponent } from './components/notifications.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

const authGuard = () => {
  const auth = inject(AuthService);
  return auth.currentUser() ? true : false;
};

export const routes: Routes = [
  { path: '', redirectTo: 'feed', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'feed', component: PublicFeedComponent },
  { path: 'personal', component: PersonalCenterComponent, canActivate: [authGuard] },
  { path: 'write', component: DiaryEditorComponent, canActivate: [authGuard] },
  { path: 'diary/:id', component: DiaryDetailComponent },
  { path: 'feedback', component: FeedbackComponent },
  { path: 'leaderboard', component: LeaderboardComponent },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
];
