import { ChangeDetectorRef, Component, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.scss'
})
export class Login {
  username = '';
  password = '';
  isLoginMode = true;
  loading = false;
  error = '';

  constructor(private authService: Auth, private router: Router,
    private cdr: ChangeDetectorRef) {
    // Rediriger si déjà connecté
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/calendar']);
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.error = '';
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.error = '';

    const authObservable = this.isLoginMode
      ? this.authService.login(this.username, this.password)
      : this.authService.register(this.username, this.password);

    authObservable.subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate(['/calendar']);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'Une erreur est survenue';
        this.cdr.markForCheck();
      }
    });
  }
}
