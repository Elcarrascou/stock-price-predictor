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
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <p className="mb-2 inline-block rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
          Tópicos de Machine Learning en la Nube · USACH
        </p>
        <h1 className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
          Stock Price Predictor
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
          Ingresa un ticker bursátil, una fecha de inicio y los días a predecir.
          La app descarga datos reales, entrena un modelo{" "}
          <span className="text-slate-200">Random Forest</span> en la nube y
          proyecta el precio de cierre.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 shadow-xl backdrop-blur sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-300">Ticker</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL"
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-300">
              Fecha de inicio
            </span>
            <input
              type="date"
              value={start}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-300">
              Días a predecir: <span className="text-sky-300">{days}</span>
            </span>
            <input
              type="range"
              min={1}
              max={60}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-2 accent-sky-500"
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
              className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition hover:border-sky-500 hover:text-sky-300"
            >
              {ex}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Entrenando modelo en la nube…" : "Predecir"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 py-10 text-sm text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
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

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-xl backdrop-blur sm:p-6">
            <PredictionChart
              history={result.history}
              predictions={result.predictions}
            />
          </div>

          <div className="grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
            <MetricLine label="RMSE (test)" value={result.metrics.rmse.toFixed(3)} />
            <MetricLine label="MAE (test)" value={result.metrics.mae.toFixed(3)} />
            <MetricLine
              label="Muestras de entrenamiento"
              value={String(result.metrics.n_train)}
            />
          </div>

          <p className="text-center text-xs text-slate-600">
            Modelo: {result.model}. Proyección iterativa multi-paso. Esto es un
            ejercicio académico, no constituye asesoría financiera.
          </p>
        </section>
      )}

      <footer className="mt-12 text-center text-xs text-slate-600">
        Daniel Carrasco Urrutia · Magíster en Ciencia de Datos · USACH ·{" "}
        {new Date().getFullYear()}
      </footer>
    </main>
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
      ? "text-emerald-400"
      : accent === "down"
      ? "text-red-400"
      : "text-slate-100";
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3">
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
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
      <span>{label}</span>
      <span className="font-mono text-slate-200">{value}</span>
    </div>
  );
}
