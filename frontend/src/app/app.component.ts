import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Issue Tracker';
  isAuthenticated = false;
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });
  }

  logout() {
    this.authService.logout();
  }

  navigateToProjects(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    console.log('Navigating to projects');
    this.router.navigate(['/projects']).then(
      (success) => console.log('Navigation to /projects:', success),
      (error) => console.error('Navigation error to /projects:', error)
    );
  }

  navigateToIssues(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    console.log('Navigating to issues');
    this.router.navigate(['/issues']).then(
      (success) => console.log('Navigation to /issues:', success),
      (error) => console.error('Navigation error to /issues:', error)
    );
  }
}
