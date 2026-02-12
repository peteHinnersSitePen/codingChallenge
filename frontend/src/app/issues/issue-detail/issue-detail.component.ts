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
  templateUrl: './issue-detail.component.html',
  styleUrl: './issue-detail.component.scss'
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
