import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IssueService, Issue } from '../../services/issue.service';
import { ProjectService, Project } from '../../services/project.service';
import { CommentService, Comment } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';

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
  showDeleteConfirm = false;
  comments: Comment[] = [];
  loadingComments = false;
  newComment = '';
  submittingComment = false;
  commentError = '';
  editingCommentId: number | null = null;
  editCommentContent = '';
  deletingCommentId: number | null = null;
  
  editData: any = {
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private issueService: IssueService,
    private commentService: CommentService,
    private authService: AuthService
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
        this.loadComments(id);
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load issue';
        this.loading = false;
        console.error(error);
      }
    });
  }

  loadComments(issueId: number) {
    this.loadingComments = true;
    this.commentService.getComments(issueId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.loadingComments = false;
      },
      error: (error: any) => {
        console.error('Failed to load comments:', error);
        this.loadingComments = false;
        // Don't show error to user - comments are non-critical
      }
    });
  }

  onSubmitComment() {
    if (!this.issue || !this.newComment.trim()) {
      this.commentError = 'Comment cannot be empty';
      return;
    }

    this.submittingComment = true;
    this.commentError = '';

    this.commentService.createComment(this.issue.id, { content: this.newComment.trim() }).subscribe({
      next: (comment) => {
        this.comments.push(comment);
        this.newComment = '';
        this.submittingComment = false;
      },
      error: (error: any) => {
        this.commentError = error.error?.message || 'Failed to post comment';
        this.submittingComment = false;
      }
    });
  }

  isCommentAuthor(comment: Comment): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser !== null && comment.authorId === currentUser.userId;
  }

  startEditComment(comment: Comment) {
    this.editingCommentId = comment.id;
    this.editCommentContent = comment.content;
  }

  cancelEditComment() {
    this.editingCommentId = null;
    this.editCommentContent = '';
  }

  saveEditComment(commentId: number) {
    if (!this.issue || !this.editCommentContent.trim()) {
      return;
    }

    this.commentService.updateComment(this.issue.id, commentId, { content: this.editCommentContent.trim() }).subscribe({
      next: (updatedComment) => {
        const index = this.comments.findIndex(c => c.id === commentId);
        if (index !== -1) {
          this.comments[index] = updatedComment;
        }
        this.editingCommentId = null;
        this.editCommentContent = '';
      },
      error: (error: any) => {
        this.commentError = error.error?.message || 'Failed to update comment';
      }
    });
  }

  confirmDeleteComment(commentId: number) {
    this.deletingCommentId = commentId;
  }

  cancelDeleteComment() {
    this.deletingCommentId = null;
  }

  deleteComment(commentId: number) {
    if (!this.issue) {
      return;
    }

    this.commentService.deleteComment(this.issue.id, commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== commentId);
        this.deletingCommentId = null;
      },
      error: (error: any) => {
        this.commentError = error.error?.message || 'Failed to delete comment';
        this.deletingCommentId = null;
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
    if (!this.issue) {
      return;
    }
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (!this.issue) {
      return;
    }

    this.deleting = true;
    this.showDeleteConfirm = false;
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

  cancelDelete() {
    this.showDeleteConfirm = false;
  }

  formatStatus(status: string): string {
    // Replace underscores with spaces and capitalize words
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
