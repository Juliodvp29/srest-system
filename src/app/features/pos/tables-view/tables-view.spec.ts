import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablesView } from './tables-view';

describe('TablesView', () => {
  let component: TablesView;
  let fixture: ComponentFixture<TablesView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablesView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablesView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
