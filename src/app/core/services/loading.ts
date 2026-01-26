import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Loading {
  private _loading = signal<boolean>(false);

  public isLoading = this._loading.asReadonly();

  private requestCount = 0;

  show(): void {
    this.requestCount++;
    this._loading.set(true);
  }

  hide(): void {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this._loading.set(false);
    }
  }
}