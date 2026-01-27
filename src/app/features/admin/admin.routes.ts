import { Routes } from '@angular/router';
import { roleGuard } from '@app/core/guards/role-guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'products',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./products/products').then((m) => m.Products),
  },
  {
    path: 'categories',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./categories/categories/categories').then((m) => m.Categories),
  },
  {
    path: 'modifiers',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./modifiers/modifiers/modifiers').then((m) => m.Modifiers),
  },
  {
    path: 'employees',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./employees/employees/employees').then((m) => m.Employees),
  },
  {
    path: 'tables',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./tables/tables/tables').then((m) => m.Tables),
  },
  {
    path: 'branch-config',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () =>
      import('./branch-configs/branch-config/branch-config').then((m) => m.BranchConfig),
  },
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
];
