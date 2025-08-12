import { ChangeDetectorRef, Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Journal, JournalEntry, SearchRequest } from '../../services/journal';
import { Auth } from '../../services/auth';
import { SearchStateService } from '../../services/search-state';
import * as L from 'leaflet';

@Component({
  selector: 'app-search',
  imports: [FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.scss'
})
export class Search implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  private searchCircle!: L.Circle | null;
  private searchMarker!: L.Marker | null;

  searchQuery: SearchRequest = {};
  results: JournalEntry[] = [];
  loading = false;
  showAdvanced = false;
  showMap = false;

  // Search form fields
  keyword = '';
  startDate = '';
  endDate = '';
  latitude: number | null = null;
  longitude: number | null = null;
  radius = 10; // km

  // Radius options for selection
  radiusOptions = [1, 5, 10, 20, 50, 100, 250, 500];

  constructor(
    private journalService: Journal,
    private authService: Auth,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private searchStateService: SearchStateService
  ) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    // Vérifier d'abord si on vient du calendrier
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['fromCalendar'] === 'true') {
        // Si on vient du calendrier, nettoyer l'état précédent
        this.searchStateService.clearSearchState();
        // Initialiser avec toutes les entrées
        this.searchEntries();
      } else {
        // Vérifier si on a un état de recherche sauvegardé (venant d'une entrée)
        const savedState = this.searchStateService.getSearchState();
        if (savedState) {
          // Restaurer l'état de recherche
          this.keyword = savedState.keyword;
          this.startDate = savedState.startDate;
          this.endDate = savedState.endDate;
          this.latitude = savedState.latitude;
          this.longitude = savedState.longitude;
          this.radius = savedState.radius;
          this.showAdvanced = savedState.showAdvanced;
          this.showMap = savedState.showMap;
          this.results = savedState.results;

          // Si on doit afficher la carte, l'initialiser
          if (this.showMap) {
            setTimeout(() => {
              this.initMap();
            }, 300);
          }
        } else {
          // Initialiser avec toutes les entrées si aucun état sauvegardé
          this.searchEntries();
        }
      }
    });
  }

  ngAfterViewInit() {
    // La carte sera initialisée quand showMap devient true
  }

  initMap() {
    const mapElement = document.getElementById('map-container');
    console.log('initMap called, element found:', !!mapElement, 'map exists:', !!this.map);

    if (this.map || !mapElement) {
      console.log('Map already initialized or element not found:', !!this.map, !!mapElement);
      return;
    }

    try {
      console.log('Starting map initialization...');

      // Essayer d'abord la configuration standard des icônes
      try {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: './marker-icon-2x.png',
          iconUrl: './marker-icon.png',
          shadowUrl: './marker-shadow.png',
        });
        console.log('Leaflet icons configured successfully');
      } catch (iconError) {
        console.warn('Could not configure Leaflet icons, using fallback:', iconError);
        // Fallback: créer une icône simple sans fichier
        const fallbackIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        L.Marker.prototype.options.icon = fallbackIcon;
      }

      console.log('Creating Leaflet map...');
      // Initialiser la carte
      this.map = L.map(mapElement, {
        center: [46.603354, 1.888334], // Centre de la France
        zoom: 6,
        preferCanvas: false
      });

      console.log('Adding tile layer...');
      // Ajouter le layer de tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      console.log('Setting up event handlers...');
      // Ajouter un gestionnaire de clic sur la carte
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        console.log('Map clicked at:', e.latlng);
        this.setSearchLocation(e.latlng.lat, e.latlng.lng);
      });

      // Forcer un redimensionnement de la carte après initialisation
      setTimeout(() => {
        if (this.map) {
          console.log('Invalidating map size...');
          this.map.invalidateSize();

          // Si on a déjà une position, l'afficher
          if (this.latitude && this.longitude) {
            console.log('Updating existing markers...');
            this.updateMapMarkers();
          }
        }
      }, 200);

      console.log('Carte initialisée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }
  }

  toggleMap() {
    console.log('Toggle map called, showMap will be:', !this.showMap);
    this.showMap = !this.showMap;
    if (this.showMap) {
      console.log('Showing map, waiting for DOM update...');
      // Attendre que le DOM soit mis à jour
      setTimeout(() => {
        this.initMap();
      }, 300);
    } else {
      console.log('Hiding map, cleaning up...');
      // Nettoyer la carte quand on la cache
      if (this.map) {
        this.map.remove();
        this.map = null as any;
        this.searchMarker = null;
        this.searchCircle = null;
      }
    }
  }

  setSearchLocation(lat: number, lng: number) {
    this.latitude = lat;
    this.longitude = lng;
    this.updateMapMarkers();
  }

  updateMapMarkers() {
    if (!this.map || !this.latitude || !this.longitude) {
      return;
    }

    // Supprimer les marqueurs existants
    if (this.searchMarker) {
      this.map.removeLayer(this.searchMarker);
    }
    if (this.searchCircle) {
      this.map.removeLayer(this.searchCircle);
    }

    // Créer une icône personnalisée pour le marqueur de recherche
    const searchIcon = L.divIcon({
      className: 'custom-search-marker',
      html: `
        <div style="
          background-color: #3b82f6; 
          width: 20px; 
          height: 20px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
            font-weight: bold;
          ">📍</div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    // Ajouter le nouveau marqueur
    this.searchMarker = L.marker([this.latitude, this.longitude], { icon: searchIcon })
      .addTo(this.map)
      .bindPopup(`Zone de recherche<br>Rayon: ${this.radius} km`);

    // Ajouter le cercle de recherche
    this.searchCircle = L.circle([this.latitude, this.longitude], {
      radius: this.radius * 1000, // Convertir km en mètres
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      weight: 2
    }).addTo(this.map);

    // Centrer la carte sur la zone
    this.map.setView([this.latitude, this.longitude], this.getZoomForRadius());

    console.log('Map markers updated successfully');
  }

  getZoomForRadius(): number {
    // Calculer le niveau de zoom approprié selon le rayon
    if (this.radius <= 1) return 15;
    if (this.radius <= 5) return 13;
    if (this.radius <= 10) return 12;
    if (this.radius <= 20) return 11;
    if (this.radius <= 50) return 10;
    return 9;
  }

  onRadiusChange() {
    this.updateMapMarkers();
  }

  clearMapSelection() {
    this.latitude = null;
    this.longitude = null;
    if (this.searchMarker) {
      this.map.removeLayer(this.searchMarker);
      this.searchMarker = null;
    }
    if (this.searchCircle) {
      this.map.removeLayer(this.searchCircle);
      this.searchCircle = null;
    }
  }

  searchEntries() {
    this.loading = true;

    const searchRequest: SearchRequest = {};

    if (this.keyword.trim()) {
      searchRequest.keyword = this.keyword.trim();
    }

    if (this.startDate) {
      searchRequest.startDate = this.startDate;
    }

    if (this.endDate) {
      searchRequest.endDate = this.endDate;
    }

    if (this.latitude && this.longitude && this.radius) {
      searchRequest.latitude = this.latitude;
      searchRequest.longitude = this.longitude;
      searchRequest.radius = this.radius;
    }

    this.journalService.searchEntries(searchRequest).subscribe({
      next: (results) => {
        this.results = results;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  clearSearch() {
    this.keyword = '';
    this.startDate = '';
    this.endDate = '';
    this.latitude = null;
    this.longitude = null;
    this.radius = 10;
    this.clearMapSelection();
    this.searchEntries();
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.setSearchLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  }

  goToEntry(entry: JournalEntry) {
    // Sauvegarder l'état actuel de la recherche
    this.saveCurrentSearchState();

    // S'assurer que la date est au format local "YYYY-MM-DD" sans UTC
    let dateStr = entry.date;
    if (dateStr && dateStr.includes('T')) {
      const d = new Date(dateStr);
      dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    }
    this.router.navigate(['/entry', dateStr], {
      queryParams: { fromSearch: 'true' }
    });
  }

  goBack() {
    // Nettoyer l'état de recherche sauvegardé car on quitte la recherche
    this.searchStateService.clearSearchState();
    this.router.navigate(['/calendar']);
  }

  goToSummary() {
    this.router.navigate(['/summary']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  truncateContent(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  private saveCurrentSearchState() {
    const searchState = {
      criteria: {
        keyword: this.keyword.trim() || undefined,
        startDate: this.startDate || undefined,
        endDate: this.endDate || undefined,
        latitude: this.latitude || undefined,
        longitude: this.longitude || undefined,
        radius: this.radius || undefined
      },
      keyword: this.keyword,
      startDate: this.startDate,
      endDate: this.endDate,
      latitude: this.latitude,
      longitude: this.longitude,
      radius: this.radius,
      showAdvanced: this.showAdvanced,
      showMap: this.showMap,
      results: this.results
    };

    this.searchStateService.saveSearchState(searchState);
  }
}
