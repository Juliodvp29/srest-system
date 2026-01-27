import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '@app/core/services/supabase';

export const guestGuard: CanActivateFn = async () => {
  const supabaseService = inject(Supabase);
  const router = inject(Router);

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('GuestGuard Timeout')), 5000),
  );

  try {
    await Promise.race([supabaseService.initialized, timeout]);
  } catch (e) {
    console.warn('GuestGuard initialization timed out, proceeding.');
  }

  const user = supabaseService.currentUser();

  if (user) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
