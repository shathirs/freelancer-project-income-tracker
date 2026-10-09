import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface Client {
  _id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface ClientPayload {
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'Active' | 'Inactive';
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/clients';

  list(search = '', status = '', sort: 'newest' | 'oldest' = 'newest') {
    let params = new HttpParams().set('sort', sort);

    if (search) {
      params = params.set('search', search);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ clients: Client[] }>(this.apiUrl, { params });
  }

  create(payload: ClientPayload) {
    return this.http.post<{ client: Client }>(this.apiUrl, payload);
  }

  update(id: string, payload: ClientPayload) {
    return this.http.put<{ client: Client }>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}