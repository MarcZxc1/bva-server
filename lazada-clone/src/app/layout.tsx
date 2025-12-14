import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { StoreHydration } from "@/components/StoreHydration";

export const metadata: Metadata = {
  title: "Lazada Clone - Shop Now",
  description: "Your favorite online shopping destination",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 flex flex-col min-h-screen antialiased">
        <Providers>
          <StoreHydration />
          {children}
        </Providers>
      </body>
    </html>
  );
}