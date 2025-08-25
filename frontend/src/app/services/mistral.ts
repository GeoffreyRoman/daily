import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MistralRequest {
  prompt: string;
  context?: string;
}

export interface MistralResponse {
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
export class Mistral {
  private apiUrl = 'https://daily-ss.onrender.com/api/mistral';

  constructor(private http: HttpClient) { }

  // Note: L'intercepteur ajoute automatiquement les headers d'autorisation

  generateContent(request: MistralRequest): Observable<MistralResponse> {
    return this.http.post<MistralResponse>(`${this.apiUrl}/generate`, request);
  }

  generateSummary(request: SummaryRequest): Observable<SummaryResponse> {
    return this.http.post<SummaryResponse>(`${this.apiUrl}/summarize`, request);
  }
}
