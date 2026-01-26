import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCard } from './table-card';

describe('TableCard', () => {
  let component: TableCard;
  let fixture: ComponentFixture<TableCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
