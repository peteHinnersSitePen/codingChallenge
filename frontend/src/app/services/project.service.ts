import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Project {
  id: number;
  name: string;
  ownerId: number;
  ownerName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProjectRequest {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:8080/api/projects';

  constructor(private http: HttpClient) {}

  getAllProjects(sortBy?: string, sortDir?: string, searchText?: string): Observable<Project[]> {
    let params = new HttpParams();
    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }
    if (sortDir) {
      params = params.set('sortDir', sortDir);
    }
    if (searchText && searchText.trim()) {
      params = params.set('searchText', searchText.trim());
    }
    return this.http.get<Project[]>(this.apiUrl, { params });
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(project: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  updateProject(id: number, project: CreateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
