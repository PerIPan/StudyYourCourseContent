import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CLA Knowledgebase',
  description: 'Cybersecurity Leadership Academy — Study Companion',
};

/**
 * Inline script that runs before React hydration to apply the stored theme
 * immediately, preventing a flash of the default (light) theme.
 */
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('cla-theme');
    var valid = ['light','dark','surprise'];
    if (valid.indexOf(stored) !== -1) {
      document.documentElement.setAttribute('data-theme', stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch(e) {}
})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Anti-flash: set data-theme before paint */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
