import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemChecklist } from './item-checklist';

describe('ItemChecklist', () => {
  let component: ItemChecklist;
  let fixture: ComponentFixture<ItemChecklist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemChecklist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemChecklist);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
