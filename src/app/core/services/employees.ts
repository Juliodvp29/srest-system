import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';

export interface Employee {
  id: string;
  user_id?: string;
  branch_id: string;
  role: 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier';
  full_name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class Employees {
  private supabase = inject(Supabase);
  constructor() {}

  // Get all employees
  async getAllEmployees(branchId: string): Promise<Employee[]> {
    const { data, error } = await this.supabase.client
      .from('employees')
      .select('*')
      .eq('branch_id', branchId)
      .order('full_name');
    if (error) throw error;
    return data as Employee[];
  }

  // Get active employees
  // Obtener empleados activos
  async getActiveEmployees(branchId: string): Promise<Employee[]> {
    const { data, error } = await this.supabase.client
      .from('employees')
      .select('*')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('full_name');
    if (error) throw error;
    return data as Employee[];
  }

  // Get employees by role
  async getEmployeesByRole(branchId: string, role: Employee['role']): Promise<Employee[]> {
    const { data, error } = await this.supabase.client
      .from('employees')
      .select('*')
      .eq('branch_id', branchId)
      .eq('role', role)
      .eq('is_active', true)
      .order('full_name');
    if (error) throw error;
    return data as Employee[];
  }

  // Get employee by ID
  async getEmployeeById(id: string): Promise<Employee> {
    const { data, error } = await this.supabase.client
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Employee;
  }

  // Create employee
  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    const { data, error } = await this.supabase.client
      .from('employees')
      .insert(employee)
      .select()
      .single();
    if (error) throw error;
    return data as Employee;
  }

  // Update employee
  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const { data, error } = await this.supabase.client
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Employee;
  }

  // Deactivate employee
  async deactivateEmployee(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('employees')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  }

  // Activate employee
  async activateEmployee(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('employees')
      .update({ is_active: true })
      .eq('id', id);
    if (error) throw error;
  }

  // Delete employee
  async deleteEmployee(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('employees').delete().eq('id', id);
    if (error) throw error;
  }
}
