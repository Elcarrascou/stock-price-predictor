"use client";

import { useState } from "react";
import PredictionChart, { SeriesPoint } from "./components/PredictionChart";

type Metrics = {
  rmse: number;
  mae: number;
  r2: number;
  n_train: number;
};

type PredictResponse = {
  ticker: string;
  history: SeriesPoint[];
  predictions: SeriesPoint[];
  metrics: Metrics;
  model: string;
};

const EXAMPLES = ["AAPL", "MSFT", "NVDA", "TSLA", "COPEC.SN", "BTC-USD"];

export default function Home() {
  const [ticker, setTicker] = useState("AAPL");
  const [start, setStart] = useState("2023-01-01");
  const [days, setDays] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: ticker.trim(), start, days }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Error al generar la predicción");
      }
      setResult(payload as PredictResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const lastClose = result?.history?.[result.history.length - 1]?.close;
  const lastPred = result?.predictions?.[result.predictions.length - 1]?.close;
  const delta =
    lastClose && lastPred ? ((lastPred - lastClose) / lastClose) * 100 : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <header className="mb-8 text-center">
        <p className="mb-2 inline-block rounded-full border border-usach-blue/30 bg-usach-blue/10 px-3 py-1 text-xs font-medium text-usach-blue">
          Tópicos de Machine Learning en la Nube · Magíster en Ciencia de Datos · USACH
        </p>
        <h1 className="bg-gradient-to-r from-usach-navy via-usach-blue to-usach-orange bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
          Stock Price Predictor
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
          Ingresa un ticker bursátil, una fecha de inicio y los días a predecir.
          La app descarga datos reales, entrena un modelo{" "}
          <span className="font-semibold text-usach-navy">Random Forest</span>{" "}
          en la nube y proyecta el precio de cierre.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Autor: <span className="font-medium text-usach-navy">Daniel Carrasco</span>{" "}
          · Profesor: <span className="font-medium text-usach-navy">Leonardo Etchegaray</span>
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-usach-blue/15 bg-white p-5 shadow-lg shadow-usach-navy/5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">Ticker</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-usach-blue focus:ring-1 focus:ring-usach-blue"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">
              Fecha de inicio
            </span>
            <input
              type="date"
              value={start}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-usach-blue focus:ring-1 focus:ring-usach-blue"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">
              Días a predecir:{" "}
              <span className="font-semibold text-usach-orange">{days}</span>
            </span>
            <input
              type="range"
              min={1}
              max={60}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-2 accent-usach-orange"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Ejemplos:</span>
          {EXAMPLES.map((ex) => (
            <button
              type="button"
              key={ex}
              onClick={() => setTicker(ex)}
              className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition hover:border-usach-blue hover:text-usach-blue"
            >
              {ex}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-gradient-to-r from-usach-blue to-usach-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Entrenando modelo en la nube…" : "Predecir"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-usach-blue/15 bg-white py-10 text-sm text-slate-500 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-usach-blue" />
          Descargando datos y entrenando Random Forest…
        </div>
      )}

      {result && !loading && (
        <section className="mt-8 space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Ticker" value={result.ticker} />
            <Stat
              label="Último cierre"
              value={lastClose ? lastClose.toFixed(2) : "-"}
            />
            <Stat
              label={`Proyección (+${result.predictions.length}d)`}
              value={lastPred ? lastPred.toFixed(2) : "-"}
              accent={
                delta == null ? undefined : delta >= 0 ? "up" : "down"
              }
              sub={delta == null ? undefined : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`}
            />
            <Stat label="R² (test)" value={result.metrics.r2.toFixed(3)} />
          </div>

          <div className="rounded-2xl border border-usach-blue/15 bg-white p-4 shadow-lg shadow-usach-navy/5 sm:p-6">
            <PredictionChart
              history={result.history}
              predictions={result.predictions}
            />
          </div>

          <ChartExplanation result={result} delta={delta} />

          <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
            <MetricLine label="RMSE (test)" value={result.metrics.rmse.toFixed(3)} />
            <MetricLine label="MAE (test)" value={result.metrics.mae.toFixed(3)} />
            <MetricLine
              label="Muestras de entrenamiento"
              value={String(result.metrics.n_train)}
            />
          </div>

          <p className="text-center text-xs text-slate-400">
            Modelo: {result.model}. Proyección iterativa multi-paso. Esto es un
            ejercicio académico, no constituye asesoría financiera.
          </p>
        </section>
      )}

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-usach.png"
          alt="Escudo Universidad de Santiago de Chile"
          className="mx-auto mb-3 h-14 w-auto"
        />
        <p className="font-medium text-usach-navy">
          Daniel Carrasco · Profesor Leonardo Etchegaray
        </p>
        <p className="mt-1">
          Tópicos de Machine Learning en la Nube · Magíster en Ciencia de Datos
        </p>
        <p className="mt-1">Universidad de Santiago de Chile · Junio 2026</p>
      </footer>
    </main>
  );
}

function ChartExplanation({
  result,
  delta,
}: {
  result: PredictResponse;
  delta: number | null;
}) {
  const nDays = result.predictions.length;
  const r2 = result.metrics.r2;

  const trend =
    delta == null
      ? "estable"
      : delta > 1
      ? "al alza"
      : delta < -1
      ? "a la baja"
      : "lateral (sin variación significativa)";

  const confianza =
    r2 >= 0.8
      ? "alta: el modelo explica gran parte de la variabilidad del precio en el período de validación"
      : r2 >= 0.5
      ? "moderada: el modelo captura la tendencia general, aunque con margen de error apreciable"
      : "baja: el precio de este activo es difícil de explicar con el historial reciente, interpreta la proyección con cautela";

  return (
    <div className="rounded-2xl border border-usach-orange/25 bg-gradient-to-br from-white to-usach-orange/5 p-5 text-sm leading-relaxed text-slate-700 shadow-sm sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-usach-navy">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-usach-orange text-xs font-bold text-white">
          ?
        </span>
        ¿Cómo leer este gráfico?
      </h2>
      <ul className="space-y-2">
        <li>
          <span className="font-semibold text-usach-blue">■ Línea azul (Histórico):</span>{" "}
          muestra los últimos 120 cierres diarios reales de{" "}
          <span className="font-semibold">{result.ticker}</span>, descargados desde
          Yahoo Finance.
        </li>
        <li>
          <span className="font-semibold text-usach-orange">■ Línea naranja segmentada (Predicción):</span>{" "}
          es la proyección del modelo Random Forest para los próximos{" "}
          <span className="font-semibold">{nDays} días hábiles</span>. La línea
          vertical punteada marca &quot;hoy&quot;: a su izquierda hay datos reales, a su
          derecha solo estimaciones.
        </li>
        <li>
          <span className="font-semibold text-usach-navy">Tendencia proyectada:</span>{" "}
          el modelo anticipa un movimiento{" "}
          <span className="font-semibold">{trend}</span>
          {delta != null && (
            <>
              {" "}
              de{" "}
              <span className={`font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(2)}%
              </span>{" "}
              respecto al último cierre real
            </>
          )}
          .
        </li>
        <li>
          <span className="font-semibold text-usach-navy">Confiabilidad (R² = {r2.toFixed(3)}):</span>{" "}
          {confianza}.
        </li>
        <li className="text-xs text-slate-500">
          Nota: la predicción es <em>iterativa multi-paso</em> (cada día predicho
          alimenta al siguiente), por lo que la incertidumbre crece a medida que
          se aleja del último dato real.
        </li>
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "up" | "down";
}) {
  const accentClass =
    accent === "up"
      ? "text-emerald-600"
      : accent === "down"
      ? "text-red-600"
      : "text-usach-navy";
  return (
    <div className="rounded-xl border border-usach-blue/15 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-semibold ${accentClass}`}>{value}</p>
      {sub && <p className={`text-xs ${accentClass}`}>{sub}</p>}
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span>{label}</span>
      <span className="font-mono font-medium text-usach-navy">{value}</span>
    </div>
  );
}
