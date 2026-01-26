import { Routes } from '@angular/router';
import { roleGuard } from '@app/core/guards/role-guard';

export const REPORTS_ROUTES: Routes = [
  {
    path: 'sales',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./sales/sales-report/sales-report').then((m) => m.SalesReport),
  },
  {
    path: 'products',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./products/products-report/products-report').then((m) => m.ProductsReport),
  },
  {
    path: 'employees',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () =>
      import('./employees/employees-report/employees-report').then((m) => m.EmployeesReport),
  },
  {
    path: 'invoices',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./invoices/invoices/invoices').then((m) => m.Invoices),
  },
  {
    path: 'inventory',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () =>
      import('./inventory/inventory-report/inventory-report').then((m) => m.InventoryReport),
  },
  {
    path: '',
    redirectTo: 'sales',
    pathMatch: 'full',
  },
];
