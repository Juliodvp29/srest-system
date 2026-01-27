import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
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

  private addAlert(type: AlertType, title: string, message: string, duration: number) {
    const id = crypto.randomUUID();
    const alert: Alert = { id, type, title, message, autoClose: true, duration };

    this._alerts.update((prev) => [...prev, alert]);

    if (alert.autoClose) {
      setTimeout(() => {
        this.removeAlert(id);
      }, duration);
    }
  }

  public removeAlert(id: string) {
    this._alerts.update((prev) => prev.filter((a) => a.id !== id));
  }
}
