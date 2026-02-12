import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IssueService, Issue } from '../../services/issue.service';
import { ProjectService, Project } from '../../services/project.service';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <div *ngIf="loading" class="loading">Loading issue...</div>
      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
      
      <div *ngIf="issue && !loading">
        <div class="header">
          <div>
            <a routerLink="/issues" class="back-link">← Back to Issues</a>
            <h1>{{ issue.title }}</h1>
          </div>
          <div class="actions">
            <button class="btn btn-secondary" (click)="editMode = !editMode">
              {{ editMode ? 'Cancel' : 'Edit' }}
            </button>
            <button class="btn btn-danger" (click)="onDelete()" [disabled]="deleting">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
        
        <div class="issue-content">
          <!-- View Mode -->
          <div *ngIf="!editMode" class="issue-details">
            <div class="detail-section">
              <div class="detail-row">
                <strong>Status:</strong>
                <span class="status-badge" [class]="'status-' + issue.status.toLowerCase()">
                  {{ issue.status }}
                </span>
              </div>
              <div class="detail-row">
                <strong>Priority:</strong>
                <span class="priority-badge" [class]="'priority-' + issue.priority.toLowerCase()">
                  {{ issue.priority }}
                </span>
              </div>
              <div class="detail-row">
                <strong>Project:</strong>
                <a [routerLink]="['/projects', issue.projectId]">{{ issue.projectName }}</a>
              </div>
              <div class="detail-row" *ngIf="issue.assigneeName">
                <strong>Assigned to:</strong>
                <span>{{ issue.assigneeName }}</span>
              </div>
              <div class="detail-row">
                <strong>Created:</strong>
                <span>{{ issue.createdAt | date:'medium' }}</span>
              </div>
              <div class="detail-row">
                <strong>Updated:</strong>
                <span>{{ issue.updatedAt | date:'medium' }}</span>
              </div>
            </div>
            
            <div class="description-section">
              <h3>Description</h3>
              <p>{{ issue.description || 'No description provided' }}</p>
            </div>
            
            <!-- Comments Section (Placeholder) -->
            <div class="comments-section">
              <h3>Comments</h3>
              <p class="placeholder-text">Comment functionality will be implemented here</p>
            </div>
            
            <!-- Activity Log Section (Placeholder) -->
            <div class="activity-section">
              <h3>Activity Log</h3>
              <p class="placeholder-text">Activity log will be displayed here</p>
            </div>
          </div>
          
          <!-- Edit Mode -->
          <form *ngIf="editMode" (ngSubmit)="onUpdate()" class="edit-form">
            <div class="form-group">
              <label for="issueTitle">Title *</label>
              <input type="text" id="issueTitle" [(ngModel)]="editData.title" name="title" required>
            </div>
            <div class="form-group">
              <label for="issueDescription">Description</label>
              <textarea id="issueDescription" [(ngModel)]="editData.description" name="description" rows="6"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="editStatus">Status</label>
                <select id="editStatus" [(ngModel)]="editData.status" name="status">
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div class="form-group">
                <label for="editPriority">Priority</label>
                <select id="editPriority" [(ngModel)]="editData.priority" name="priority">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div *ngIf="updateError" class="error-message">{{ updateError }}</div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="updating">
                {{ updating ? 'Updating...' : 'Update Issue' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }
    .back-link {
      color: #007bff;
      text-decoration: none;
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    .btn-danger:hover {
      background-color: #c82333;
    }
    .issue-content {
      background: white;
      padding: 2rem;
      border-radius: 4px;
    }
    .issue-details {
      display: grid;
      gap: 2rem;
    }
    .detail-section {
      display: grid;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-badge, .priority-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-open { background-color: #d4edda; color: #155724; }
    .status-in_progress { background-color: #fff3cd; color: #856404; }
    .status-closed { background-color: #d1ecf1; color: #0c5460; }
    .priority-low { background-color: #e7f3ff; color: #0066cc; }
    .priority-medium { background-color: #fff4e6; color: #cc6600; }
    .priority-high { background-color: #ffe6e6; color: #cc0000; }
    .priority-critical { background-color: #ffcccc; color: #990000; }
    .description-section h3,
    .comments-section h3,
    .activity-section h3 {
      margin-bottom: 1rem;
      color: #333;
    }
    .description-section p {
      color: #6c757d;
      line-height: 1.6;
    }
    .placeholder-text {
      color: #6c757d;
      font-style: italic;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .edit-form {
      display: grid;
      gap: 1.5rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-actions {
      margin-top: 1rem;
    }
    .loading, .error-message {
      padding: 1rem;
      text-align: center;
    }
    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
  `]
})
export class IssueDetailComponent implements OnInit {
  issue: Issue | null = null;
  loading = false;
  errorMessage = '';
  editMode = false;
  updating = false;
  updateError = '';
  deleting = false;
  
  editData: any = {
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private issueService: IssueService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadIssue(+id);
    }
  }

  loadIssue(id: number) {
    this.loading = true;
    this.errorMessage = '';
    this.issueService.getIssueById(id).subscribe({
      next: (issue) => {
        this.issue = issue;
        this.editData = {
          title: issue.title,
          description: issue.description || '',
          status: issue.status,
          priority: issue.priority
        };
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load issue';
        this.loading = false;
        console.error(error);
      }
    });
  }

  onUpdate() {
    if (!this.issue || !this.editData.title.trim()) {
      this.updateError = 'Title is required';
      return;
    }

    this.updating = true;
    this.updateError = '';

    const updateData = {
      ...this.editData,
      projectId: this.issue.projectId,
      assigneeId: this.issue.assigneeId
    };

    this.issueService.updateIssue(this.issue.id, updateData).subscribe({
      next: (issue) => {
        this.issue = issue;
        this.editMode = false;
        this.updating = false;
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to update issue';
        this.updating = false;
      }
    });
  }

  onDelete() {
    if (!this.issue || !confirm('Are you sure you want to delete this issue?')) {
      return;
    }

    this.deleting = true;
    this.issueService.deleteIssue(this.issue.id).subscribe({
      next: () => {
        this.router.navigate(['/issues']);
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Failed to delete issue';
        this.deleting = false;
      }
    });
  }
}
