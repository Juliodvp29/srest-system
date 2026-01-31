import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation-modal',
  imports: [CommonModule],
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.css',
})
export class ConfirmationModal {
  isOpen = input<boolean>(false);
  title = input<string>('¿Estás seguro?');
  message = input<string>('Esta acción no se puede deshacer.');
  confirmLabel = input<string>('Confirmar');
  cancelLabel = input<string>('Cancelar');
  type = input<'danger' | 'warning' | 'info'>('danger');

  onConfirm = output<void>();
  onCancel = output<void>();

  handleConfirm() {
    this.onConfirm.emit();
  }

  handleCancel() {
    this.onCancel.emit();
  }
}
