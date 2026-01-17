
import { Component, inject, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from './services/auth.service';
import { AnnouncementService } from './services/announcement.service';
import { NotificationService } from './services/notification.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, DatePipe],
  templateUrl: './app.component.html',
})
export class AppComponent {
  auth = inject(AuthService);
  router = inject(Router);
  announcementService = inject(AnnouncementService);
  notificationService = inject(NotificationService);
  themeService = inject(ThemeService);

  showAnnouncement = signal(false);
  currentAnnouncement = this.announcementService.currentAnnouncement;

  unreadCount = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return 0;
    return this.notificationService.getUnreadCount(user.uid)();
  });

  constructor() {
    this.checkAnnouncement();
  }

  checkAnnouncement() {
    const ann = this.currentAnnouncement();
    if (ann && ann.active) {
      const seenId = sessionStorage.getItem('seen_announcement');
      if (seenId !== ann.id) {
        this.showAnnouncement.set(true);
      }
    }
  }

  closeAnnouncement() {
    this.showAnnouncement.set(false);
    const ann = this.currentAnnouncement();
    if (ann) {
      sessionStorage.setItem('seen_announcement', ann.id);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
