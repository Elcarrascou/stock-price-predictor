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
          <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ec" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#5b7185", fontSize: 11 }}
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "#5b7185", fontSize: 11 }}
            domain={["auto", "auto"]}
            tickFormatter={fmt}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #c7d4de",
              borderRadius: 8,
              color: "#1b2a38",
            }}
            formatter={(value, name) =>
              value == null ? ["-", name] : [fmt(Number(value)), name]
            }
          />
          <Legend wrapperStyle={{ color: "#33485c" }} />
          {last && (
            <ReferenceLine
              x={last.date}
              stroke="#EA7600"
              strokeDasharray="4 4"
              label={{ value: "hoy", fill: "#EA7600", fontSize: 11, position: "top" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="historico"
            name="Histórico"
            stroke="#007FA3"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="prediccion"
            name="Predicción"
            stroke="#EA7600"
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
