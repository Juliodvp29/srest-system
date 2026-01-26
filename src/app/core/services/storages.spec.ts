import { TestBed } from '@angular/core/testing';

import { Storages } from './storages';

describe('Storages', () => {
  let service: Storages;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Storages);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
