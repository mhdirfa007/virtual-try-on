import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Virtual Try-On | AI-Powered Tailored Clothing Experience',
  description: 'Experience perfect fit before you commit. Our virtual try-on technology allows you to see exactly how custom tailored garments will look and fit.',
  keywords: 'virtual try-on, tailored clothing, AI fashion, custom garments, online fitting',
  authors: [{ name: 'Virtual Try-On Team' }],
  creator: 'Virtual Try-On',
  publisher: 'Virtual Try-On',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://virtual-try-on.com'),
  openGraph: {
    title: 'Virtual Try-On | AI-Powered Tailored Clothing',
    description: 'Experience perfect fit before you commit with our AI-powered virtual try-on technology.',
    url: 'https://virtual-try-on.com',
    siteName: 'Virtual Try-On',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Virtual Try-On Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virtual Try-On | AI-Powered Tailored Clothing',
    description: 'Experience perfect fit before you commit with our AI-powered virtual try-on technology.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1c1917',
              border: '1px solid #e7e5e4',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#0ea5e9',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}