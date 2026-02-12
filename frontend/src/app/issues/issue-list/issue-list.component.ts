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
