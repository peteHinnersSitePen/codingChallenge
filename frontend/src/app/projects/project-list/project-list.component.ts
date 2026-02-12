import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService, Project } from '../../services/project.service';
import { FormsModule } from '@angular/forms';

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
