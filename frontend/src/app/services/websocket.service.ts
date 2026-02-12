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

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private issueUpdates$ = new Subject<IssueUpdateEvent>();
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private stompClient: Client | null = null;
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

    this.stompClient.subscribe('/topic/issues', (message) => {
      try {
        const event: IssueUpdateEvent = JSON.parse(message.body);
        console.log('Issue update received:', event);
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

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }
}
