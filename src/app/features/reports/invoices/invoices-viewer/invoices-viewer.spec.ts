import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesViewer } from './invoices-viewer';

describe('InvoicesViewer', () => {
  let component: InvoicesViewer;
  let fixture: ComponentFixture<InvoicesViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesViewer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicesViewer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
