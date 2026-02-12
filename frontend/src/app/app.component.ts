import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div class="app-container">
      <header>
        <nav>
          <h1>Issue Tracker</h1>
          <div class="nav-links">
            <a routerLink="/projects">Projects</a>
            <a routerLink="/issues">Issues</a>
            <div *ngIf="isAuthenticated" class="user-section">
              <span class="user-name">{{ currentUser?.name }}</span>
              <button class="btn btn-secondary btn-sm" (click)="logout()">Logout</button>
            </div>
            <a *ngIf="!isAuthenticated" routerLink="/login">Login</a>
          </div>
        </nav>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
    }
    header {
      background-color: #fff;
      border-bottom: 1px solid #ddd;
      padding: 1rem 0;
    }
    nav {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    nav h1 {
      font-size: 1.5rem;
      color: #007bff;
    }
    .nav-links {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    .nav-links a {
      text-decoration: none;
      color: #333;
      font-weight: 500;
    }
    .nav-links a:hover {
      color: #007bff;
    }
    .user-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .user-name {
      color: #333;
      font-weight: 500;
    }
    .btn-sm {
      padding: 6px 12px;
      font-size: 0.875rem;
    }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Issue Tracker';
  isAuthenticated = false;
  currentUser: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });
  }

  logout() {
    this.authService.logout();
  }
}
