import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Alert, AlertService } from '@app/core/services/alert';

@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class AlertComponent {
  private alertService = inject(AlertService);

  alert = input.required<Alert>();

  close() {
    this.alertService.removeAlert(this.alert().id);
    if (this.alert().isConfirm && this.alert().resolve) {
      this.alert().resolve!(false);
    }
  }

  onConfirm() {
    if (this.alert().resolve) {
      this.alert().resolve!(true);
    }
    this.alertService.removeAlert(this.alert().id);
  }

  onCancel() {
    if (this.alert().resolve) {
      this.alert().resolve!(false);
    }
    this.alertService.removeAlert(this.alert().id);
  }

  getIcon(): string {
    switch (this.alert().type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'cancel';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'notifications';
    }
  }
}
