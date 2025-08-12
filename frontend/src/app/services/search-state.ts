import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SearchRequest } from './journal';

export interface SearchState {
    criteria: SearchRequest;
    keyword: string;
    startDate: string;
    endDate: string;
    latitude: number | null;
    longitude: number | null;
    radius: number;
    showAdvanced: boolean;
    showMap: boolean;
    results: any[];
}

@Injectable({
    providedIn: 'root'
})
export class SearchStateService {
    private searchStateSubject = new BehaviorSubject<SearchState | null>(null);
    public searchState$ = this.searchStateSubject.asObservable();

    private currentSearchState: SearchState | null = null;

    saveSearchState(state: SearchState) {
        this.currentSearchState = { ...state };
        this.searchStateSubject.next(this.currentSearchState);
    }

    getSearchState(): SearchState | null {
        return this.currentSearchState;
    }

    clearSearchState() {
        this.currentSearchState = null;
        this.searchStateSubject.next(null);
    }

    hasSearchState(): boolean {
        return this.currentSearchState !== null;
    }
}
