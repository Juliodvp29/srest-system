import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitItemSelector } from './split-item-selector';

describe('SplitItemSelector', () => {
  let component: SplitItemSelector;
  let fixture: ComponentFixture<SplitItemSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitItemSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitItemSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
