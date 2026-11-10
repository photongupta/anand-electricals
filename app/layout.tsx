import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, Noto_Sans_Devanagari } from "next/font/google";
import Image from "next/image";
import { IntlProvider } from "@/components/layout/IntlProvider";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { Nav } from "@/components/layout/Nav";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
});

export const metadata: Metadata = {
  title: "Anand Electricals",
  description: "Inventory, customer ledger, and price lookup for Anand Electricals",
};

const DARK_MODE_SCRIPT = `
(function () {
  var mql = window.matchMedia("(prefers-color-scheme: dark)");
  function applyDarkMode(matches) {
    document.documentElement.classList.toggle("dark", matches);
  }
  applyDarkMode(mql.matches);
  mql.addEventListener("change", function (e) { applyDarkMode(e.matches); });
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${notoSansDevanagari.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: DARK_MODE_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <IntlProvider>
          <header className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Image src="/logo.svg" alt="" width={32} height={32} />
            <span className="font-heading text-lg font-semibold">
              Anand Electricals
            </span>
          </header>
          <Nav />
          <main className="flex-1">{children}</main>
        </IntlProvider>
      </body>
    </html>
  );
}
