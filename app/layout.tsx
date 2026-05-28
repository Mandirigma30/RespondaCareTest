import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RespondaCare | Barangay Emergency Response System",
    template: "%s | RespondaCare",
  },
  description:
    "RespondaCare is an offline-first, DPA-compliant healthcare emergency response platform for barangay communities. Connecting residents, first responders, and administrators for rapid emergency coordination.",
  keywords: [
    "RespondaCare",
    "emergency response",
    "barangay health",
    "first responder",
    "healthcare",
    "Philippines",
  ],
  openGraph: {
    title: "RespondaCare | Barangay Emergency Response System",
    description:
      "Connecting barangay communities with fast, coordinated emergency response.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-rc-dark-900 text-rc-text antialiased">
        {children}
      </body>
    </html>
  );
}
