// Service de notifications push web
export class PushNotificationService {
  private vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // À configurer dans les secrets
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  async initialize() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered for push notifications');
      return true;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      await this.initialize();
    }

    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as any
      });

      console.log('✅ Push subscription created');
      return subscription;
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Push subscription removed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Unsubscribe failed:', error);
      return false;
    }
  }

  async sendTestNotification(title: string, body: string) {
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Push notification permission denied');
      return false;
    }

    if (!this.serviceWorkerRegistration) {
      await this.initialize();
    }

    if (!this.serviceWorkerRegistration) {
      return false;
    }

    // Envoyer une notification locale pour test
    await this.serviceWorkerRegistration.showNotification(title, {
      body,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: 'test-notification',
      requireInteraction: false,
    });

    return true;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationService = new PushNotificationService();
