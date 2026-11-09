import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api';

export type Mood = 'great' | 'good' | 'okay' | 'bad' | 'awful';

export interface JournalEntry {
  id?: number;
  user_id?: number;
  date: string;
  content: string;
  prompt?: string;
  ai_generated?: boolean;
  mood?: Mood | null;
  tags?: string[];
  is_favorite?: boolean;
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
  private apiUrl = `${API_BASE_URL}/journal`;

  constructor(private http: HttpClient) { }

  // Note: L'intercepteur ajoute automatiquement les headers d'autorisation
  // Plus besoin de les ajouter manuellement ici

  createEntry(entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Observable<any> {
    return this.http.post(`${this.apiUrl}`, entry);
  }

  getAllEntries(): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}`);
  }

  getEntryByDate(date: string): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.apiUrl}/date/${date}`);
  }

  updateEntry(id: number, entry: Omit<JournalEntry, 'user_id' | 'created_at' | 'updated_at'>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, entry);
  }

  deleteEntry(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  searchEntries(searchRequest: SearchRequest): Observable<JournalEntry[]> {
    return this.http.post<JournalEntry[]>(`${this.apiUrl}/search`, searchRequest);
  }

  // Méthodes pour gérer les images
  uploadImages(entryId: number, images: any[]): Observable<any> {
    // Les images sont maintenant des objets avec base64
    return this.http.post(`${this.apiUrl}/${entryId}/images`, { images });
  }

  deleteImage(entryId: number, imageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${entryId}/images/${imageId}`);
  }

  // Plus besoin de getImageUrl car les images sont en base64
  getImageDataUrl(image: any): string {
    return `data:${image.mime_type};base64,${image.image_data}`;
  }
}
