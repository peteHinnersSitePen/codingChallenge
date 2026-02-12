import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IssueService, Issue, IssueFilters, PageResponse } from '../../services/issue.service';
import { ProjectService, Project } from '../../services/project.service';
import { WebSocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Issues</h1>
        <button class="btn btn-primary" (click)="showCreateModal = true">New Issue</button>
      </div>
      
      <!-- Filters -->
      <div class="filters-card">
        <div class="filter-row">
          <div class="filter-group">
            <label>Search</label>
            <input type="text" [(ngModel)]="filters.searchText" (input)="onFilterChange()" placeholder="Search by title...">
          </div>
          <div class="filter-group">
            <label>Status</label>
            <select [(ngModel)]="filters.status" (change)="onFilterChange()">
              <option [value]="null">All</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Priority</label>
            <select [(ngModel)]="filters.priority" (change)="onFilterChange()">
              <option [value]="null">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Project</label>
            <select [(ngModel)]="filters.projectId" (change)="onFilterChange()">
              <option [value]="null">All Projects</option>
              <option *ngFor="let project of projects" [value]="project.id">{{ project.name }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Sort By</label>
            <select [(ngModel)]="filters.sortBy" (change)="onFilterChange()">
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Order</label>
            <select [(ngModel)]="filters.sortDir" (change)="onFilterChange()">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>
      
      <div *ngIf="loading" class="loading">Loading issues...</div>
      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
      
      <div *ngIf="!loading && !errorMessage">
        <div *ngIf="issuesPage && issuesPage.content.length === 0" class="empty-state">
          <p>No issues found. Create your first issue!</p>
        </div>
        
        <div *ngIf="issuesPage && issuesPage.content.length > 0" class="issues-container">
          <div *ngFor="let issue of issuesPage.content" class="issue-card" [routerLink]="['/issues', issue.id]">
            <div class="issue-header">
              <h3>{{ issue.title }}</h3>
              <span class="status-badge" [class]="'status-' + issue.status.toLowerCase()">
                {{ issue.status }}
              </span>
            </div>
            <p class="issue-description">{{ issue.description || 'No description' }}</p>
            <div class="issue-meta">
              <span class="priority-badge" [class]="'priority-' + issue.priority.toLowerCase()">
                {{ issue.priority }}
              </span>
              <span class="project-name">{{ issue.projectName }}</span>
              <span *ngIf="issue.assigneeName" class="assignee">Assigned to: {{ issue.assigneeName }}</span>
              <span class="date">Updated: {{ issue.updatedAt | date:'short' }}</span>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div *ngIf="issuesPage && issuesPage.totalPages > 1" class="pagination">
          <button class="btn btn-secondary" (click)="previousPage()" [disabled]="filters.page === 0">
            Previous
          </button>
          <span class="page-info">
            Page {{ (filters.page || 0) + 1 }} of {{ issuesPage.totalPages }} 
            ({{ issuesPage.totalElements }} total)
          </span>
          <button class="btn btn-secondary" (click)="nextPage()" [disabled]="issuesPage.last">
            Next
          </button>
        </div>
      </div>
      
      <!-- Create Issue Modal -->
      <div *ngIf="showCreateModal" class="modal-overlay" (click)="closeCreateModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2>Create New Issue</h2>
          <form (ngSubmit)="onCreateIssue()">
            <div class="form-group">
              <label for="issueTitle">Title *</label>
              <input type="text" id="issueTitle" [(ngModel)]="newIssue.title" name="title" required>
            </div>
            <div class="form-group">
              <label for="issueDescription">Description</label>
              <textarea id="issueDescription" [(ngModel)]="newIssue.description" name="description" rows="4"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="issueProject">Project *</label>
                <select id="issueProject" [(ngModel)]="newIssue.projectId" name="projectId" required>
                  <option [value]="null">Select a project</option>
                  <option *ngFor="let project of projects" [value]="project.id">{{ project.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="issuePriority">Priority</label>
                <select id="issuePriority" [(ngModel)]="newIssue.priority" name="priority">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM" selected>Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div *ngIf="createError" class="error-message">{{ createError }}</div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="creating">
                {{ creating ? 'Creating...' : 'Create' }}
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
      align-items: center;
      margin-bottom: 2rem;
    }
    .filters-card {
      background: white;
      padding: 1.5rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
    }
    .filter-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
    }
    .filter-group label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    .filter-group input,
    .filter-group select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .issues-container {
      display: grid;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .issue-card {
      background: white;
      padding: 1.5rem;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .issue-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .issue-header h3 {
      margin: 0;
      color: #007bff;
    }
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-open { background-color: #d4edda; color: #155724; }
    .status-in_progress { background-color: #fff3cd; color: #856404; }
    .status-closed { background-color: #d1ecf1; color: #0c5460; }
    .issue-description {
      color: #6c757d;
      margin-bottom: 1rem;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .issue-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.875rem;
      color: #6c757d;
    }
    .priority-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .priority-low { background-color: #e7f3ff; color: #0066cc; }
    .priority-medium { background-color: #fff4e6; color: #cc6600; }
    .priority-high { background-color: #ffe6e6; color: #cc0000; }
    .priority-critical { background-color: #ffcccc; color: #990000; }
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }
    .page-info {
      color: #6c757d;
    }
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
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
export class IssueListComponent implements OnInit, OnDestroy {
  issuesPage: PageResponse<Issue> | null = null;
  projects: Project[] = [];
  loading = false;
  errorMessage = '';
  showCreateModal = false;
  creating = false;
  createError = '';
  private wsSubscription?: Subscription;
  
  filters: IssueFilters = {
    page: 0,
    size: 20,
    sortBy: 'createdAt',
    sortDir: 'desc'
  };
  
  newIssue: any = {
    title: '',
    description: '',
    projectId: null,
    priority: 'MEDIUM',
    status: 'OPEN'
  };

  constructor(
    private issueService: IssueService,
    private projectService: ProjectService,
    private wsService: WebSocketService
  ) {}

  ngOnInit() {
    this.loadProjects();
    this.loadIssues();
    
    // Subscribe to WebSocket updates (for real-time notifications)
    // Note: Full WebSocket/STOMP implementation requires additional packages
    // This structure is ready for full implementation
    this.wsSubscription = this.wsService.getIssueUpdates().subscribe(event => {
      console.log('Issue update received:', event);
      // Reload issues when updates are received
      this.loadIssues();
    });
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadProjects() {
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (error: any) => {
        console.error('Failed to load projects', error);
      }
    });
  }

  loadIssues() {
    this.loading = true;
    this.errorMessage = '';
    
    // Convert null values to undefined for the API
    const apiFilters: any = { ...this.filters };
    if (apiFilters.status === null) delete apiFilters.status;
    if (apiFilters.priority === null) delete apiFilters.priority;
    if (apiFilters.projectId === null) delete apiFilters.projectId;
    if (!apiFilters.searchText) delete apiFilters.searchText;
    
    this.issueService.getIssues(apiFilters).subscribe({
      next: (page) => {
        this.issuesPage = page;
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load issues';
        this.loading = false;
        console.error(error);
      }
    });
  }

  onFilterChange() {
    this.filters.page = 0; // Reset to first page when filters change
    this.loadIssues();
  }

  previousPage() {
    if (this.filters.page && this.filters.page > 0) {
      this.filters.page--;
      this.loadIssues();
    }
  }

  nextPage() {
    if (this.issuesPage && !this.issuesPage.last) {
      this.filters.page = (this.filters.page || 0) + 1;
      this.loadIssues();
    }
  }

  onCreateIssue() {
    if (!this.newIssue.title || !this.newIssue.projectId) {
      this.createError = 'Title and Project are required';
      return;
    }

    this.creating = true;
    this.createError = '';

    this.issueService.createIssue(this.newIssue).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadIssues();
        this.creating = false;
      },
      error: (error: any) => {
        this.createError = error.error?.message || 'Failed to create issue';
        this.creating = false;
      }
    });
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newIssue = {
      title: '',
      description: '',
      projectId: null,
      priority: 'MEDIUM',
      status: 'OPEN'
    };
    this.createError = '';
  }
}
