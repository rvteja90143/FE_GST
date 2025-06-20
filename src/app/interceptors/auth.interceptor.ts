import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';

// Functional interceptor pattern for Angular 16+
export const AuthInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Use inject function to get the OAuthService
  const oauthService = inject(OAuthService);

  // Skip if the request is to the Auth0 token endpoint or userinfo endpoint
  if (request.url.includes('auth0.com')) {
    return next(request);
  }

  // First try to get the token from OAuth service
  let token = oauthService.hasValidAccessToken() ? oauthService.getAccessToken() : null;
  
  // Get token from localStorage for legacy authentication
  if (!token && typeof localStorage !== 'undefined') {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        token = user.token;
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  }

  // If we have a token, add it to the request
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request);
};
