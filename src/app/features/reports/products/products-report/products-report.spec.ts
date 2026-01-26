import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsReport } from './products-report';

describe('ProductsReport', () => {
  let component: ProductsReport;
  let fixture: ComponentFixture<ProductsReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
