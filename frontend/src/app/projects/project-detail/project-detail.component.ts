import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService, Project } from '../../services/project.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <div *ngIf="loading" class="loading">Loading project...</div>
      <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
      
      <div *ngIf="project && !loading">
        <div class="header">
          <div>
            <a routerLink="/projects" class="back-link">← Back to Projects</a>
            <h1>{{ project.name }}</h1>
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
        
        <div *ngIf="!editMode" class="project-info">
          <div class="info-row">
            <strong>Owner:</strong> {{ project.ownerName }}
          </div>
          <div class="info-row">
            <strong>Created:</strong> {{ project.createdAt | date:'medium' }}
          </div>
        </div>
        
        <form *ngIf="editMode" (ngSubmit)="onUpdate()" class="edit-form">
          <div class="form-group">
            <label for="projectName">Project Name</label>
            <input type="text" id="projectName" [(ngModel)]="editName" name="projectName" required>
          </div>
          <div *ngIf="updateError" class="error-message">{{ updateError }}</div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="updating">
              {{ updating ? 'Updating...' : 'Update' }}
            </button>
          </div>
        </form>
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
    .project-info {
      background: white;
      padding: 1.5rem;
      border-radius: 4px;
      margin-bottom: 2rem;
    }
    .info-row {
      margin-bottom: 1rem;
    }
    .edit-form {
      background: white;
      padding: 1.5rem;
      border-radius: 4px;
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
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  loading = false;
  errorMessage = '';
  editMode = false;
  editName = '';
  updating = false;
  updateError = '';
  deleting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(+id);
    }
  }

  loadProject(id: number) {
    this.loading = true;
    this.errorMessage = '';
    this.projectService.getProjectById(id).subscribe({
      next: (project) => {
        this.project = project;
        this.editName = project.name;
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load project';
        this.loading = false;
        console.error(error);
      }
    });
  }

  onUpdate() {
    if (!this.project || !this.editName.trim()) {
      this.updateError = 'Project name is required';
      return;
    }

    this.updating = true;
    this.updateError = '';

    this.projectService.updateProject(this.project.id, { name: this.editName }).subscribe({
      next: (project) => {
        this.project = project;
        this.editMode = false;
        this.updating = false;
      },
      error: (error: any) => {
        this.updateError = error.error?.message || 'Failed to update project';
        this.updating = false;
      }
    });
  }

  onDelete() {
    if (!this.project || !confirm('Are you sure you want to delete this project?')) {
      return;
    }

    this.deleting = true;
    this.projectService.deleteProject(this.project.id).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Failed to delete project';
        this.deleting = false;
      }
    });
  }
}
