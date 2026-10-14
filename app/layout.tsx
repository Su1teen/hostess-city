import type { Metadata } from 'next';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../components/city-map.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hostess — ваш вечер в городе',
  description: 'Выбирайте рестораны и бары, бронируйте столики, оформляйте предзаказы и используйте бонусы в сети заведений Hostess.',
  metadataBase: new URL('https://hostess-city-oct14.welldog16.chatgpt.site'),
  openGraph: { title: 'Hostess — ваш вечер в городе', description: 'Рестораны, бронирования, предзаказы и общие бонусы — в одном сервисе.' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
