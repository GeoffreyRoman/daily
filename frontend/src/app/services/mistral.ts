import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from './auth';

export interface MistralRequest {
  prompt: string;
  context?: string;
}

export interface MistralResponse {
  generated_content: string;
  prompt: string;
  model: string;
}

@Injectable({
  providedIn: 'root'
})
export class Mistral {
  private apiUrl = 'https://daily-ss.onrender.com/api/mistral';

  constructor(private http: HttpClient, private authService: Auth) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  generateContent(request: MistralRequest): Observable<MistralResponse> {
    return this.http.post<MistralResponse>(`${this.apiUrl}/generate`, request, {
      headers: this.getHeaders()
    });
  }
}
