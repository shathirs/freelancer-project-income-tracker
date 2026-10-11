import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface IncomeProject {
  _id: string;
  name: string;
  client: {
    _id: string;
    name: string;
  };
}

export interface Income {
  _id: string;
  type: 'Payment' | 'Invoice';
  amount: number;
  status: 'Paid' | 'Pending';
  date: string;
  project: IncomeProject;
  createdAt: string;
}

export interface IncomePayload {
  project: string;
  type: 'Payment' | 'Invoice';
  amount: number;
  status: 'Paid' | 'Pending';
  date: string;
}

@Injectable({ providedIn: 'root' })
export class IncomeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/income';

  list(search = '', status = '', client = '', from = '', to = '') {
    let params = new HttpParams();

    if (search) {
      params = params.set('search', search);
    }

    if (status) {
      params = params.set('status', status);
    }

    if (client) {
      params = params.set('client', client);
    }

    if (from) {
      params = params.set('from', from);
    }

    if (to) {
      params = params.set('to', to);
    }

    return this.http.get<{ income: Income[] }>(this.apiUrl, { params });
  }

  create(payload: IncomePayload) {
    return this.http.post<{ income: Income }>(this.apiUrl, payload);
  }

  update(id: string, payload: IncomePayload) {
    return this.http.put<{ income: Income }>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}