"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";

export type SeriesPoint = { date: string; close: number };

type Props = {
  history: SeriesPoint[];
  predictions: SeriesPoint[];
};

type ChartPoint = {
  date: string;
  historico: number | null;
  prediccion: number | null;
};

export default function PredictionChart({ history, predictions }: Props) {
  // Mostramos solo los ultimos 120 dias historicos para legibilidad.
  const trimmedHistory = history.slice(-120);

  const data: ChartPoint[] = trimmedHistory.map((p) => ({
    date: p.date,
    historico: p.close,
    prediccion: null,
  }));

  // Punto puente: conecta la linea historica con la predicha.
  const last = trimmedHistory[trimmedHistory.length - 1];
  if (last) {
    data[data.length - 1].prediccion = last.close;
  }

  predictions.forEach((p) => {
    data.push({ date: p.date, historico: null, prediccion: p.close });
  });

  const fmt = (v: number) =>
    v >= 1000 ? v.toFixed(0) : v.toFixed(2);

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            domain={["auto", "auto"]}
            tickFormatter={fmt}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#e2e8f0",
            }}
            formatter={(value, name) =>
              value == null ? ["-", name] : [fmt(Number(value)), name]
            }
          />
          <Legend wrapperStyle={{ color: "#cbd5e1" }} />
          {last && (
            <ReferenceLine
              x={last.date}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: "hoy", fill: "#f59e0b", fontSize: 11, position: "top" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="historico"
            name="Histórico"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="prediccion"
            name="Predicción"
            stroke="#34d399"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 2 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
