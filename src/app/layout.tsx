import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VT Eating - Virginia Tech Meal Delivery",
  description: "Request or fulfill meals from VT dining halls. Get food delivered or earn money.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased" suppressHydrationWarning>
        <noscript>
          <div style={{ padding: 20, textAlign: "center" }}>
            VT Eating – Please enable JavaScript to use this app.
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
