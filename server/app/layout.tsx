import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata = {
  title: "Circuit Simulator",
  description: "Симулятор електронних схем",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
