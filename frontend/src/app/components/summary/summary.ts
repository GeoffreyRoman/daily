import { ChangeDetectorRef, Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Journal, JournalEntry } from '../../services/journal';
import { Mistral, MistralRequest, SummaryRequest } from '../../services/mistral';
import { Auth } from '../../services/auth';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import * as L from 'leaflet';

@Component({
    selector: 'app-summary',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './summary.html',
    styleUrls: ['./summary.scss']
})
export class Summary implements OnInit, AfterViewInit {
    @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

    startDate: string = '';
    endDate: string = '';
    entries: JournalEntry[] = [];
    summary: string = '';
    summaryHtml: SafeHtml = '';
    isLoading = false;
    error: string = '';

    // Propriétés pour la carte
    private map!: L.Map;
    private markers: L.Marker[] = [];
    locationPoints: Array<{ entry: JournalEntry, lat: number, lng: number }> = [];

    constructor(
        private journalService: Journal,
        private mistralService: Mistral,
        private authService: Auth,
        private router: Router,
        private sanitizer: DomSanitizer,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }

        // Définir des dates par défaut (derniers 30 jours)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        this.endDate = this.formatDate(today);
        this.startDate = this.formatDate(thirtyDaysAgo);
    }

    ngAfterViewInit() {
        // Configurer les icônes Leaflet pour corriger le problème d'affichage
        this.configureLeafletIcons();
        // La carte sera initialisée quand on aura des données
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    onDateRangeChange() {
        if (this.startDate && this.endDate) {
            this.loadEntriesInRange();
        }
    }

    private loadEntriesInRange() {
        this.isLoading = true;
        this.error = '';
        this.entries = [];
        this.summary = '';

        this.journalService.searchEntries({
            startDate: this.startDate,
            endDate: this.endDate
        }).subscribe({
            next: (entries) => {
                this.entries = entries;
                this.extractLocationPoints();
                this.isLoading = false;
                this.cdr.detectChanges();

                // Initialiser ou mettre à jour la carte si elle existe
                setTimeout(() => {
                    if (this.mapContainer) {
                        this.initializeMap();
                        this.cdr.detectChanges();
                    }
                }, 100);
            },
            error: (error) => {
                console.error('Erreur lors du chargement des entrées:', error);
                this.error = 'Erreur lors du chargement des entrées';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    generateSummary() {
        if (this.entries.length === 0) {
            this.error = 'Aucune entrée trouvée pour cette période';
            return;
        }

        this.isLoading = true;
        this.error = '';
        this.summary = '';

        // Nouvelle approche simplifiée : tout dans le contexte
        this.generateSummaryWithNewApproach();
    }

    private generateSummaryWithNewApproach() {
        // Préparer les données pour la nouvelle API
        const summaryRequest: SummaryRequest = {
            entries: this.entries.map(entry => ({
                date: entry.date,
                content: entry.content,
                location_name: entry.location_name || undefined
            })),
            startDate: this.startDate,
            endDate: this.endDate
        };

        console.log(`Génération de résumé simplifié pour ${this.entries.length} entrées`);

        this.mistralService.generateSummary(summaryRequest).subscribe({
            next: (response) => {
                this.summary = response.summary;
                this.summaryHtml = this.convertMarkdownToHtml(response.summary);
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Erreur lors de la génération du résumé:', error);
                // Fallback vers l'ancienne méthode en cas d'erreur
                console.log('Tentative avec l\'ancienne méthode...');
                this.generateSummaryWithFallback();
            }
        });
    }

    private generateSummaryWithFallback() {
        // Méthode de secours utilisant l'ancienne approche
        if (this.entries.length <= 5) {
            this.generateSummaryWithSingleCall();
        } else {
            this.generateSummaryWithMultipleCalls();
        }
    }

    private generateSummaryWithSingleCall() {
        const optimizedPrompt = this.createOptimizedPrompt(this.entries);

        const request: MistralRequest = {
            prompt: optimizedPrompt,
            context: `Résumé de journal du ${this.startDate} au ${this.endDate}`
        };

        this.mistralService.generateContent(request).subscribe({
            next: (response) => {
                this.summary = response.generated_content;
                this.summaryHtml = this.convertMarkdownToHtml(response.generated_content);
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Erreur lors de la génération du résumé:', error);
                this.error = 'Erreur lors de la génération du résumé';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private generateSummaryWithMultipleCalls() {
        // Diviser les entrées en groupes de 3-4 entrées
        const chunkSize = 3;
        const entryChunks: JournalEntry[][] = [];

        for (let i = 0; i < this.entries.length; i += chunkSize) {
            entryChunks.push(this.entries.slice(i, i + chunkSize));
        }

        console.log(`Génération de ${entryChunks.length} résumés partiels pour ${this.entries.length} entrées`);

        // Créer les requêtes pour chaque chunk
        const requests = entryChunks.map((chunk, index) => {
            const prompt = this.createOptimizedPrompt(chunk, true, index + 1, entryChunks.length);
            return this.mistralService.generateContent({
                prompt: prompt,
                context: `Résumé partiel ${index + 1}/${entryChunks.length}`
            });
        });

        // Exécuter tous les appels en parallèle
        forkJoin(requests).subscribe({
            next: (responses) => {
                // Combiner tous les résumés partiels
                this.combinePartialSummaries(responses.map(r => r.generated_content));
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Erreur lors de la génération des résumés partiels:', error);
                this.error = 'Erreur lors de la génération des résumés partiels';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private combinePartialSummaries(partialSummaries: string[]) {
        // Créer un prompt pour combiner les résumés partiels
        const combinedContent = partialSummaries.map((summary, index) =>
            `**Période ${index + 1}:**\n${summary}`
        ).join('\n\n---\n\n');

        const finalPrompt = `Voici ${partialSummaries.length} résumés partiels d'un journal. Crée un résumé global cohérent et structuré:

${combinedContent}

Fais une synthèse globale avec thèmes principaux, évolution temporelle et conclusions.`.substring(0, 950);

        const request: MistralRequest = {
            prompt: finalPrompt,
            context: `Synthèse finale de ${this.entries.length} entrées`
        };

        this.mistralService.generateContent(request).subscribe({
            next: (response) => {
                this.summary = response.generated_content;
                this.summaryHtml = this.convertMarkdownToHtml(response.generated_content);
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Erreur lors de la synthèse finale:', error);
                // En cas d'erreur, utiliser la concaténation simple
                this.summary = partialSummaries.join('\n\n---\n\n');
                this.summaryHtml = this.convertMarkdownToHtml(this.summary);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private createOptimizedPrompt(entries: JournalEntry[], isPartial: boolean = false, partIndex?: number, totalParts?: number): string {
        // Calcul dynamique des limites selon le nombre d'entrées
        const basePromptLength = isPartial ? 150 : 200;
        const maxTotalLength = 980;
        const availableContentLength = maxTotalLength - basePromptLength;

        const maxContentPerEntry = Math.floor(availableContentLength / entries.length) - 20;

        const allContent = entries.map(entry => {
            const date = new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            let content = entry.content.length > maxContentPerEntry
                ? entry.content.substring(0, maxContentPerEntry) + '...'
                : entry.content;

            let result = `${date}: ${content}`;
            if (entry.location_name && result.length < maxContentPerEntry + 30) {
                result += ` (${entry.location_name})`;
            }
            return result;
        }).join('\n');

        let prompt: string;

        if (isPartial) {
            prompt = `Résume cette partie ${partIndex}/${totalParts} du journal (${entries.length} entrées):

${allContent}

Résumé concis: thèmes et événements principaux.`;
        } else {
            prompt = `Résume ${entries.length} entrées journal (${new Date(this.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - ${new Date(this.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}):

${allContent}

Résumé structuré: thèmes, événements, lieux.`;
        }

        // Vérification finale et troncature si nécessaire
        if (prompt.length > 1000) {
            console.warn(`Prompt trop long (${prompt.length} caractères), troncature...`);
            return prompt.substring(0, 990) + '...';
        }

        console.log(`Prompt optimisé: ${prompt.length} caractères${isPartial ? ` (partie ${partIndex}/${totalParts})` : ''}`);
        return prompt;
    }

    goToCalendar() {
        this.router.navigate(['/calendar']);
    }

    goToSearch() {
        this.router.navigate(['/search']);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    getFormattedDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatDateString(dateString: string): string {
        return new Date(dateString).toLocaleDateString('fr-FR');
    }

    private convertMarkdownToHtml(markdown: string): SafeHtml {
        // Configurer marked pour un rendu sécurisé
        marked.setOptions({
            breaks: true,
            gfm: true
        });

        const html = marked.parse(markdown);
        return this.sanitizer.bypassSecurityTrustHtml(html as string);
    }

    private configureLeafletIcons() {
        // Supprimer les icônes par défaut problématiques
        delete (L.Icon.Default.prototype as any)._getIconUrl;

        // Configurer les nouvelles icônes
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: '/marker-icon-2x.png',
            iconUrl: '/marker-icon.png',
            shadowUrl: '/marker-shadow.png',
        });
    }

    private extractLocationPoints() {
        this.locationPoints = this.entries
            .filter(entry => entry.latitude && entry.longitude)
            .map(entry => ({
                entry: entry,
                lat: entry.latitude!,
                lng: entry.longitude!
            }));
    }

    private initializeMap() {
        if (!this.mapContainer || this.locationPoints.length === 0) {
            return;
        }

        // Détruire la carte existante si elle existe
        if (this.map) {
            this.map.remove();
        }

        // Créer la carte
        this.map = L.map(this.mapContainer.nativeElement).setView([46.2276, 2.2137], 6); // Centre sur la France

        // Ajouter les tuiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Vider les marqueurs existants
        this.markers.forEach(marker => marker.remove());
        this.markers = [];

        // Ajouter les marqueurs
        this.locationPoints.forEach((point, index) => {
            const marker = L.marker([point.lat, point.lng])
                .addTo(this.map)
                .bindPopup(`
                    <div class="p-2">
                        <h3 class="font-semibold text-sm mb-1">${this.getFormattedDate(point.entry.date)}</h3>
                        ${point.entry.location_name ? `<p class="text-blue-600 text-xs mb-1">📍 ${point.entry.location_name}</p>` : ''}
                        <p class="text-gray-700 text-xs">${point.entry.content.length > 100 ? point.entry.content.substring(0, 100) + '...' : point.entry.content}</p>
                    </div>
                `);

            this.markers.push(marker);
        });

        // Ajuster la vue pour inclure tous les marqueurs
        if (this.locationPoints.length > 1) {
            const group = new L.FeatureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        } else if (this.locationPoints.length === 1) {
            this.map.setView([this.locationPoints[0].lat, this.locationPoints[0].lng], 13);
        }
    }
}
