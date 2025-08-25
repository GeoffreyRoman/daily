import { ChangeDetectorRef, Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Journal, JournalEntry as JournalEntryType, EntryImage } from '../../services/journal';
import { Mistral } from '../../services/mistral';
import { Auth } from '../../services/auth';
import { SearchStateService } from '../../services/search-state';
import * as L from 'leaflet';

@Component({
  selector: 'app-journal-entry',
  imports: [FormsModule],
  templateUrl: './journal-entry.html',
  styleUrl: './journal-entry.scss'
})
export class JournalEntry implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('mapPickerContainer', { static: false }) mapPickerContainer!: ElementRef;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  currentDate = '';
  entry: JournalEntryType | null = null;
  isNew = true;
  loading = false;
  saving = false;

  // Form fields
  content = '';
  prompt = '';
  locationName = '';
  latitude: number | null = null;
  longitude: number | null = null;

  // Images
  selectedFiles: FileList | null = null;
  uploadedImages: EntryImage[] = [];
  uploadingImages = false;

  // UI states
  showAiAssistant = false;
  showLocationPicker = false;
  aiGenerating = false;
  fromSearch = false;

  // Map
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  // Map picker
  private mapPicker: L.Map | null = null;
  private pickerMarker: L.Marker | null = null;

  // Image fullscreen mode
  isImageFullscreen = false;
  fullscreenImageSrc: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private journalService: Journal,
    private mistralService: Mistral,
    private authService: Auth,
    private cdr: ChangeDetectorRef,
    private searchStateService: SearchStateService
  ) {
    // Rediriger si pas authentifié
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.currentDate = params['date'];
      this.loadEntry();
      this.cdr.markForCheck();
    });

    // Vérifier si on vient de la page de recherche
    this.route.queryParams.subscribe(queryParams => {
      this.fromSearch = queryParams['fromSearch'] === 'true';
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit() {
    // La carte sera initialisée quand on aura des coordonnées
  }

  loadEntry() {
    this.loading = true;
    this.journalService.getEntryByDate(this.currentDate).subscribe({
      next: (entry) => {
        this.entry = entry;
        this.isNew = false;
        this.content = entry.content;
        this.prompt = entry.prompt || '';
        this.locationName = entry.location_name || '';
        this.latitude = entry.latitude ? Number(entry.latitude) : null;
        this.longitude = entry.longitude ? Number(entry.longitude) : null;
        this.uploadedImages = entry.entry_images || [];
        this.loading = false;

        // Initialiser la carte si des coordonnées existent
        if (this.latitude && this.longitude) {
          setTimeout(() => this.initializeMap(), 100);
        }

        this.cdr.markForCheck();
      },
      error: (error) => {
        if (error.status === 404) {
          // Pas d'entrée pour cette date, c'est normal
          this.isNew = true;
          console.log('isNew');

          this.loading = false;
        } else {
          console.error('Erreur lors du chargement:', error);
        }
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async generateWithAI() {
    if (!this.prompt.trim()) return;

    this.aiGenerating = true;
    this.mistralService.generateContent({
      prompt: this.prompt,
      context: `Date: ${this.currentDate}`
    }).subscribe({
      next: (response) => {
        this.content = response.generated_content;
        this.aiGenerating = true;
        this.showAiAssistant = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erreur lors de la génération:', error);
        this.aiGenerating = false;
        this.cdr.markForCheck();
      }
    });
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.reverseGeocode();
          this.cdr.markForCheck();
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  }

  reverseGeocode() {
    // Simple reverse geocoding avec Nominatim (OpenStreetMap)
    if (this.latitude && this.longitude) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.latitude}&lon=${this.longitude}`)
        .then(response => response.json())
        .then(data => {
          this.locationName = data.display_name || `${this.latitude}, ${this.longitude}`;

          // Initialiser la carte après avoir récupéré le nom du lieu
          setTimeout(() => this.initializeMap(), 100);

          this.cdr.markForCheck();
        })
        .catch(error => {
          console.error('Erreur reverse geocoding:', error);
          this.locationName = `${this.latitude}, ${this.longitude}`;

          // Initialiser la carte même en cas d'erreur
          setTimeout(() => this.initializeMap(), 100);

          this.cdr.markForCheck();
        });
    }
  }

  saveEntry() {
    if (!this.content.trim()) return;

    this.saving = true;
    const entryData = {
      date: this.currentDate,
      content: this.content,
      ai_generated: this.aiGenerating,
      location_name: this.locationName || undefined,
      latitude: this.latitude || undefined,
      longitude: this.longitude || undefined
    };

    const saveObservable = this.isNew
      ? this.journalService.createEntry(entryData)
      : this.journalService.updateEntry(this.entry!.id!, entryData);

    saveObservable.subscribe({
      next: (response) => {
        this.saving = false;
        this.router.navigate(['/calendar']);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde:', error);
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteEntry() {
    if (!this.entry?.id) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      this.journalService.deleteEntry(this.entry.id).subscribe({
        next: () => {
          if (this.fromSearch && this.searchStateService.hasSearchState()) {
            this.router.navigate(['/search']);
          } else {
            this.router.navigate(['/calendar']);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.cdr.markForCheck();
        }
      });
    }
  }

  goBack() {
    if (this.fromSearch && this.searchStateService.hasSearchState()) {
      // Retourner à la page de recherche avec les critères sauvegardés
      this.router.navigate(['/search']);
    } else {
      // Retourner au calendrier par défaut
      this.router.navigate(['/calendar']);
    }
  }

  formatDisplayDate(): string {
    return new Date(this.currentDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  initializeMap() {
    if (!this.latitude || !this.longitude || !this.mapContainer) {
      return;
    }

    // Détruire la carte existante si elle existe
    if (this.map) {
      this.map.remove();
    }

    try {
      // Token Mapbox
      const accessToken = 'pk.eyJ1IjoiZ2VvZmZyZXktMyIsImEiOiJjam1oaGt4anYxYW53M3V0ODBrY2ptY2wzIn0.m13RSCPj-ck2-ynQ2M2HnA';

      // Créer la carte
      this.map = L.map(this.mapContainer.nativeElement).setView([this.latitude, this.longitude], 15);

      // Ajouter la couche de tuiles Mapbox
      L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${accessToken}`, {
        attribution: '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        tileSize: 512,
        zoomOffset: -1
      }).addTo(this.map);

      // Créer l'icône personnalisée pour le marqueur
      const customIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626" width="24" height="24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `),
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
      });

      // Ajouter le marqueur
      this.marker = L.marker([this.latitude, this.longitude], { icon: customIcon })
        .addTo(this.map)
        .bindPopup(this.locationName || `${this.latitude}, ${this.longitude}`)
        .openPopup();

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }
  }

  hasLocation(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }

  formatCoordinates(): string {
    if (this.latitude !== null && this.longitude !== null &&
      typeof this.latitude === 'number' && typeof this.longitude === 'number') {
      return `${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}`;
    }
    return '';
  }

  toggleLocationPicker() {
    this.showLocationPicker = !this.showLocationPicker;
    if (this.showLocationPicker) {
      setTimeout(() => this.initializeMapPicker(), 100);
    } else {
      this.destroyMapPicker();
    }
  }

  initializeMapPicker() {
    if (!this.mapPickerContainer) {
      return;
    }

    // Détruire la carte existante si elle existe
    this.destroyMapPicker();

    try {
      // Token Mapbox
      const accessToken = 'pk.eyJ1IjoiZ2VvZmZyZXktMyIsImEiOiJjam1oaGt4anYxYW53M3V0ODBrY2ptY2wzIn0.m13RSCPj-ck2-ynQ2M2HnA';

      // Position par défaut (Paris) ou position actuelle si disponible
      const defaultLat = this.latitude || 48.8566;
      const defaultLng = this.longitude || 2.3522;

      // Créer la carte
      this.mapPicker = L.map(this.mapPickerContainer.nativeElement).setView([defaultLat, defaultLng], 13);

      // Ajouter la couche de tuiles Mapbox
      L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${accessToken}`, {
        attribution: '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        tileSize: 512,
        zoomOffset: -1
      }).addTo(this.mapPicker);

      // Créer l'icône personnalisée pour le marqueur
      const customIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="24" height="24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `),
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
      });

      // Ajouter un marqueur s'il y a déjà une position
      if (this.latitude && this.longitude) {
        this.pickerMarker = L.marker([this.latitude, this.longitude], { icon: customIcon })
          .addTo(this.mapPicker)
          .bindPopup('Position actuelle');
      }

      // Gérer les clics sur la carte
      this.mapPicker.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        // Supprimer le marqueur existant
        if (this.pickerMarker) {
          this.mapPicker!.removeLayer(this.pickerMarker);
        }

        // Ajouter un nouveau marqueur
        this.pickerMarker = L.marker([lat, lng], { icon: customIcon })
          .addTo(this.mapPicker!)
          .bindPopup('Nouvelle position sélectionnée')
          .openPopup();

        // Mettre à jour les coordonnées
        this.latitude = lat;
        this.longitude = lng;

        // Faire le reverse geocoding
        this.reverseGeocode();

        this.cdr.markForCheck();
      });

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte de sélection:', error);
    }
  }

  destroyMapPicker() {
    if (this.mapPicker) {
      this.mapPicker.remove();
      this.mapPicker = null;
      this.pickerMarker = null;
    }
  }

  confirmLocationSelection() {
    this.showLocationPicker = false;
    this.destroyMapPicker();

    // Mettre à jour la carte d'affichage si elle existe
    if (this.latitude && this.longitude) {
      setTimeout(() => this.initializeMap(), 100);
    }
  }

  // Méthodes pour gérer les images
  onFileSelected(event: any) {
    this.selectedFiles = event.target.files;
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  uploadImages() {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      return;
    }

    if (!this.entry?.id) {
      alert('Veuillez d\'abord sauvegarder l\'entrée avant d\'ajouter des images.');
      return;
    }

    this.uploadingImages = true;

    // Convertir les fichiers en base64
    const promises: Promise<any>[] = [];
    for (let i = 0; i < this.selectedFiles.length; i++) {
      const file = this.selectedFiles[i];
      promises.push(this.fileToBase64(file));
    }

    Promise.all(promises).then(images => {
      this.journalService.uploadImages(this.entry!.id!, images).subscribe({
        next: (response) => {
          this.uploadedImages.push(...response.images);
          this.selectedFiles = null;
          this.fileInput.nativeElement.value = '';
          this.uploadingImages = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors de l\'upload des images:', error);
          alert('Erreur lors de l\'upload des images: ' + (error.error?.error || 'Erreur inconnue'));
          this.uploadingImages = false;
          this.cdr.markForCheck();
        }
      });
    }).catch(error => {
      console.error('Erreur lors de la conversion des images:', error);
      alert('Erreur lors de la conversion des images');
      this.uploadingImages = false;
      this.cdr.markForCheck();
    });
  }

  private fileToBase64(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Retirer "data:image/...;base64,"
        resolve({
          original_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          image_data: base64
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  deleteImage(imageId: number) {
    if (!this.entry?.id) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      this.journalService.deleteImage(this.entry.id, imageId).subscribe({
        next: () => {
          this.uploadedImages = this.uploadedImages.filter(img => img.id !== imageId);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de l\'image:', error);
          alert('Erreur lors de la suppression de l\'image');
        }
      });
    }
  }

  getImageUrl(image: any): string {
    return this.journalService.getImageDataUrl(image);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Méthodes pour le mode plein écran de l'image
  showImageFullscreen(url: string) {
    this.fullscreenImageSrc = url;
    this.isImageFullscreen = true;
  }

  closeImageFullscreen() {
    this.isImageFullscreen = false;
    this.fullscreenImageSrc = '';
  }

  onWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeImageFullscreen();
    }
  }
}
