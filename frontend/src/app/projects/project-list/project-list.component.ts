import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="header">
        <h1>Projects</h1>
        <button class="btn btn-primary">New Project</button>
      </div>
      <div class="project-list">
        <p>Project list will be displayed here</p>
      </div>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .project-list {
      background: white;
      padding: 1rem;
      border-radius: 4px;
    }
  `]
})
export class ProjectListComponent {
}
