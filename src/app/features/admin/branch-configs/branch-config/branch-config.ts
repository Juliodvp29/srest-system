import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Branch } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { Branches } from '@app/core/services/branches';

@Component({
  selector: 'app-branch-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './branch-config.html',
  styleUrl: './branch-config.css',
})
export class BranchConfig implements OnInit {
  private branchesService = inject(Branches);
  private alertService = inject(AlertService);

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  branch = signal<Branch | null>(null);

  // Form Data
  name = signal<string>('');
  address = signal<string>('');
  phone = signal<string>('');

  async ngOnInit() {
    try {
      const data = await this.branchesService.getBranch();
      if (data) {
        this.branch.set(data);
        this.name.set(data.name);
        this.address.set(data.address || ''); // Handle optional fields if any
        this.phone.set(data.phone || '');
      }
    } catch (error) {
      console.error('Error loading branch:', error);
      this.alertService.error('Error', 'Error al cargar la información del restaurante.');
    } finally {
      this.loading.set(false);
    }
  }

  async saveConfig() {
    if (!this.branch()) return;

    this.saving.set(true);
    try {
      const updates: Partial<Branch> = {
        name: this.name(),
        address: this.address(),
        phone: this.phone(),
      };

      const updatedBranch = await this.branchesService.updateBranch(this.branch()!.id, updates);
      this.branch.set(updatedBranch);
      this.alertService.success('Éxito', 'Configuración actualizada correctamente.');
    } catch (error) {
      console.error('Error updating branch:', error);
      this.alertService.error('Error', 'Error al guardar la configuración.');
    } finally {
      this.saving.set(false);
    }
  }
}
