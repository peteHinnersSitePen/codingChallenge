import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Project Detail</h1>
      <p>Project details will be displayed here</p>
    </div>
  `
})
export class ProjectDetailComponent {
}
