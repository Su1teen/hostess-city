import type { Metadata, Viewport } from 'next';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../components/city-map.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hostess — рестораны, бары и ваш вечер в городе',
  description: 'Hostess показывает живую загрузку заведений, бронирует конкретный стол и ведёт весь вечер в одном приложении. Для заведений — Command Center: зал, брони, AI-хостес в WhatsApp и аналитика.',
  openGraph: {
    title: 'Hostess — город после восьми',
    description: 'Живая загрузка залов, бронь конкретного стола, консьерж и биржа напитков. Для заведений — Command Center.',
    type: 'website',
    locale: 'ru_RU',
  },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#070b11', colorScheme: 'dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
