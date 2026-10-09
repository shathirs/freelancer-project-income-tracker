import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface ProjectClient {
  _id: string;
  name: string;
}

export interface Project {
  _id: string;
  name: string;
  category: string;
  status: 'In Progress' | 'Completed' | 'On Hold';
  startDate: string;
  endDate: string | null;
  fee: number;
  feeNote: string;
  client: ProjectClient;
  createdAt: string;
}

export interface ProjectPayload {
  name: string;
  client: string;
  category: string;
  status: 'In Progress' | 'Completed' | 'On Hold';
  startDate: string;
  endDate: string | null;
  fee: number;
  feeNote: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/projects';

  list(search = '', status = '', client = '', sort: 'newest' | 'oldest' = 'newest') {
    let params = new HttpParams().set('sort', sort);

    if (search) {
      params = params.set('search', search);
    }

    if (status) {
      params = params.set('status', status);
    }

    if (client) {
      params = params.set('client', client);
    }

    return this.http.get<{ projects: Project[] }>(this.apiUrl, { params });
  }

  create(payload: ProjectPayload) {
    return this.http.post<{ project: Project }>(this.apiUrl, payload);
  }

  update(id: string, payload: ProjectPayload) {
    return this.http.put<{ project: Project }>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}