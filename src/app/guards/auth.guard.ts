import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  // Commented out as it's not being used currently
  // const oauthService = inject(OAuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // Check if user is logged in via either the local auth service or OAuth
  if (authService.isLoggedIn()) {
    return true;
  }

  // If not logged in but we have a hash fragment, it might be an OAuth callback
  // Let the OAuth service handle it
  if (isBrowser && window.location.hash) {
    // The OAuth service will handle the token exchange
    return false;
  }

  // Not logged in, redirect to login page with return URL
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
