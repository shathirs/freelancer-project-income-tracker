import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { AuthService, AuthUser, NotificationSettings } from '../../core/auth.service';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';

type SettingsSection = 'account' | 'security' | 'notifications' | 'preferences' | 'billing';

@Component({
  selector: 'app-settings',
  imports: [Sidebar, Navbar],
  templateUrl: './settings.html',
})
export class Settings {
  private readonly auth = inject(AuthService);

  readonly section = signal<SettingsSection>('account');
  readonly editing = signal(false);
  readonly languages = ['English', 'Spanish', 'French', 'German'];

  readonly name = signal('');
  readonly email = signal('');
  readonly phone = signal('');
  readonly profileMessage = signal('');
  readonly profileError = signal(false);

  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);
  readonly passwordMessage = signal('');
  readonly passwordError = signal(false);

  readonly notifications = signal<NotificationSettings>({
    projectUpdates: true,
    paymentReceived: true,
    clientMessages: true,
    marketing: false,
  });
  readonly theme = signal<AuthUser['theme']>('light');
  readonly language = signal('English');
  readonly preferencesMessage = signal('');
  readonly preferencesError = signal(false);

  constructor() {
    this.auth.loadCurrentUser();
    effect(() => {
      const user = this.auth.user();
      if (!user || this.editing()) {
        return;
      }
      this.name.set(user.name);
      this.email.set(user.email);
      this.phone.set(user.phone);
      this.notifications.set({ ...user.notifications });
      this.theme.set(user.theme);
      this.language.set(user.language);
    });
  }

  selectSection(section: SettingsSection): void {
    this.section.set(section);
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  startEdit(): void {
    this.profileMessage.set('');
    this.editing.set(true);
  }

  cancelEdit(): void {
    const user = this.auth.user();
    if (user) {
      this.name.set(user.name);
      this.email.set(user.email);
      this.phone.set(user.phone);
    }
    this.profileMessage.set('');
    this.editing.set(false);
  }

  saveProfile(): void {
    this.profileMessage.set('');
    this.profileError.set(false);
    if (!this.name().trim() || !this.email().trim()) {
      this.profileError.set(true);
      this.profileMessage.set('Name and email are required');
      return;
    }

    this.auth.updateProfile(this.name().trim(), this.email().trim(), this.phone().trim()).subscribe({
      next: () => {
        this.editing.set(false);
        this.profileError.set(false);
        this.profileMessage.set('Profile updated');
      },
      error: (error: HttpErrorResponse) => {
        this.profileError.set(true);
        this.profileMessage.set(error.error?.message ?? 'Could not update profile');
      },
    });
  }

  savePassword(): void {
    this.passwordMessage.set('');
    this.passwordError.set(false);
    if (!this.currentPassword() || !this.newPassword() || !this.confirmPassword()) {
      this.passwordError.set(true);
      this.passwordMessage.set('Fill in all password fields');
      return;
    }
    if (this.newPassword().length < 6) {
      this.passwordError.set(true);
      this.passwordMessage.set('Password must be at least 6 characters');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set(true);
      this.passwordMessage.set('New passwords do not match');
      return;
    }

    this.auth.changePassword(this.currentPassword(), this.newPassword()).subscribe({
      next: () => {
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.passwordError.set(false);
        this.passwordMessage.set('Password updated');
      },
      error: (error: HttpErrorResponse) => {
        this.passwordError.set(true);
        this.passwordMessage.set(error.error?.message ?? 'Could not update password');
      },
    });
  }

  toggleNotification(key: keyof NotificationSettings): void {
    this.notifications.update((current) => ({ ...current, [key]: !current[key] }));
    this.preferencesMessage.set('');
  }

  setTheme(theme: AuthUser['theme']): void {
    this.theme.set(theme);
    this.auth.applyTheme(theme);
    this.preferencesMessage.set('');
  }

  setLanguage(language: string): void {
    this.language.set(language);
    this.preferencesMessage.set('');
  }

  savePreferences(): void {
    this.preferencesMessage.set('');
    this.preferencesError.set(false);
    this.auth.updatePreferences(this.notifications(), this.theme(), this.language()).subscribe({
      next: () => {
        this.preferencesError.set(false);
        this.preferencesMessage.set('Settings saved');
      },
      error: (error: HttpErrorResponse) => {
        this.preferencesError.set(true);
        this.preferencesMessage.set(error.error?.message ?? 'Could not save settings');
      },
    });
  }
}