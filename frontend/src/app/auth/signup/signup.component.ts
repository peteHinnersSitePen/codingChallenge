import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Sign Up</h2>
        <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
        <form (ngSubmit)="onSignup()">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" [(ngModel)]="name" name="name" required [disabled]="loading">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" [(ngModel)]="email" name="email" required [disabled]="loading">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" [(ngModel)]="password" name="password" required [disabled]="loading" minlength="6">
            <small class="form-hint">Password must be at least 6 characters</small>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading">
            {{ loading ? 'Signing up...' : 'Sign Up' }}
          </button>
          <p class="auth-link">Already have an account? <a routerLink="/login">Login</a></p>
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
    .form-hint {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: #6c757d;
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
export class SignupComponent {
  name = '';
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSignup() {
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.signup({
      name: this.name,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/projects']);
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Signup failed. Please try again.';
      }
    });
  }
}
