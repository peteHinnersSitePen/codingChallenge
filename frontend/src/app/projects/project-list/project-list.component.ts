import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProjectService, Project } from '../../services/project.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  loading = false;
  errorMessage = '';
  showCreateModal = false;
  newProjectName = '';
  creating = false;
  createError = '';

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router
  ) {}

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
        console.error('Error loading projects:', error);
        if (error.status === 401 || error.status === 403) {
          // Token expired or invalid - redirect to login
          this.errorMessage = 'Session expired. Please log in again.';
          setTimeout(() => {
            this.authService.logout();
          }, 2000);
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to backend. Please ensure the backend server is running.';
        } else {
          this.errorMessage = error.error?.message || `Failed to load projects (${error.status || 'unknown error'})`;
        }
        this.loading = false;
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
