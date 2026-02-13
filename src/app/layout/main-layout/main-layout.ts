import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Supabase } from '@app/core/services/supabase';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  private supabase = inject(Supabase);
  private router = inject(Router);

  isMobileMenuOpen = signal(false);
  isInventoryOpen = signal(false);
  isPosOpen = signal(false);
  isReportsOpen = signal(false);
  isInvoicesOpen = signal(false);
  isConfigOpen = signal(false);
  currentUser = this.supabase.currentUser;
  userRole = this.supabase.userRole;
  userProfile = this.supabase.userProfile;

  hasRole(allowedRoles: string[]): boolean {
    const role = this.userRole();
    return role ? allowedRoles.includes(role) : false;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((v) => !v);
  }

  async logout() {
    try {
      await this.supabase.signOut();
      this.router.navigate(['/auth/login']);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }
}
