import { Routes } from '@angular/router';
import { roleGuard } from '@app/core/guards/role-guard';

export const INVOICES_ROUTES: Routes = [
  {
    path: 'list',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'cashier'] },
    loadComponent: () =>
      import('./invoices-list/invoices-list/invoices-list').then((m) => m.InvoicesList),
  },

  {
    path: 'detail/:invoiceId',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'cashier'] },
    loadComponent: () =>
      import('./invoice-detail/invoice-detail/invoice-detail').then((m) => m.InvoiceDetail),
  },
  {
    path: 'print/:invoiceId',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'cashier'] },
    loadComponent: () =>
      import('./print-invoice/print-invoice/print-invoice').then((m) => m.PrintInvoice),
  },
  {
    path: 'ticket/:id',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager', 'cashier'] },
    loadComponent: () =>
      import('./ticket-invoice/ticket-invoice').then((m) => m.TicketInvoice),
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
];
