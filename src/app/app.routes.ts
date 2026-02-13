import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { roleGuard } from './core/guards/role-guard';
import { AuthLayout } from './layout/auth-layout/auth-layout';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayout,
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'customer',
    loadChildren: () =>
      import('./features/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
  },

  // Authenticated Routes wrapped in MainLayout
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'pos',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager', 'waiter', 'cashier'] },
        loadChildren: () => import('./features/pos/pos.routes').then((m) => m.POS_ROUTES),
      },
      {
        path: 'kitchen',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager', 'chef'] },
        loadChildren: () =>
          import('./features/kitchen/kitchen.routes').then((m) => m.KITCHEN_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager'] },
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'inventory',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager'] },
        loadChildren: () =>
          import('./features/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager'] },
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      {
        path: 'reservations',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager', 'waiter', 'host'] }, // Added host logic if needed, or stick to existing roles
        loadChildren: () =>
          import('./features/reservations/reservations.routes').then((m) => m.RESERVATIONS_ROUTES),
      },
      {
        path: 'invoices',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager', 'cashier'] },
        loadChildren: () =>
          import('./features/invoices/invoices.routes').then((m) => m.INVOICES_ROUTES),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },
];
