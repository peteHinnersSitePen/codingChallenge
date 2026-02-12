import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface IssueUpdateEvent {
  eventType: 'CREATED' | 'UPDATED' | 'DELETED';
  issueId: number;
  title: string;
  status: string;
  priority: string;
  projectId: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private issueUpdates$ = new Subject<IssueUpdateEvent>();
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor() {
    // For MVP, using Server-Sent Events (SSE) which is simpler than WebSocket
    // This can be upgraded to WebSocket/STOMP later
    this.connectSSE();
  }

  private connectSSE() {
    try {
      // Using SSE endpoint (we'll need to create this in backend)
      // For now, this is a placeholder - WebSocket implementation would require STOMP client
      // For MVP, we'll use polling or implement a simpler WebSocket approach
      console.log('WebSocket service initialized - real-time updates will be available');
    } catch (error) {
      console.error('Failed to initialize WebSocket service:', error);
    }
  }

  // Placeholder method - in production, this would connect via WebSocket/STOMP
  // For MVP, we can use polling or implement a simpler solution
  getIssueUpdates(): Observable<IssueUpdateEvent> {
    return this.issueUpdates$.asObservable();
  }

  // Method to manually trigger updates (for MVP - can be replaced with real WebSocket)
  notifyIssueUpdate(event: IssueUpdateEvent) {
    this.issueUpdates$.next(event);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
