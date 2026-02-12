import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  projectId: number;
  projectName: string;
  assigneeId?: number;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  projectId: number;
  assigneeId?: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface IssueFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId?: number;
  projectId?: number;
  searchText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  private apiUrl = 'http://localhost:8080/api/issues';

  constructor(private http: HttpClient) {}

  getIssues(filters: IssueFilters = {}): Observable<PageResponse<Issue>> {
    let params = new HttpParams();
    
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.assigneeId !== undefined) params = params.set('assigneeId', filters.assigneeId.toString());
    if (filters.projectId !== undefined) params = params.set('projectId', filters.projectId.toString());
    if (filters.searchText) params = params.set('searchText', filters.searchText);

    return this.http.get<PageResponse<Issue>>(this.apiUrl, { params });
  }

  getIssueById(id: number): Observable<Issue> {
    return this.http.get<Issue>(`${this.apiUrl}/${id}`);
  }

  createIssue(issue: CreateIssueRequest): Observable<Issue> {
    return this.http.post<Issue>(this.apiUrl, issue);
  }

  updateIssue(id: number, issue: CreateIssueRequest): Observable<Issue> {
    return this.http.put<Issue>(`${this.apiUrl}/${id}`, issue);
  }

  deleteIssue(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
