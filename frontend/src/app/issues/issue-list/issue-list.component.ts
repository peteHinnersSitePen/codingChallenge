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
  templateUrl: './issue-list.component.html',
  styleUrl: './issue-list.component.scss'
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
  ) {
    console.log('IssueListComponent constructor called');
  }

  ngOnInit() {
    console.log('IssueListComponent initialized');
    // Load issues first (main content)
    this.loadIssues();
    
    // Load projects separately (non-blocking, only needed for filters)
    this.loadProjects();
    
    // Subscribe to WebSocket updates for real-time notifications
    try {
      this.wsSubscription = this.wsService.getIssueUpdates().subscribe({
        next: (event) => {
          console.log('Issue update received:', event);
          // Reload issues when updates are received
          this.loadIssues();
        },
        error: (error) => {
          console.warn('WebSocket subscription error (non-critical):', error);
        }
      });
    } catch (error) {
      console.warn('Failed to subscribe to WebSocket updates (non-critical):', error);
    }
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadProjects() {
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        console.log('Projects loaded successfully:', projects);
        this.projects = projects;
      },
      error: (error: any) => {
        console.warn('Failed to load projects (non-critical - component will still work):', error);
        // Don't block the component if projects fail to load
        // The user can still view issues, they just won't be able to filter by project or create new issues
        this.projects = [];
        // Don't set errorMessage here - projects are optional for viewing issues
      }
    });
  }

  loadIssues() {
    console.log('Loading issues with filters:', this.filters);
    this.loading = true;
    this.errorMessage = '';
    
    try {
      // Convert null values to undefined for the API
      const apiFilters: any = { ...this.filters };
      if (apiFilters.status === null) delete apiFilters.status;
      if (apiFilters.priority === null) delete apiFilters.priority;
      if (apiFilters.projectId === null) delete apiFilters.projectId;
      if (!apiFilters.searchText) delete apiFilters.searchText;
      
      this.issueService.getIssues(apiFilters).subscribe({
        next: (page) => {
          console.log('Issues loaded successfully:', page);
          this.issuesPage = page;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading issues:', error);
          if (error.status === 401 || error.status === 403) {
            this.errorMessage = 'Authentication failed. Please log in again.';
          } else if (error.status === 0) {
            this.errorMessage = 'Cannot connect to backend. Please ensure the backend server is running on http://localhost:8080';
          } else {
            this.errorMessage = error.error?.message || `Failed to load issues (${error.status || 'unknown error'})`;
          }
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Exception in loadIssues:', error);
      this.errorMessage = 'Failed to load issues';
      this.loading = false;
    }
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
