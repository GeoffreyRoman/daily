import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Calendar } from './components/calendar/calendar';
import { JournalEntry } from './components/journal-entry/journal-entry';
import { Search } from './components/search/search';
import { Summary } from './components/summary/summary';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/calendar', pathMatch: 'full' },
    { path: 'login', component: Login, canActivate: [loginGuard] },
    { path: 'calendar', component: Calendar, canActivate: [authGuard] },
    { path: 'entry/:date', component: JournalEntry, canActivate: [authGuard] },
    { path: 'search', component: Search, canActivate: [authGuard] },
    { path: 'summary', component: Summary, canActivate: [authGuard] },
    { path: '**', redirectTo: '/calendar' }
];
