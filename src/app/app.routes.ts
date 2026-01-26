import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'customer',
    loadChildren: () => import('./pages/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./pages/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'pos',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager', 'waiter', 'cashier'] },
    loadChildren: () => import('./pages/pos/pos.routes').then((m) => m.POS_ROUTES),
  },
  {
    path: 'kitchen',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager', 'chef'] },
    loadChildren: () => import('./pages/kitchen/kitchen.routes').then((m) => m.KITCHEN_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadChildren: () => import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  {
    path: 'inventory',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadChildren: () =>
      import('./pages/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
  },

  {
    path: 'reports',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadChildren: () => import('./pages/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
  },

  {
    path: 'invoices',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager', 'cashier'] },
    loadChildren: () => import('./pages/invoices/invoices.routes').then((m) => m.INVOICES_ROUTES),
  },

  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./pages/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },

  // Redirección por defecto
  {
    path: '',
    redirectTo: '/customer/menu/1',
    pathMatch: 'full',
  },

  // Ruta 404
  {
    path: '**',
    redirectTo: '/customer/menu/1',
  },
];
