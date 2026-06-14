import { AppIcon } from './components';

export function FloatingWhatsApp() {
  const phone = import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER as
    | string
    | undefined;
  if (!phone) return null;
  const message =
    (import.meta.env.VITE_PUBLIC_WHATSAPP_MESSAGE as string | undefined) ??
    'Halo Peduli Pinrang, saya ingin bertanya tentang layanan jemput sampah.';
  const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

  return (
    <a
      aria-label="Chat WhatsApp Operator Peduli Pinrang"
      className="fixed bottom-5 right-4 z-20 flex min-h-12 items-center gap-2 rounded-full bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgb(22_101_52/0.28)] transition hover:-translate-y-0.5 sm:bottom-6 sm:right-6"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      <AppIcon name="phone" />
      <span className="hidden sm:inline">Chat Operator</span>
    </a>
  );
}
