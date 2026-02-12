import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Issue Detail</h1>
      <p>Issue details, comments, and activity log will be displayed here</p>
    </div>
  `
})
export class IssueDetailComponent {
}
