import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

export const loginGuard: CanActivateFn = (route, state) => {
    const authService = inject(Auth);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        // Utilisateur déjà connecté, rediriger vers le calendrier
        router.navigate(['/calendar']);
        return false;
    } else {
        return true;
    }
};
