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
  ) {}

  ngOnInit() {
    // Load issues first (main content)
    this.loadIssues();
    
    // Load projects separately (non-blocking, only needed for filters)
    this.loadProjects();
    
    // Subscribe to WebSocket updates for real-time notifications
    this.setupWebSocketSubscription();
  }

  private setupWebSocketSubscription() {
    // Subscribe to WebSocket updates - RxJS Subject will deliver events
    // even if they arrive after subscription
    this.wsSubscription = this.wsService.getIssueUpdates().subscribe({
      next: (event) => {
        // Reload issues when updates are received
        this.loadIssues();
      },
      error: (error) => {
        console.warn('WebSocket subscription error (non-critical):', error);
      }
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
        console.warn('Failed to load projects (non-critical - component will still work):', error);
        // Don't block the component if projects fail to load
        // The user can still view issues, they just won't be able to filter by project or create new issues
        this.projects = [];
        // Don't set errorMessage here - projects are optional for viewing issues
      }
    });
  }

  loadIssues() {
    // Only show loading indicator if we don't have existing data (initial load)
    const isInitialLoad = !this.issuesPage;
    if (isInitialLoad) {
      this.loading = true;
    }
    this.errorMessage = '';
    
    try {
      // Convert null/empty values to undefined for the API
      const apiFilters: any = { ...this.filters };
      const statusVal = apiFilters.status;
      if (statusVal === null || statusVal === undefined || statusVal === 'null') delete apiFilters.status;
      
      const priorityVal = apiFilters.priority;
      if (priorityVal === null || priorityVal === undefined || priorityVal === 'null') delete apiFilters.priority;
      
      const projectIdVal = apiFilters.projectId;
      if (projectIdVal === null || projectIdVal === undefined || projectIdVal === '' || projectIdVal === 'null') delete apiFilters.projectId;
      
      const assigneeIdVal = apiFilters.assigneeId;
      if (assigneeIdVal === null || assigneeIdVal === undefined || assigneeIdVal === 'null') delete apiFilters.assigneeId;
      
      if (!apiFilters.searchText) delete apiFilters.searchText;
      
      this.issueService.getIssues(apiFilters).subscribe({
        next: (page) => {
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
    // Normalize empty string to undefined for "All Projects" option
    // Angular may convert empty select values to strings, so we need to handle both types
    const projectIdValue = this.filters.projectId as any;
    if (projectIdValue === '' || projectIdValue === 'null' || projectIdValue === null) {
      this.filters.projectId = undefined;
    } else if (typeof projectIdValue === 'string' && !isNaN(Number(projectIdValue))) {
      // Convert string number to actual number
      this.filters.projectId = Number(projectIdValue);
    }
    
    // Normalize string "null" to undefined for other filters
    const statusValue = this.filters.status as any;
    if (statusValue === 'null' || statusValue === null) {
      this.filters.status = undefined;
    }
    
    const priorityValue = this.filters.priority as any;
    if (priorityValue === 'null' || priorityValue === null) {
      this.filters.priority = undefined;
    }
    
    const assigneeIdValue = this.filters.assigneeId as any;
    if (assigneeIdValue === 'null' || assigneeIdValue === null) {
      this.filters.assigneeId = undefined;
    } else if (typeof assigneeIdValue === 'string' && !isNaN(Number(assigneeIdValue))) {
      // Convert string number to actual number
      this.filters.assigneeId = Number(assigneeIdValue);
    }
    
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

  hasActiveFilters(): boolean {
    // Check if any filters are active (excluding pagination, sorting which are always present)
    return !!(this.filters.status || 
              this.filters.priority || 
              this.filters.projectId || 
              this.filters.assigneeId || 
              (this.filters.searchText && this.filters.searchText.trim().length > 0));
  }

  clearSearch() {
    this.filters.searchText = '';
    this.onFilterChange();
  }

  formatStatus(status: string): string {
    // Replace underscores with spaces and capitalize words
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
