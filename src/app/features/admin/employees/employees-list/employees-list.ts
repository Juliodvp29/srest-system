import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AlertService } from '@app/core/services/alert';
import { Supabase } from '@app/core/services/supabase';
import { ConfirmationModal } from '@app/shared/components/confirmation-modal/confirmation-modal';
import {
  ActionButton,
  ColumnConfig,
  DynamicTable,
  FilterConfig,
} from '@app/shared/components/dynamic-table/dynamic-table';
import { Employee, Employees as EmployeesService } from '@services/employees';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-employees-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamicTable, ConfirmationModal],
  templateUrl: './employees-list.html',
  styleUrl: './employees-list.css',
})
export class EmployeesList {
  private employeesService = inject(EmployeesService);
  private supabase = inject(Supabase);
  private alertService = inject(AlertService);

  // Modal State
  isDeleteModalOpen = signal(false);
  employeeToDelete = signal<Employee | null>(null);

  refreshTrigger = input<number>(0);
  onAdd = output<void>();
  onEdit = output<Employee>();
  onDeleted = output<void>();

  // Reactive branch ID from logged in user profile
  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  private employeesRaw = toSignal(
    toObservable(this.refreshTrigger).pipe(
      switchMap(() => {
        const bid = this.branchId();
        if (!bid) return [];
        return this.employeesService.getAllEmployees(bid);
      }),
    ),
    { initialValue: [] },
  );

  employees = computed(() => this.employeesRaw());

  columns: ColumnConfig[] = [
    { key: 'full_name', label: 'Nombre Completo', sortable: true },
    { key: 'role', label: 'Cargo', type: 'badge', sortable: true },
    { key: 'phone', label: 'Teléfono', type: 'text' },
    { key: 'created_at', label: 'Creacion', type: 'date' },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'badge',
      badgeColors: {
        true: 'badge-active',
        false: 'badge-inactive',
      },
    },
  ];

  actions: ActionButton[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: (e: Employee) => this.onEdit.emit(e),
      class:
        'size-9 flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-background-dark text-slate-500 transition-all rounded-lg',
    },
    {
      label: 'Eliminar',
      icon: 'delete',
      onClick: (e: Employee) => this.openDeleteModal(e),
      class:
        'size-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all rounded-lg',
    },
  ];

  filters: FilterConfig[] = [
    {
      key: 'role',
      label: 'Cargo',
      type: 'select',
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Gerente', value: 'manager' },
        { label: 'Mesero', value: 'waiter' },
        { label: 'Cocinero', value: 'chef' },
        { label: 'Cajero', value: 'cashier' },
      ],
    },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false },
      ],
    },
  ];

  openDeleteModal(employee: Employee) {
    this.employeeToDelete.set(employee);
    this.isDeleteModalOpen.set(true);
  }

  async confirmDelete() {
    const employee = this.employeeToDelete();
    if (!employee) return;

    try {
      await this.employeesService.deleteEmployee(employee.id);
      this.alertService.success(
        'Empleado eliminado',
        `El empleado "${employee.full_name}" ha sido eliminado.`,
      );
      this.onDeleted.emit();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      this.alertService.error('Error', err.message || 'No se pudo eliminar el empleado.');
    } finally {
      this.isDeleteModalOpen.set(false);
      this.employeeToDelete.set(null);
    }
  }
}
