import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { first } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl = '/';
  useLegacyLogin = false; // Toggle between SSO and legacy login
  isBrowser: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private oauthService: OAuthService,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Redirect to home if already logged in
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
    }
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // Convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    
    if (this.useLegacyLogin) {
      // Use legacy login with username/password
      this.authService.mockLogin(this.f['username'].value, this.f['password'].value)
        .pipe(first())
        .subscribe({
          next: (user: User) => {
            console.log('Login successful:', user);
            // Show success notification
            this.toastr.success('Login successful', 'Welcome ' + user.username);
            // Force a small delay to ensure the auth state is updated
            setTimeout(() => {
              this.redirectBasedOnRole();
            }, 100);
          },
          error: (error: Error) => {
            this.error = error.message;
            this.loading = false;
            // Show error notification
            this.toastr.error(error.message || 'Invalid credentials', 'Login Failed');
          }
        });
    } else {
      // Use initiateSSO method for SSO login
      this.initiateSSO();
    }
  }
  
  // Method specifically for SSO button click
  initiateSSO(): void {
    if (!this.isBrowser) {
      return; // Don't attempt SSO in server-side rendering
    }
    
    try {
      this.loading = true;
      console.log('Initiating SSO login...');
      // Show info notification
      this.toastr.info('Redirecting to Single Sign-On...', 'Please wait');
      // Use the auth service to initiate the login flow
      this.authService.login();
      // The page will redirect to Auth0, so we don't need to handle success/error here
    } catch (error) {
      console.error('Error initiating SSO:', error);
      this.error = 'Failed to initiate Single Sign-On. Please try again or use username/password login.';
      this.loading = false;
      // Show error notification
      this.toastr.error('Failed to initiate Single Sign-On', 'Error');
    }
  }

  redirectBasedOnRole(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
    } else if (this.authService.isSupervisor()) {
      this.router.navigate(['/supervisor']);
    } else {
      this.router.navigate(['/employee']);
    }
  }
  
  // Toggle between SSO and legacy login
  toggleLoginMethod(): void {
    this.useLegacyLogin = !this.useLegacyLogin;
    this.error = ''; // Clear any previous errors
  }

  onCancel(): void {
    this.loginForm.reset();
  }
}


