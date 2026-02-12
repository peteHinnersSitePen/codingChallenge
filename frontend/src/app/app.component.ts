import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-container">
      <header>
        <nav>
          <h1>Issue Tracker</h1>
          <div class="nav-links">
            <a routerLink="/projects">Projects</a>
            <a routerLink="/issues">Issues</a>
            <a routerLink="/login">Login</a>
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
    }
    .nav-links a {
      text-decoration: none;
      color: #333;
      font-weight: 500;
    }
    .nav-links a:hover {
      color: #007bff;
    }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
  `]
})
export class AppComponent {
  title = 'Issue Tracker';
}
