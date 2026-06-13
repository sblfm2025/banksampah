import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('pwa-offline-ready'));
  },
});
