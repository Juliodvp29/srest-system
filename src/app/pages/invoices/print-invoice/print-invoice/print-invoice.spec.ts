import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintInvoice } from './print-invoice';

describe('PrintInvoice', () => {
  let component: PrintInvoice;
  let fixture: ComponentFixture<PrintInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintInvoice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
