import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierSelector } from './supplier-selector';

describe('SupplierSelector', () => {
  let component: SupplierSelector;
  let fixture: ComponentFixture<SupplierSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
