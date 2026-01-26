import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductSelector } from './product-selector';

describe('ProductSelector', () => {
  let component: ProductSelector;
  let fixture: ComponentFixture<ProductSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
