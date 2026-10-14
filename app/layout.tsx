import type { Metadata } from 'next';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../components/city-map.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hostess — The city is yours.',
  description: 'A table worth finding. A night worth staying for. Discover a connected city of dining, drinks and rewards with Hostess.',
  metadataBase: new URL('https://hostess-city-oct14.welldog16.chatgpt.site'),
  openGraph: { title: 'Hostess — The city is yours.', description: 'One city. One Hostess. A new way to go out.' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
