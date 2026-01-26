import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductImageUpload } from './product-image-upload';

describe('ProductImageUpload', () => {
  let component: ProductImageUpload;
  let fixture: ComponentFixture<ProductImageUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductImageUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductImageUpload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
