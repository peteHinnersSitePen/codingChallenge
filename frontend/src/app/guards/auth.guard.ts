import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Auth guard checking for route:', state.url);
  const isAuth = authService.isAuthenticated();
  console.log('Is authenticated:', isAuth);

  if (isAuth) {
    console.log('Auth guard: allowing access to', state.url);
    return true;
  }

  console.log('Auth guard: redirecting to login');
  router.navigate(['/login']);
  return false;
};
