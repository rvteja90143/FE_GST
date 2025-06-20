import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../models/user';
import { Auth0Claims } from '../models/auth0-claims.model';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService, OAuthErrorEvent } from 'angular-oauth2-oidc';
import { authConfig } from '../auth/auth.config';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = 'https://localhost:7133/api/Auth'; // Replace with your actual API URL in production

  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private oauthService: OAuthService,
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    let storedUser = null;
    
    if (this.isBrowser) {
      storedUser = localStorage.getItem('currentUser');
    }
    
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Configure OAuth service
    this.configureOAuth();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private configureOAuth(): void {
    if (!this.isBrowser) return;

    try {
      console.log('Configuring OAuth...');
      
      // Configure OAuth
      this.oauthService.configure(authConfig);
      
      // Subscribe to token events
      this.oauthService.events.subscribe(event => {
        if (event instanceof OAuthErrorEvent) {
          console.error('OAuth error', event);
          this.toastr.error('Authentication error occurred', 'OAuth Error');
        } else {
          console.log('OAuth event', event);
        }
      });

      // For testing purposes, we'll use a mock login flow instead of the actual OAuth flow
      // In a real implementation, you would uncomment the following code:
      /*
      // Automatically load discovery document and try login
      this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
        // Check if the user is logged in
        if (this.oauthService.hasValidAccessToken()) {
          this.handleSuccessfulLogin();
        }
        
        // Setup automatic silent refresh
        this.oauthService.setupAutomaticSilentRefresh();
      });
      */
      
      console.log('OAuth configuration complete');
    } catch (error) {
      console.error('Error configuring OAuth:', error);
    }
  }

  private handleSuccessfulLogin(): void {
    // Get user claims from ID token
    const claims = this.oauthService.getIdentityClaims();
    if (!claims) return;
    
    // Map Auth0 user to our User model
    // Note: You'll need to adjust this mapping based on your Auth0 configuration
    // and how you've set up roles in Auth0
    const user: User = {
      username: claims['email'] || claims['name'] || 'user',
      // Default to 'employee' role if no role is specified
      // In a real app, you'd get this from Auth0 app_metadata or similar
      role: this.mapAuth0RoleToAppRole(claims),
      token: this.oauthService.getAccessToken()
    };
    
    // Store user in local storage
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    // Update the authentication state
    this.currentUserSubject.next(user);
    
    // Show success notification
    this.toastr.success(`Welcome ${user.username}`, 'Login Successful');
  }

  private mapAuth0RoleToAppRole(claims: Auth0Claims): 'admin' | 'supervisor' | 'employee' {
    // This is a simplified example. In a real app, you would map Auth0 roles to your app roles
    // based on your Auth0 configuration (e.g., from app_metadata, roles claim, etc.)
    
    // Check if roles are in the token (depends on your Auth0 setup)
    const roles = claims['https://myapp.com/roles'] || claims.roles || [];
    
    // Ensure roles is an array before using includes
    if (Array.isArray(roles)) {
      if (roles.includes('admin')) {
        return 'admin';
      } else if (roles.includes('supervisor')) {
        return 'supervisor';
      }
    }
    
    // Default role if no valid roles found
    return 'employee';
  }

  // Initiate OAuth login flow
  login(): void {
    if (!this.isBrowser) return;
    console.log('Initiating OAuth login flow...');
    
    try {
      // For testing purposes, we'll use a mock login flow instead of the actual OAuth flow
      // In a real implementation, you would use the following code:
      // this.oauthService.initLoginFlow();
      
      // For now, let's use the mock login to simulate a successful login
      console.log('Using mock login for testing...');
      this.mockLogin('admin', 'admin');
      this.toastr.info('Using mock login for testing', 'Development Mode');
    } catch (error) {
      console.error('Error initiating login flow:', error);
    }
  }
  
  // Legacy login method for backward compatibility
  legacyLogin(username: string, password: string): Observable<User> {
    console.log('Attempting to login with API:', this.apiUrl);
    interface LoginResponse {
      username?: string;
      roles?: string[];
      token?: string;
      [key: string]: unknown;
    }
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        map(response => {
          console.log('API login response:', response);
          
          // Transform the API response into a User object
          // Adjust this mapping based on your actual API response structure
          const user: User = {
            username: response.username || username,
            role: (response.roles && response.roles.length > 0 ? 
              (response.roles[0].toLowerCase() === 'admin' ? 'admin' : 
               response.roles[0].toLowerCase() === 'supervisor' ? 'supervisor' : 'employee') : 
              'employee') as 'admin' | 'supervisor' | 'employee',
            token: response.token
          };
          
          console.log('Transformed user object:', user);
          
          // Store user details and token in local storage
          if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          
          // Update the authentication state
          this.currentUserSubject.next(user);
          
          return user;
        }),
        catchError(error => {
          console.error('Login API error:', error);
          return throwError(() => new Error('Invalid credentials'));
        })
      );
  }

  // For demo purposes, we'll simulate a successful login
  // This can be used for development/testing when Auth0 is not configured
  mockLogin(username: string, password: string): Observable<User> {
    // In a real app, remove this method and use the actual login method above
    if (username === 'admin' && password === 'admin') {
      const user: User = { username, role: 'admin', token: 'fake-jwt-token' };
      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      this.currentUserSubject.next(user);
      return of(user);
    } else if (username === 'supervisor' && password === 'supervisor') {
      const user: User = { username, role: 'supervisor', token: 'fake-jwt-token' };
      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      this.currentUserSubject.next(user);
      return of(user);
    } else if (username && password) { // Any other credentials are treated as employee
      const user: User = { username, role: 'employee', token: 'fake-jwt-token' };
      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      this.currentUserSubject.next(user);
      return of(user);
    }
    return throwError(() => new Error('Invalid credentials'));
  }

  logout(): void {
    // Get username before logout for the notification
    const username = this.currentUserValue?.username || 'User';
    
    // Remove user from local storage and set current user to null
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      
      // For now, don't use Auth0 logout URL
      // Just clear the tokens locally
      //this.oauthService.logOut(false);
    }
    
    this.currentUserSubject.next(null);
    
    // Show logout notification
    this.toastr.success(`${username} has been logged out`, 'Logout Successful');
    
    // Redirect to login page
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue || (this.isBrowser && this.oauthService.hasValidAccessToken());
  }

  hasRole(role: string): boolean {
    return this.currentUserValue?.role === role;
  }
  
  // Get user profile from Auth0
  getUserProfile(): Observable<Auth0Claims> {
    if (!this.isBrowser || !this.oauthService.hasValidAccessToken()) {
      return throwError(() => new Error('Not authenticated'));
    }
    
    return this.http.get<Auth0Claims>('https://YOUR_AUTH0_DOMAIN.auth0.com/userinfo')
      .pipe(
        catchError(error => {
          console.error('Error getting user profile:', error);
          return throwError(() => new Error('Failed to get user profile'));
        })
      );
  }
  
  // Check if tokens are valid
  hasValidTokens(): boolean {
    return this.isBrowser && this.oauthService.hasValidAccessToken() && this.oauthService.hasValidIdToken();
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isEmployee(): boolean {
    return this.hasRole('employee');
  }

  isSupervisor(): boolean {
    return this.hasRole('supervisor');
  }
}
