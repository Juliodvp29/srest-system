import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '@app/core/services/supabase';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(Supabase);
  const router = inject(Router);

  // Safety timeout: if init takes > 5s, something is wrong
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AuthGuard Timeout')), 5000),
  );

  try {
    await Promise.race([supabaseService.initialized, timeout]);
  } catch (e) {
    console.warn('AuthGuard initialization timed out, proceeding anyway.');
  }

  const {
    data: { user },
  } = await supabaseService.client.auth.getUser();

  if (user) {
    return true;
  } else {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
  }
};
