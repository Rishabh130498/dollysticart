import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import Script from 'next/script';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CountryProvider } from '@/context/CountryContext';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Dollysticart | Premium Textured Art & Canvas Paintings',
    template: '%s | Dollysticart'
  },
  description: 'Shop hand-painted textured acrylic canvas paintings, prints, stationery, calendars, and request bespoke customizations at Dollysticart.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Dollysticart | Premium Textured Art & Canvas Paintings',
    description: 'Shop hand-painted textured acrylic canvas paintings, prints, stationery, calendars, and request bespoke customizations at Dollysticart.',
    url: '/',
    siteName: 'Dollysticart',
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <CountryProvider>
          <Header />
          <main className="flex-1 w-full">{children}</main>
          <Footer />

          {/* Hidden Google Translate Container & Script Initialization */}
          <div id="google_translate_element" className="hidden" />
          <Script
            id="google-translate-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                function googleTranslateElementInit() {
                  new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    autoDisplay: false
                  }, 'google_translate_element');
                }
              `,
            }}
          />
          <Script
            src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            strategy="afterInteractive"
          />
        </CountryProvider>
      </body>
    </html>
  );
}
