import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Clients } from './pages/clients/clients';
import { Dashboard } from './pages/dashboard/dashboard';
import { Income } from './pages/income/income';
import { Notifications } from './pages/notifications/notifications';
import { Login } from './pages/login/login';
import { Projects } from './pages/projects/projects';
import { Register } from './pages/register/register';
import { Reports } from './pages/reports/reports';
import { Settings } from './pages/settings/settings';

export const routes: Routes = [
    { path: '', component: Login },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: 'clients', component: Clients, canActivate: [authGuard] },
    { path: 'projects', component: Projects, canActivate: [authGuard] },
    { path: 'income', component: Income, canActivate: [authGuard] },
    { path: 'reports', component: Reports, canActivate: [authGuard] },
    { path: 'notifications', component: Notifications, canActivate: [authGuard] },
    { path: 'settings', component: Settings, canActivate: [authGuard] },
];
