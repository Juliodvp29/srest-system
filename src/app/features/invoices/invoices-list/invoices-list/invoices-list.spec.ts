import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesList } from './invoices-list';

describe('InvoicesList', () => {
  let component: InvoicesList;
  let fixture: ComponentFixture<InvoicesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
