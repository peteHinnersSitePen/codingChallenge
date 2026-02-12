import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActivityLog {
  id: number;
  activityType: string;
  userId: number;
  userName: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private apiUrl = 'http://localhost:8080/api/issues';

  constructor(private http: HttpClient) {}

  getActivityLogs(issueId: number): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/${issueId}/activities`);
  }
}
