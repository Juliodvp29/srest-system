import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateRangeSelector } from './date-range-selector';

describe('DateRangeSelector', () => {
  let component: DateRangeSelector;
  let fixture: ComponentFixture<DateRangeSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRangeSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateRangeSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
