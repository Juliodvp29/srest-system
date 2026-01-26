import { Component } from '@angular/core';
import { Loading } from '@app/services/loading';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [],
  templateUrl: './loader.html',
  styleUrl: './loader.css',
})
export class Loader {
  constructor(public loadingService: Loading) {}
}
