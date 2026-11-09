import { Component, computed, signal, HostListener, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Auth } from './services/auth';
import { ThemeService } from './services/theme';
import { BiometricService } from './services/biometric';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  readonly title = signal('frontend');
  readonly userMenu = signal<boolean>(false);
  readonly activePath = signal<string>('');
  readonly currentYear = new Date().getFullYear();
  readonly isAuthRoute = computed(() => this.activePath() === '/login');

  constructor(private router: Router, private auth: Auth, readonly theme: ThemeService, readonly biometric: BiometricService) {
    this.activePath.set(this.router.url.split('?')[0]);
    // Listen to route changes
    this.router.events.subscribe(() => {
      this.activePath.set(this.router.url.split('?')[0]);
    });
  }

  ngOnInit() {
    // Vérifier l'authentification au démarrage
    if (!this.auth.isAuthenticated() && !this.isAuthRoute()) {
      this.router.navigate(['/login']);
    }
    if (this.biometric.enabled()) this.biometric.lock();
  }

  go(path: string) {
    this.router.navigate([path]);
  }

  quickSearch(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const query = target.value.trim();
    if (!query) return;
    this.router.navigate(['/search'], { queryParams: { q: query } });
    target.blur();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleUserMenu() { this.userMenu.set(!this.userMenu()); }
  toggleTheme() { this.theme.toggle(); }
  async toggleBiometric() {
    if (this.biometric.enabled()) this.biometric.disable();
    else await this.biometric.enable();
  }
  async unlock() { await this.biometric.unlock(); }
  closeUserMenu() { this.userMenu.set(false); }

  // Fermer le menu utilisateur en cliquant ailleurs
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const userMenuContainer = target.closest('.user-menu-container');
    if (!userMenuContainer && this.userMenu()) {
      this.closeUserMenu();
    }
  }
}
