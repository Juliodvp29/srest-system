import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablesForm } from './tables-form';

describe('TablesForm', () => {
  let component: TablesForm;
  let fixture: ComponentFixture<TablesForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablesForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablesForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
