import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '@app/core/services/supabase';

export const roleGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(Supabase);
  const router = inject(Router);

  const user = supabaseService.currentUser();

  // 1. Check if user exists
  if (!user) {
    return router.createUrlTree(['/auth/login']);
  }

  // 2. Get allowed roles defined in the route
  const allowedRoles = route.data['roles'] as string[];

  console.log('Allowed roles:', allowedRoles);

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

    if (error) {
      if (error.code === 'PGRST116') {
        console.error('Error: No se encontró el registro del empleado.');
      } else {
        console.error('Error verificando rol:', error);
      }
      return router.createUrlTree(['/unauthorized'], {
        queryParams: { reason: 'profile-not-found' },
      });
    }

    if (!data) {
      return router.createUrlTree(['/unauthorized'], { queryParams: { reason: 'no-data' } });
    }

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
      console.warn(`Acceso denegado. Rol actual: ${data.role}. Roles permitidos: ${allowedRoles}`);
      return router.createUrlTree(['/unauthorized'], {
        queryParams: { reason: 'insufficient-permissions' },
      });
    }
  } catch (error) {
    console.error('Error crítico en RoleGuard:', error);
    return router.createUrlTree(['/auth/login']);
  }
};
