import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentMethodSelector } from './payment-method-selector';

describe('PaymentMethodSelector', () => {
  let component: PaymentMethodSelector;
  let fixture: ComponentFixture<PaymentMethodSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentMethodSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentMethodSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
