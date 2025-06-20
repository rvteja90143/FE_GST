import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { EmployeeDashboardComponent } from './components/employee-dashboard/employee-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AuthCallbackComponent } from './components/auth/auth-callback.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'auth-callback', component: AuthCallbackComponent },
  { 
    path: 'employee', 
    component: EmployeeDashboardComponent, 
    canActivate: [authGuard, roleGuard],
    data: { role: 'employee' }
  },
  { 
    path: 'supervisor', 
    component: AdminDashboardComponent, // Reusing admin component for now
    canActivate: [authGuard, roleGuard],
    data: { role: 'supervisor' }
  },
  { 
    path: 'admin', 
    component: AdminDashboardComponent, 
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  // Redirect to login for any unknown routes
  { path: '**', redirectTo: '/login' }
];
