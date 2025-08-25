import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(Auth);
    const router = inject(Router);

    // Ajouter le token aux requêtes qui en ont besoin
    const token = authService.getToken();
    let authReq = req;

    if (token && !req.url.includes('/auth/')) {
        authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Si le token est invalide ou expiré (401 ou 403)
            if (error.status === 401 || error.status === 403) {
                console.log('Token invalide ou expiré, redirection vers la page de connexion');
                authService.logout();
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
