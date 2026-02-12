import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="header">
        <h1>Issues</h1>
        <button class="btn btn-primary">New Issue</button>
      </div>
      <div class="filters">
        <p>Filters will be displayed here</p>
      </div>
      <div class="issue-list">
        <p>Issue list will be displayed here</p>
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
    .filters {
      background: white;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    .issue-list {
      background: white;
      padding: 1rem;
      border-radius: 4px;
    }
  `]
})
export class IssueListComponent {
}
