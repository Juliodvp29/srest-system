import { Component } from '@angular/core';
import { Loading } from '@app/core/services/loading';

@Component({
  selector: 'app-loader',
  imports: [],
  templateUrl: './loader.html',
  styleUrl: './loader.css',
})
export class Loader {
  constructor(public loadingService: Loading) {}
}
