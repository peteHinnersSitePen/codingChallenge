import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IssueService, Issue } from '../../services/issue.service';
import { ProjectService, Project } from '../../services/project.service';
import { CommentService, Comment } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService, CommentUpdateEvent, IssueUpdateEvent } from '../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './issue-detail.component.html',
  styleUrl: './issue-detail.component.scss'
})
export class IssueDetailComponent implements OnInit, OnDestroy {
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
  selectedCommentId: number | null = null;
  private commentUpdateSubscription?: Subscription;
  private issueUpdateSubscription?: Subscription;
  
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
    private authService: AuthService,
    private wsService: WebSocketService
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
        this.setupCommentWebSocketSubscription(id);
        this.setupIssueWebSocketSubscription();
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load issue';
        this.loading = false;
        console.error(error);
      }
    });
  }

  private setupCommentWebSocketSubscription(issueId: number) {
    // Unsubscribe from previous subscription if exists
    if (this.commentUpdateSubscription) {
      this.commentUpdateSubscription.unsubscribe();
    }

    // Subscribe to connection status and set up comment subscription when connected
    const connectionSub = this.wsService.getConnectionStatus().subscribe(connected => {
      if (connected) {
        console.log(`WebSocket connected, setting up comment subscription for issue ${issueId}`);
        this.subscribeToCommentUpdates(issueId);
        connectionSub.unsubscribe(); // Only need to wait once
      }
    });

    // If already connected, subscribe immediately
    if (this.wsService.isConnected()) {
      connectionSub.unsubscribe();
      this.subscribeToCommentUpdates(issueId);
    }
  }

  private subscribeToCommentUpdates(issueId: number) {
    console.log(`Setting up comment WebSocket subscription for issue ${issueId}`);
    // Subscribe to comment updates for this issue
    this.commentUpdateSubscription = this.wsService.getCommentUpdates(issueId).subscribe({
      next: (event: CommentUpdateEvent) => {
        console.log(`Received comment update in component:`, event);
        this.handleCommentUpdate(event);
      },
      error: (error) => {
        console.warn('Comment WebSocket subscription error (non-critical):', error);
      }
    });
  }

  private handleCommentUpdate(event: CommentUpdateEvent) {
    console.log('Handling comment update event:', event);
    if (event.eventType === 'CREATED') {
      // Reload comments to get the new comment with full data
      if (this.issue) {
        console.log('Reloading comments due to CREATED event');
        this.loadComments(this.issue.id);
      }
    } else if (event.eventType === 'UPDATED') {
      // Update the comment in the list
      const index = this.comments.findIndex(c => c.id === event.commentId);
      if (index !== -1 && event.content) {
        console.log('Updating comment in list:', event.commentId);
        this.comments[index] = {
          ...this.comments[index],
          content: event.content
        };
      }
    } else if (event.eventType === 'DELETED') {
      // Remove the comment from the list
      console.log('Removing comment from list:', event.commentId);
      this.comments = this.comments.filter(c => c.id !== event.commentId);
    }
  }

  private setupIssueWebSocketSubscription() {
    // Subscribe to issue updates
    this.issueUpdateSubscription = this.wsService.getIssueUpdates().subscribe({
      next: (event: IssueUpdateEvent) => {
        // Only reload if this update is for the current issue
        if (this.issue && event.issueId === this.issue.id && event.eventType === 'UPDATED') {
          console.log('Issue updated via WebSocket, reloading issue:', event.issueId);
          this.loadIssue(this.issue.id);
        }
      },
      error: (error) => {
        console.warn('Issue WebSocket subscription error (non-critical):', error);
      }
    });
  }

  ngOnDestroy() {
    if (this.commentUpdateSubscription) {
      this.commentUpdateSubscription.unsubscribe();
    }
    if (this.issueUpdateSubscription) {
      this.issueUpdateSubscription.unsubscribe();
    }
    // Unsubscribe from WebSocket topic when component is destroyed
    if (this.issue) {
      this.wsService.unsubscribeFromComments(this.issue.id);
    }
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
        // Don't add comment here - WebSocket will handle it
        this.newComment = '';
        this.submittingComment = false;
        // WebSocket event will trigger reload of comments
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

  onCommentClick(comment: Comment, event: Event) {
    // Prevent event from bubbling up to parent (comments-section)
    event.stopPropagation();
    
    // Check if the click target is specifically a button or within a button
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      // Don't toggle if clicking on buttons
      return;
    }
    
    // Only allow selection if user is the author
    if (this.isCommentAuthor(comment)) {
      // Toggle selection - if already selected, deselect
      if (this.selectedCommentId === comment.id) {
        this.selectedCommentId = null;
        this.editingCommentId = null;
        this.deletingCommentId = null;
      } else {
        this.selectedCommentId = comment.id;
        // Clear any edit/delete states when selecting a different comment
        this.editingCommentId = null;
        this.deletingCommentId = null;
      }
    }
    // If not the author, do nothing (no visual feedback)
  }

  startEditComment(comment: Comment) {
    this.editingCommentId = comment.id;
    this.editCommentContent = comment.content;
    this.selectedCommentId = null; // Clear selection when entering edit mode
  }

  cancelEditComment() {
    this.editingCommentId = null;
    this.editCommentContent = '';
    this.selectedCommentId = null;
  }

  saveEditComment(commentId: number) {
    if (!this.issue || !this.editCommentContent.trim()) {
      return;
    }

    this.commentService.updateComment(this.issue.id, commentId, { content: this.editCommentContent.trim() }).subscribe({
      next: (updatedComment) => {
        // WebSocket will handle the update, but we can update locally for immediate feedback
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
    this.selectedCommentId = null; // Clear selection when entering delete confirmation
  }

  cancelDeleteComment() {
    this.deletingCommentId = null;
    this.selectedCommentId = null;
  }

  deleteComment(commentId: number) {
    if (!this.issue) {
      return;
    }

    this.commentService.deleteComment(this.issue.id, commentId).subscribe({
      next: () => {
        // WebSocket will handle the deletion, but we can update locally for immediate feedback
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
