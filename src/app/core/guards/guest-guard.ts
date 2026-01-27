import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '@app/core/services/supabase';

export const guestGuard: CanActivateFn = async () => {
  const supabaseService = inject(Supabase);
  const router = inject(Router);

  await supabaseService.initialized;
  const user = supabaseService.currentUser();

  if (user) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
