import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Price Predictor | ML en la Nube",
  description:
    "Predicción de precios bursátiles con Random Forest. Tarea Final - Tópicos de Machine Learning en la Nube, USACH.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="text-slate-100 antialiased">{children}</body>
    </html>
  );
}
