import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GitHub Profile Explorer",
  description: "Built by Iten Ahmed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {/* Simple Navigation Bar */}
        <header className="bg-white shadow mb-6">
          <nav className="max-w-4xl mx-auto flex justify-between items-center p-4">
            <h1 className="font-bold text-lg">GitHub Explorer</h1>
            <div className="flex gap-4">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/compare" className="hover:underline">
                Compare
              </Link>
            </div>
          </nav>
        </header>

        {/* Page Content */}
        <main className="max-w-4xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
