import { Component, OnInit } from '@angular/core';
import { ProductList } from './product-list/product-list';

@Component({
  selector: 'app-products',
  imports: [ProductList],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {

  constructor() { }

  ngOnInit(): void {
    console.log('Products ngOnInit');
  }

}
