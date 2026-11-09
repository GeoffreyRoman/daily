import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api';

export interface GeminiRequest {
  prompt: string;
  context?: string;
}

export interface GeminiResponse {
  generated_content: string;
  prompt: string;
  model: string;
}

export interface SummaryRequest {
  entries: Array<{
    date: string;
    content: string;
    location_name?: string;
  }>;
  startDate: string;
  endDate: string;
}

export interface SummaryResponse {
  summary: string;
  entries_count: number;
  period: {
    start: string;
    end: string;
  };
  model: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiUrl = `${API_BASE_URL}/gemini`;

  constructor(private http: HttpClient) { }

  // Note: L'intercepteur ajoute automatiquement les headers d'autorisation

  generateContent(request: GeminiRequest): Observable<GeminiResponse> {
    return this.http.post<GeminiResponse>(`${this.apiUrl}/generate`, request);
  }

  generateSummary(request: SummaryRequest): Observable<SummaryResponse> {
    return this.http.post<SummaryResponse>(`${this.apiUrl}/summarize`, request);
  }
}
