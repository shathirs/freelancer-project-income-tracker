import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

export const routes: Routes = [
    { path: '', component: Login },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
];
