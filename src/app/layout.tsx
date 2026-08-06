import type { Metadata, Viewport } from 'next';
import { Archivo, Inter, Roboto } from 'next/font/google';
import { NightRoad } from '@/components/backgrounds/night-road';
import './globals.css';

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Fuente del documento de factura (calca el PDF de ECOM, que usa Roboto).
const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Camel OS',
  description:
    'Centro de control de Camel Export Cars — facturación, base de datos y búsqueda de vehículos.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#050608',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        suppressHydrationWarning
        className={`${archivo.variable} ${inter.variable} ${roboto.variable} font-sans antialiased`}
      >
        {/* Aplica el tema guardado antes del primer paint (evita el flash claro→oscuro). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('tema')==='light')document.body.classList.add('light')}catch(e){}",
          }}
        />
        <NightRoad />
        {children}
      </body>
    </html>
  );
}
