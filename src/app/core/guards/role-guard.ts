import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '@app/core/services/supabase';

export const roleGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(Supabase);
  const router = inject(Router);

  const user = supabaseService.currentUser();

  // 1. Check if user exists
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // 2. Get allowed roles defined in the route
  const allowedRoles = route.data['roles'] as string[];

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  try {
    // 3. Check profile on Supabase
    const { data, error } = await supabaseService.client
      .from('employees')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single();

    if (error || !data) throw error;

    // 4. Validate if the user is active
    if (!data.is_active) {
      return router.createUrlTree(['/unauthorized'], {
        queryParams: { reason: 'inactive' },
      });
    }

    // 5. Validate role hierarchy
    if (allowedRoles.includes(data.role)) {
      return true;
    } else {
      return router.createUrlTree(['/unauthorized'], {
        queryParams: { reason: 'insufficient-permissions' },
      });
    }
  } catch (error) {
    console.error('Error verificando rol:', error);
    return router.createUrlTree(['/login']);
  }
};
