import type { Metadata } from "next";
import NavBar from "./components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Price Predictor | USACH - ML en la Nube",
  description:
    "Predicción de precios bursátiles con Random Forest. Tarea Final del ramo Tópicos de Machine Learning en la Nube, Magíster en Ciencia de Datos, USACH. Autor: Daniel Carrasco. Profesor: Leonardo Etchegaray.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="text-usach-ink antialiased">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
