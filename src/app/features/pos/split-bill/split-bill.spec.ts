import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitBill } from './split-bill';

describe('SplitBill', () => {
  let component: SplitBill;
  let fixture: ComponentFixture<SplitBill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitBill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitBill);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
