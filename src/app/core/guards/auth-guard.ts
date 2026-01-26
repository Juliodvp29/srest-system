import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '@app/core/services/supabase';

export const authGuard: CanActivateFn = (route, state) => {
  const supabaseService = inject(Supabase);
  const router = inject(Router);

  const user = supabaseService.currentUser();

  if (user) {
    return true;
  } else {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
  }
};
