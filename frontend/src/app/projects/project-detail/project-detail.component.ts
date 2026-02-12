import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService, Project } from '../../services/project.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
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
