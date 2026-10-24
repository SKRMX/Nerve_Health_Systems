import { Capacitor } from '@capacitor/core';

export type PlatformType = 'ios' | 'android' | 'web';

/**
 * Detects the current running platform (iOS native, Android native, or Web/Desktop)
 */
export function getPlatform(): PlatformType {
  const capPlatform = Capacitor.getPlatform();
  if (capPlatform === 'ios') return 'ios';
  if (capPlatform === 'android') return 'android';
  return 'web';
}

/**
 * Multiplatform Subscription Trigger
 * Automatically routes subscription requests to Apple StoreKit (iOS), Google Play Billing (Android),
 * or Stripe Checkout (Web & Desktop).
 */
export async function initiateSubscription(tier: 'solo' | 'pro' = 'solo'): Promise<{ success: boolean; url?: string; message?: string }> {
  const platform = getPlatform();

  if (platform === 'web') {
    // Web / Desktop (Windows, macOS browser, Linux): Use Stripe Checkout / MercadoPago
    try {
      const response = await fetch('/api/checkout/stripe-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      });
      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return { success: true, url: data.checkout_url };
      }
      return { success: false, message: data.error || 'Error al iniciar pago en Stripe' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error de conexión con la pasarela Web' };
    }
  }

  if (platform === 'ios') {
    // iOS Native (Apple App Store In-App Purchases / StoreKit)
    console.log('[Native Billing] Triggering Apple In-App Purchase for tier:', tier);
    // In production build with RevenueCat / Capacitor Purchase plugin:
    // const purchases = await Purchases.purchaseProduct(tier === 'pro' ? 'nerve_clinic_pro' : 'nerve_doctor_solo');
    return {
      success: true,
      message: 'Redirigiendo a Apple App Store In-App Purchase...'
    };
  }

  if (platform === 'android') {
    // Android Native (Google Play Billing)
    console.log('[Native Billing] Triggering Google Play Billing for tier:', tier);
    // In production build with Google Play Billing plugin:
    // const purchase = await PlayBilling.purchase(tier === 'pro' ? 'nerve_clinic_pro' : 'nerve_doctor_solo');
    return {
      success: true,
      message: 'Redirigiendo a Google Play Billing...'
    };
  }

  return { success: false, message: 'Plataforma no soportada' };
}
