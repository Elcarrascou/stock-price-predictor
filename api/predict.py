"""
Stock Price Predictor - Serverless ML endpoint (Vercel Python).

Descarga precios historicos desde la API publica de Yahoo Finance (stdlib,
sin dependencias pesadas), construye features de serie temporal y entrena un
modelo Random Forest (scikit-learn) para proyectar el precio de cierre.

Endpoint: POST /api/predict
Body JSON: { "ticker": "AAPL", "start": "2023-01-01", "days": 15 }
"""

from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta, timezone

import numpy as np
from sklearn.ensemble import RandomForestRegressor


# ----------------------------- Datos ---------------------------------------

def fetch_yahoo(ticker: str, start_ts: int, end_ts: int):
    """Descarga cierres diarios desde la API chart de Yahoo Finance."""
    base = "https://query1.finance.yahoo.com/v8/finance/chart/"
    qs = urllib.parse.urlencode(
        {
            "period1": start_ts,
            "period2": end_ts,
            "interval": "1d",
            "events": "history",
        }
    )
    url = f"{base}{urllib.parse.quote(ticker)}?{qs}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0 Safari/537.36"
            )
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = json.loads(resp.read().decode())

    chart = raw.get("chart", {})
    if chart.get("error"):
        raise ValueError("Ticker no encontrado o sin datos en Yahoo Finance.")
    result = chart.get("result")
    if not result:
        raise ValueError("Ticker no encontrado o sin datos en Yahoo Finance.")

    res = result[0]
    timestamps = res.get("timestamp") or []
    quote = (res.get("indicators", {}).get("quote") or [{}])[0]
    closes = quote.get("close") or []

    dates, prices = [], []
    for t, c in zip(timestamps, closes):
        if c is None:
            continue
        d = datetime.fromtimestamp(t, tz=timezone.utc).strftime("%Y-%m-%d")
        dates.append(d)
        prices.append(float(c))

    return dates, np.asarray(prices, dtype=float)


# --------------------------- Features --------------------------------------

# Necesitamos al menos 30 dias de historia para MA_30.
MIN_HISTORY = 30


def features_at(prices: np.ndarray, i: int):
    """Vector de features en el indice i (predice prices[i+1])."""
    return [
        prices[i],                       # lag_1 (cierre de hoy)
        prices[i - 1],                   # lag_2
        prices[i - 4],                   # lag_5
        prices[i - 6:i + 1].mean(),      # MA_7
        prices[i - 13:i + 1].mean(),     # MA_14
        prices[i - 29:i + 1].mean(),     # MA_30
        (prices[i] - prices[i - 1]) / prices[i - 1],  # variacion % diaria
    ]


def build_dataset(prices: np.ndarray):
    X, y = [], []
    for i in range(MIN_HISTORY - 1, len(prices) - 1):
        X.append(features_at(prices, i))
        y.append(prices[i + 1])
    return np.asarray(X), np.asarray(y)


def next_business_days(last_date: str, n: int):
    """Genera n fechas habiles (lun-vie) posteriores a last_date."""
    d = datetime.strptime(last_date, "%Y-%m-%d")
    out = []
    while len(out) < n:
        d += timedelta(days=1)
        if d.weekday() < 5:  # 0..4 = lun..vie
            out.append(d.strftime("%Y-%m-%d"))
    return out


# ----------------------------- Modelo --------------------------------------

def run_pipeline(ticker: str, start: str, days: int):
    days = max(1, min(int(days), 60))

    try:
        start_dt = datetime.strptime(start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        raise ValueError("Fecha de inicio invalida (formato esperado YYYY-MM-DD).")

    start_ts = int(start_dt.timestamp())
    end_ts = int(datetime.now(tz=timezone.utc).timestamp())
    if start_ts >= end_ts:
        raise ValueError("La fecha de inicio debe ser anterior a hoy.")

    dates, prices = fetch_yahoo(ticker, start_ts, end_ts)

    if len(prices) < MIN_HISTORY + 15:
        raise ValueError(
            "Datos insuficientes para entrenar. Usa una fecha de inicio mas "
            "antigua o un ticker con mayor historial."
        )

    X, y = build_dataset(prices)

    # Split temporal para metricas honestas (sin shuffle).
    split = max(int(len(X) * 0.85), len(X) - 60)
    split = min(split, len(X) - 1)

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=2,
        n_jobs=-1,
        random_state=42,
    )
    model.fit(X[:split], y[:split])

    pred_test = model.predict(X[split:])
    y_test = y[split:]
    rmse = float(np.sqrt(np.mean((pred_test - y_test) ** 2)))
    mae = float(np.mean(np.abs(pred_test - y_test)))
    ss_res = float(np.sum((y_test - pred_test) ** 2))
    ss_tot = float(np.sum((y_test - y_test.mean()) ** 2)) or 1e-9
    r2 = 1.0 - ss_res / ss_tot

    # Re-entrenamos con toda la serie para la proyeccion futura.
    model.fit(X, y)

    # Forecast iterativo multi-paso.
    series = prices.astype(float).copy()
    future_prices = []
    for _ in range(days):
        i = len(series) - 1
        f = np.asarray(features_at(series, i), dtype=float).reshape(1, -1)
        p = float(model.predict(f)[0])
        series = np.append(series, p)
        future_prices.append(round(p, 4))

    future_dates = next_business_days(dates[-1], days)

    history = [
        {"date": d, "close": round(float(c), 4)} for d, c in zip(dates, prices)
    ]
    predictions = [
        {"date": d, "close": c} for d, c in zip(future_dates, future_prices)
    ]

    return {
        "ticker": ticker.upper(),
        "history": history,
        "predictions": predictions,
        "metrics": {
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "r2": round(r2, 4),
            "n_train": int(len(X)),
        },
        "model": "RandomForestRegressor (200 árboles, scikit-learn)",
    }


# --------------------------- HTTP handler ----------------------------------

class handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self.send_header("Allow", "POST, OPTIONS")
        self.end_headers()

    def do_GET(self):  # noqa: N802
        self._send(200, {"status": "ok", "message": "POST a /api/predict para predecir."})

    def do_POST(self):  # noqa: N802
        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            body = json.loads(raw.decode("utf-8") or "{}")

            ticker = str(body.get("ticker", "")).strip()
            start = str(body.get("start", "")).strip()
            days = body.get("days", 15)

            if not ticker:
                raise ValueError("Debes indicar un ticker (ej. AAPL).")
            if not start:
                raise ValueError("Debes indicar una fecha de inicio.")

            result = run_pipeline(ticker, start, days)
            self._send(200, result)
        except ValueError as e:
            self._send(400, {"error": str(e)})
        except Exception as e:  # noqa: BLE001
            self._send(
                500,
                {"error": "Error interno al generar la predicción.", "detail": str(e)},
            )
