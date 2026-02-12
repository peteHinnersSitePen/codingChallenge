import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Sign Up</h2>
        <form (ngSubmit)="onSignup()">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" [(ngModel)]="name" name="name" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" [(ngModel)]="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" [(ngModel)]="password" name="password" required>
          </div>
          <button type="submit" class="btn btn-primary">Sign Up</button>
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
    .auth-link {
      margin-top: 1rem;
      text-align: center;
    }
    .auth-link a {
      color: #007bff;
      text-decoration: none;
    }
  `]
})
export class SignupComponent {
  name = '';
  email = '';
  password = '';

  constructor(private router: Router) {}

  onSignup() {
    // TODO: Implement signup logic
    console.log('Signup:', this.email);
    this.router.navigate(['/login']);
  }
}
