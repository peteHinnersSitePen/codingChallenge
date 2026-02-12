import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = 'http://localhost:8080/api/issues';

  constructor(private http: HttpClient) {}

  getComments(issueId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/${issueId}/comments`);
  }

  createComment(issueId: number, request: CreateCommentRequest): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${issueId}/comments`, request);
  }
}
