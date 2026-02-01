import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  isConfirm?: boolean;
  resolve?: (value: boolean) => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private _alerts = signal<Alert[]>([]);
  public alerts = this._alerts.asReadonly();

  /**
   * Show a success alert
   */
  success(title: string, message: string, duration = 5000) {
    this.addAlert('success', title, message, duration);
  }

  /**
   * Show an error alert
   */
  error(title: string, message: string, duration = 8000) {
    this.addAlert('error', title, message, duration);
  }

  /**
   * Show an info alert
   */
  info(title: string, message: string, duration = 5000) {
    this.addAlert('info', title, message, duration);
  }

  /**
   * Show a warning alert
   */
  warning(title: string, message: string, duration = 6000) {
    this.addAlert('warning', title, message, duration);
  }

  /**
   * Show a confirmation dialog
   */
  confirm(
    title: string,
    message: string,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const id = this.generateId();
      const alert: Alert = {
        id,
        type: 'warning',
        title,
        message,
        autoClose: false,
        isConfirm: true,
        resolve,
        confirmLabel,
        cancelLabel,
      };

      this._alerts.update((prev) => [...prev, alert]);
    });
  }

  private addAlert(type: AlertType, title: string, message: string, duration: number) {
    const id = this.generateId();
    const alert: Alert = { id, type, title, message, autoClose: true, duration };

    this._alerts.update((prev) => [...prev, alert]);

    if (alert.autoClose) {
      setTimeout(() => {
        this.removeAlert(id);
      }, duration);
    }
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for insecure contexts (HTTP/IP access)
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  public removeAlert(id: string) {
    this._alerts.update((prev) => prev.filter((a) => a.id !== id));
  }
}
