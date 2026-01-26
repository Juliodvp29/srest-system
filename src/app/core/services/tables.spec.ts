import { TestBed } from '@angular/core/testing';

import { Tables } from './tables';

describe('Tables', () => {
  let service: Tables;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tables);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
