import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeCalculator } from './change-calculator';

describe('ChangeCalculator', () => {
  let component: ChangeCalculator;
  let fixture: ComponentFixture<ChangeCalculator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeCalculator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeCalculator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
