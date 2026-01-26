import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchConfig } from './branch-config';

describe('BranchConfig', () => {
  let component: BranchConfig;
  let fixture: ComponentFixture<BranchConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchConfig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BranchConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
