import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Modal } from '@app/shared/components/modal/modal';
import { Employee } from '@services/employees';
import { EmployeesForm } from './employees-form/employees-form';
import { EmployeesList } from './employees-list/employees-list';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, EmployeesList, Modal, EmployeesForm],
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees {
  isModalOpen = signal(false);
  selectedEmployee = signal<Employee | null>(null);
  refreshTrigger = signal(0);

  openCreateModal() {
    this.selectedEmployee.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(employee: Employee) {
    this.selectedEmployee.set(employee);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onEmployeeSaved() {
    this.closeModal();
    this.refreshTrigger.update((v) => v + 1);
  }
}
