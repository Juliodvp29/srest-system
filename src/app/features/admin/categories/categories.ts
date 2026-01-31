import { Component } from '@angular/core';
import { CategoriesList } from './categories-list/categories-list';

@Component({
  selector: 'app-categories',
  imports: [CategoriesList],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories {}
