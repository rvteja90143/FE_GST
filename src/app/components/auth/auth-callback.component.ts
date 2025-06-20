import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="callback-container">
      <div class="spinner"></div>
      <p>Processing authentication, please wait...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: Arial, sans-serif;
    }
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #09f;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService,
    private oauthService: OAuthService
  ) {}

  ngOnInit(): void {
    // Process the authentication response
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(success => {
      if (success) {
        console.log('Successfully logged in with OAuth');
        
        // Ensure user profile is loaded from OAuth claims
        if (this.oauthService.hasValidAccessToken() && !this.authService.currentUserValue) {
          // This will trigger the auth service to create a user from the OAuth tokens
          const claims = this.oauthService.getIdentityClaims();
          if (claims) {
            // Wait a moment to ensure the auth service has processed the login
            setTimeout(() => {
              this.redirectBasedOnRole();
            }, 500);
          } else {
            // No claims found, redirect to login
            this.router.navigate(['/login']);
          }
        } else {
          // User already exists in auth service
          this.redirectBasedOnRole();
        }
      } else {
        console.error('OAuth login failed');
        this.router.navigate(['/login']);
      }
    }).catch(error => {
      console.error('Error during OAuth login', error);
      this.router.navigate(['/login']);
    });
  }

  private redirectBasedOnRole(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
    } else if (this.authService.isSupervisor()) {
      this.router.navigate(['/supervisor']);
    } else {
      this.router.navigate(['/employee']);
    }
  }
}
