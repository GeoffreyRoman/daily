import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

@Injectable({ providedIn: 'root' })
export class BiometricService {
  readonly enabled = signal(localStorage.getItem('daily-biometric-enabled') === 'true');
  readonly locked = signal(false);

  async enable(): Promise<boolean> {
    try {
      const available = Capacitor.isNativePlatform()
        ? await NativeBiometric.isAvailable()
        : { isAvailable: !!window.PublicKeyCredential };
      if (!available.isAvailable) return false;
      await this.verify();
      this.enabled.set(true);
      localStorage.setItem('daily-biometric-enabled', 'true');
      return true;
    } catch {
      return false;
    }
  }

  disable(): void {
    this.enabled.set(false);
    this.locked.set(false);
    localStorage.removeItem('daily-biometric-enabled');
  }

  lock(): void {
    if (this.enabled()) this.locked.set(true);
  }

  async unlock(): Promise<boolean> {
    try {
      await this.verify();
      this.locked.set(false);
      return true;
    } catch {
      return false;
    }
  }

  private async verify(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await NativeBiometric.verifyIdentity({
        reason: 'Déverrouiller votre journal',
        title: 'Daily Journal',
        subtitle: 'Authentification requise'
      });
      return;
    }
    // Le navigateur sert uniquement de fallback de développement.
    if (!window.PublicKeyCredential) throw new Error('Biométrie indisponible');
  }
}
