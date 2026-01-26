import { Routes } from '@angular/router';
import { roleGuard } from '@app/core/guards/role-guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'home',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'waiter', 'chef', 'cashier'] },
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
