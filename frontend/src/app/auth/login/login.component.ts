import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Login</h2>
        <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" [(ngModel)]="email" name="email" required [disabled]="loading">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" [(ngModel)]="password" name="password" required [disabled]="loading">
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
          <p class="auth-link">Don't have an account? <a routerLink="/signup">Sign up</a></p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }
    .auth-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    .auth-card h2 {
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    .auth-link {
      margin-top: 1rem;
      text-align: center;
    }
    .auth-link a {
      color: #007bff;
      text-decoration: none;
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/projects']);
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Invalid email or password';
      }
    });
  }
}
