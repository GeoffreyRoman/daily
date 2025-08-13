import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from './auth';

export interface JournalEntry {
  id?: number;
  user_id?: number;
  date: string;
  content: string;
  ai_generated?: boolean;
  prompt?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  entry_images?: EntryImage[];
  created_at?: string;
  updated_at?: string;
}

export interface EntryImage {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
}

export interface SearchRequest {
  keyword?: string;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Journal {
  private apiUrl = 'https://daily-ss.onrender.com/api/journal';

  constructor(private http: HttpClient, private authService: Auth) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getUploadHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Pas de Content-Type pour les uploads multipart/form-data
    });
  }

  createEntry(entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Observable<any> {
    return this.http.post(`${this.apiUrl}`, entry, { headers: this.getHeaders() });
  }

  getAllEntries(): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}`, { headers: this.getHeaders() });
  }

  getEntryByDate(date: string): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.apiUrl}/date/${date}`, { headers: this.getHeaders() });
  }

  updateEntry(id: number, entry: Omit<JournalEntry, 'user_id' | 'created_at' | 'updated_at'>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, entry, { headers: this.getHeaders() });
  }

  deleteEntry(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  searchEntries(searchRequest: SearchRequest): Observable<JournalEntry[]> {
    return this.http.post<JournalEntry[]>(`${this.apiUrl}/search`, searchRequest, { headers: this.getHeaders() });
  }

  // Méthodes pour gérer les images
  uploadImages(entryId: number, files: FileList): Observable<any> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    return this.http.post(`${this.apiUrl}/${entryId}/images`, formData, { headers: this.getUploadHeaders() });
  }

  deleteImage(entryId: number, imageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${entryId}/images/${imageId}`, { headers: this.getHeaders() });
  }

  getImageUrl(filename: string): string {
    return `${this.apiUrl}/images/${filename}`;
  }
}
