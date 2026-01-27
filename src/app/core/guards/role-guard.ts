import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '@app/core/services/supabase';

export const roleGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(Supabase);
  const router = inject(Router);

  await supabaseService.initialized;

  const {
    data: { user },
  } = await supabaseService.client.auth.getUser();

  if (!user) {
    return router.createUrlTree(['/auth/login']);
  }

  // 1. Get allowed roles defined in the route
  const allowedRoles = route.data['roles'] as string[];

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  try {
    // 2. Efficiently get role from signal or DB
    let currentRole = supabaseService.userRole();
    let isActive = true;

    if (!currentRole) {
      const { data, error } = await supabaseService.client
        .from('employees')
        .select('role, is_active')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return router.createUrlTree(['/unauthorized'], {
          queryParams: { reason: 'profile-error' },
        });
      }
      currentRole = data.role;
      isActive = data.is_active;
    } else {
      // If we have the role in signal, we verify activity status once
      // (For now assuming active if signal exists, or we could fetch full state)
      // To be safe, if it's a critical guard, we fetch fresh state:
      const { data } = await supabaseService.client
        .from('employees')
        .select('is_active')
        .eq('user_id', user.id)
        .single();
      isActive = data?.is_active ?? false;
    }

    if (!isActive) {
      return router.createUrlTree(['/unauthorized'], { queryParams: { reason: 'inactive' } });
    }

    if (allowedRoles.includes(currentRole!)) {
      return true;
    }

    return router.createUrlTree(['/unauthorized'], {
      queryParams: { reason: 'insufficient-permissions' },
    });
  } catch (error) {
    console.error('RoleGuard error:', error);
    return router.createUrlTree(['/auth/login']);
  }
};
