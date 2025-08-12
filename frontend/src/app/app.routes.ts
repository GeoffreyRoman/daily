import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Calendar } from './components/calendar/calendar';
import { JournalEntry } from './components/journal-entry/journal-entry';
import { Search } from './components/search/search';
import { Summary } from './components/summary/summary';

export const routes: Routes = [
    { path: '', redirectTo: '/calendar', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'calendar', component: Calendar },
    { path: 'entry/:date', component: JournalEntry },
    { path: 'search', component: Search },
    { path: 'summary', component: Summary },
    { path: '**', redirectTo: '/calendar' }
];
