import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService, Project } from '../../services/project.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Projects</h1>
        <button class="btn btn-primary" (click)="showCreateModal = true">New Project</button>
      </div>
      
      <div *ngIf="loading" class="loading">Loading projects...</div>
      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
      
      <div class="project-list" *ngIf="!loading && !errorMessage">
        <div *ngIf="projects.length === 0" class="empty-state">
          <p>No projects found. Create your first project!</p>
        </div>
        <div *ngFor="let project of projects" class="project-card" [routerLink]="['/projects', project.id]">
          <div class="project-header">
            <h3>{{ project.name }}</h3>
            <span class="project-owner">Owner: {{ project.ownerName }}</span>
          </div>
          <div class="project-meta">
            <small>Created: {{ project.createdAt | date:'short' }}</small>
          </div>
        </div>
      </div>
      
      <!-- Create Project Modal -->
      <div *ngIf="showCreateModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2>Create New Project</h2>
          <form (ngSubmit)="onCreateProject()">
            <div class="form-group">
              <label for="projectName">Project Name</label>
              <input type="text" id="projectName" [(ngModel)]="newProjectName" name="projectName" required>
            </div>
            <div *ngIf="createError" class="error-message">{{ createError }}</div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
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
    .project-list {
      display: grid;
      gap: 1rem;
    }
    .project-card {
      background: white;
      padding: 1.5rem;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .project-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .project-header h3 {
      margin: 0;
      color: #007bff;
    }
    .project-owner {
      color: #6c757d;
      font-size: 0.875rem;
    }
    .project-meta {
      color: #6c757d;
      font-size: 0.875rem;
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
      max-width: 500px;
    }
    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
  `]
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  loading = false;
  errorMessage = '';
  showCreateModal = false;
  newProjectName = '';
  creating = false;
  createError = '';

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    this.errorMessage = '';
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load projects';
        this.loading = false;
        console.error(error);
      }
    });
  }

  onCreateProject() {
    if (!this.newProjectName.trim()) {
      this.createError = 'Project name is required';
      return;
    }

    this.creating = true;
    this.createError = '';

    this.projectService.createProject({ name: this.newProjectName }).subscribe({
      next: (project) => {
        this.projects.push(project);
        this.closeModal();
        this.creating = false;
      },
      error: (error: any) => {
        this.createError = error.error?.message || 'Failed to create project';
        this.creating = false;
      }
    });
  }

  closeModal() {
    this.showCreateModal = false;
    this.newProjectName = '';
    this.createError = '';
  }
}
