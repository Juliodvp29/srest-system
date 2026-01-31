import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertService } from './core/services/alert';
import { AlertComponent } from './shared/components/alert/alert';
import { Loader } from './shared/components/loader/loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loader, AlertComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  public alertService = inject(AlertService);
  protected readonly title = signal('srest-system');
}
