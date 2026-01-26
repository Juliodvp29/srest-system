import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { AuthLayout } from './layout/auth-layout/auth-layout';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'customer',
    loadChildren: () =>
      import('./features/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'pos',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager', 'waiter', 'cashier'] },
    loadChildren: () => import('./features/pos/pos.routes').then((m) => m.POS_ROUTES),
  },
  {
    path: 'kitchen',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager', 'chef'] },
    loadChildren: () => import('./features/kitchen/kitchen.routes').then((m) => m.KITCHEN_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  {
    path: 'inventory',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadChildren: () =>
      import('./features/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
  },

  {
    path: 'reports',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadChildren: () => import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
  },

  {
    path: 'invoices',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager', 'cashier'] },
    loadChildren: () =>
      import('./features/invoices/invoices.routes').then((m) => m.INVOICES_ROUTES),
  },

  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
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
