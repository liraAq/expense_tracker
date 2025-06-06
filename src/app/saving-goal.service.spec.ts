import { TestBed } from '@angular/core/testing';

import { SavingGoalService } from './saving-goal.service';

describe('SavingGoalService', () => {
  let service: SavingGoalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SavingGoalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
