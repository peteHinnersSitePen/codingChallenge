import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface IssueUpdateEvent {
  eventType: 'CREATED' | 'UPDATED' | 'DELETED';
  issueId: number;
  title: string;
  status: string;
  priority: string;
  projectId: number;
}

export interface CommentUpdateEvent {
  eventType: 'CREATED' | 'UPDATED' | 'DELETED';
  commentId: number;
  issueId: number;
  content?: string;
  authorId?: number;
  authorName?: string;
}

export interface ActivityLogUpdateEvent {
  eventType: 'CREATED';
  activityLogId: number;
  issueId: number;
  activityType: string;
  userId: number;
  userName: string;
  oldValue: string | null;
  newValue: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private issueUpdates$ = new Subject<IssueUpdateEvent>();
  private commentUpdates$ = new Subject<CommentUpdateEvent>();
  private activityLogUpdates$ = new Subject<ActivityLogUpdateEvent>();
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private stompClient: Client | null = null;
  private issueSubscription: any = null; // Store subscription reference
  private commentSubscriptions: Map<number, any> = new Map(); // Store comment subscriptions by issueId
  private activitySubscriptions: Map<number, any> = new Map(); // Store activity subscriptions by issueId
  private pendingCommentSubscriptions: Set<number> = new Set(); // Track issueIds that need subscription
  private pendingActivitySubscriptions: Set<number> = new Set(); // Track issueIds that need activity subscription
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isConnecting = false;

  constructor() {
    // Delay connection to avoid blocking app initialization
    setTimeout(() => {
      try {
        this.connect();
      } catch (error) {
        console.warn('WebSocket connection failed (non-critical):', error);
      }
    }, 500);
  }

  private connect() {
    if (this.isConnecting || (this.stompClient && this.stompClient.connected)) {
      return;
    }

    try {
      this.isConnecting = true;

      // Create SockJS connection
      const socket = new SockJS('http://localhost:8080/ws');
      this.stompClient = new Client({
        webSocketFactory: () => socket as any,
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str: string) => {
          // Uncomment for debugging: console.log('STOMP:', str);
        },
        onConnect: () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionStatus$.next(true);
          this.subscribeToIssues();
          // Subscribe to any pending comment subscriptions
          this.pendingCommentSubscriptions.forEach(issueId => {
            this.subscribeToComments(issueId);
          });
          this.pendingCommentSubscriptions.clear();
          // Subscribe to any pending activity subscriptions
          this.pendingActivitySubscriptions.forEach(issueId => {
            this.subscribeToActivities(issueId);
          });
          this.pendingActivitySubscriptions.clear();
        },
        onStompError: (frame: any) => {
          console.error('STOMP error:', frame);
          this.isConnecting = false;
          this.connectionStatus$.next(false);
          this.attemptReconnect();
        },
        onWebSocketClose: () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.connectionStatus$.next(false);
          this.attemptReconnect();
        },
        onDisconnect: () => {
          console.log('STOMP disconnected');
          this.connectionStatus$.next(false);
        }
      });

      this.stompClient.activate();
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      this.isConnecting = false;
      this.connectionStatus$.next(false);
      // Don't block the app if WebSocket fails - it's optional for real-time updates
    }
  }

  private subscribeToIssues() {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    // Unsubscribe from previous subscription if it exists
    if (this.issueSubscription) {
      this.issueSubscription.unsubscribe();
    }
    
    this.issueSubscription = this.stompClient.subscribe('/topic/issues', (message) => {
      try {
        const event: IssueUpdateEvent = JSON.parse(message.body);
        this.issueUpdates$.next(event);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  getIssueUpdates(): Observable<IssueUpdateEvent> {
    return this.issueUpdates$.asObservable();
  }

  getCommentUpdates(issueId: number): Observable<CommentUpdateEvent> {
    // Subscribe to comment updates for a specific issue
    // If WebSocket is connected, subscribe immediately
    // If not connected, add to pending subscriptions (will subscribe when connected)
    this.subscribeToComments(issueId);
    
    return this.commentUpdates$.asObservable();
  }

  private subscribeToComments(issueId: number) {
    // Don't subscribe if already subscribed to this issue
    if (this.commentSubscriptions.has(issueId)) {
      console.log(`Already subscribed to comments for issue ${issueId}`);
      return;
    }

    // If not connected, add to pending subscriptions
    if (!this.stompClient || !this.stompClient.connected) {
      console.log(`WebSocket not connected, adding issue ${issueId} to pending subscriptions`);
      this.pendingCommentSubscriptions.add(issueId);
      return;
    }

    const topic = `/topic/issues/${issueId}/comments`;
    console.log(`Subscribing to comment topic: ${topic}`);
    const subscription = this.stompClient.subscribe(topic, (message) => {
      try {
        const event: CommentUpdateEvent = JSON.parse(message.body);
        console.log(`Received comment update event for issue ${issueId}:`, event);
        // Verify the event is for this issue (safety check)
        if (event.issueId === issueId) {
          this.commentUpdates$.next(event);
        } else {
          console.warn(`Received comment event for different issue. Expected ${issueId}, got ${event.issueId}`);
        }
      } catch (error) {
        console.error('Error parsing comment WebSocket message:', error);
      }
    });

    this.commentSubscriptions.set(issueId, subscription);
    this.pendingCommentSubscriptions.delete(issueId); // Remove from pending if it was there
    console.log(`Successfully subscribed to comment updates for issue ${issueId}`);
  }

  unsubscribeFromComments(issueId: number) {
    const subscription = this.commentSubscriptions.get(issueId);
    if (subscription) {
      subscription.unsubscribe();
      this.commentSubscriptions.delete(issueId);
    }
  }

  getActivityLogUpdates(issueId: number): Observable<ActivityLogUpdateEvent> {
    this.subscribeToActivities(issueId);
    return this.activityLogUpdates$.asObservable();
  }

  private subscribeToActivities(issueId: number) {
    if (this.activitySubscriptions.has(issueId)) {
      return;
    }

    if (!this.stompClient || !this.stompClient.connected) {
      this.pendingActivitySubscriptions.add(issueId);
      return;
    }

    const topic = `/topic/issues/${issueId}/activities`;
    const subscription = this.stompClient.subscribe(topic, (message) => {
      try {
        const event: ActivityLogUpdateEvent = JSON.parse(message.body);
        if (event.issueId === issueId) {
          this.activityLogUpdates$.next(event);
        }
      } catch (error) {
        console.error('Error parsing activity log WebSocket message:', error);
      }
    });

    this.activitySubscriptions.set(issueId, subscription);
    this.pendingActivitySubscriptions.delete(issueId);
  }

  unsubscribeFromActivities(issueId: number) {
    const subscription = this.activitySubscriptions.get(issueId);
    if (subscription) {
      subscription.unsubscribe();
      this.activitySubscriptions.delete(issueId);
    }
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }

  disconnect() {
    // Unsubscribe from all comment subscriptions
    this.commentSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.commentSubscriptions.clear();
    
    // Unsubscribe from all activity subscriptions
    this.activitySubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.activitySubscriptions.clear();

    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }
}
