import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { Journal, JournalEntry } from '../../services/journal';
import { Auth } from '../../services/auth';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasEntry: boolean;
  entry?: JournalEntry;
}

@Component({
  selector: 'app-calendar',
  imports: [],
  templateUrl: './calendar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './calendar.scss'
})
export class Calendar implements OnInit {
  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  entries: JournalEntry[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private journalService: Journal,
    private authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Rediriger vers login si pas authentifié
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.loadEntries();
    this.generateCalendar();
  }

  loadEntries() {
    this.loading = true;
    this.journalService.getAllEntries().subscribe({
      next: (entries) => {

        this.entries = entries;

        this.generateCalendar();
        this.loading = false;

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des entrées:', error);
        this.errorMessage = error.error?.error || 'Impossible de charger vos entrées. Vérifiez votre connexion au serveur.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);

    // Premier lundi de la grille du calendrier
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

    // Dernier dimanche de la grille du calendrier
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - ((lastDay.getDay() + 6) % 7)));

    this.calendarDays = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = this.formatDate(currentDate);
      const entry = this.entries.find(e => {
        return this.formatDate(new Date(e.date)) === dateString;
      });

      this.calendarDays.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        hasEntry: !!entry,
        entry: entry
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  formatDate(date: Date): string {
    // Les dates du journal sont des dates civiles, pas des instants UTC.
    // Utiliser toISOString() décalait les entrées d'un jour en Europe.
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendar();
  }

  getCurrentMonthYear(): string {
    return this.currentDate.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  }

  onDayClick(day: CalendarDay) {
    this.router.navigate(['/entry', this.formatDate(day.date)]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToSearch() {
    this.router.navigate(['/search'], { queryParams: { fromCalendar: 'true' } });
  }

  goToSummary() {
    this.router.navigate(['/summary']);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Obtenir les statistiques du mois actuel
  getMonthlyStats() {
    const currentMonthDays = this.calendarDays.filter(day => day.isCurrentMonth);
    const daysWithEntries = currentMonthDays.filter(day => day.hasEntry);
    const totalDays = currentMonthDays.length;
    const completedDays = daysWithEntries.length;
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    return {
      totalDays,
      completedDays,
      emptyDays: totalDays - completedDays,
      completionRate
    };
  }

  // Obtenir la classe CSS pour la barre de progression
  getProgressBarClass(): string {
    const rate = this.getMonthlyStats().completionRate;
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    if (rate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }
}
