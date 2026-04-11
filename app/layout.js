import "./globals.css";
import Link from 'next/link';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <nav className="flex justify-center gap-8 p-4 border-b border-zinc-900 bg-zinc-950/50 sticky top-0 z-[100] backdrop-blur-md">
          <Link href="/" className="text-xs font-black uppercase tracking-widest hover:text-blue-500 transition">Meta Trends</Link>
          <Link href="/analyzer" className="text-xs font-black uppercase tracking-widest hover:text-blue-500 transition">Deck Analyzer</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}