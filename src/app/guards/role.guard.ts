import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OAuthService } from 'angular-oauth2-oidc';

export const roleGuard: CanActivateFn = (route, /* state */) => {
  const authService = inject(AuthService);
  const oauthService = inject(OAuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'] as string;

  // If we have OAuth tokens but no user in the auth service, try to handle the login
  if (oauthService.hasValidAccessToken() && !authService.currentUserValue) {
    // This will trigger the auth service to create a user from the OAuth tokens
    // We return false here to prevent access until the user is fully loaded
    return false;
  }

  if (authService.isLoggedIn() && authService.hasRole(requiredRole)) {
    return true;
  }

  // User doesn't have the required role, redirect to appropriate dashboard
  if (authService.isLoggedIn()) {
    // Redirect based on user's actual role
    if (authService.isAdmin()) {
      router.navigate(['/admin']);
    } else if (authService.isSupervisor()) {
      router.navigate(['/supervisor']);
    } else {
      router.navigate(['/employee']);
    }
  } else {
    // Not logged in, redirect to login
    router.navigate(['/login']);
  }
  
  return false;
};
