import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(Auth);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    } else {
        router.navigate(['/login']);
        return false;
    }
};
