# 📈 Stock Price Predictor

Aplicación web que predice el precio de cierre de acciones bursátiles usando un
modelo **Random Forest** entrenado en la nube. El usuario ingresa un *ticker*,
una fecha de inicio y la cantidad de días a proyectar; la app descarga datos
reales del mercado, entrena el modelo on-demand y grafica el histórico junto a
la predicción.

> **Tarea Final** — Tópicos de Machine Learning en la Nube
> Magíster en Ciencia de Datos Aplicado a la Gestión Pública y Privada · USACH
> Daniel Carrasco Urrutia

---

## 🚀 Demo

App desplegada en Vercel: **(link público tras el deploy)**

Tickers de ejemplo: `AAPL`, `MSFT`, `NVDA`, `TSLA`, `COPEC.SN`, `BTC-USD`.

---

## 🧠 ¿Cómo funciona?

```
┌──────────────┐    POST /api/predict    ┌────────────────────────────┐
│  Next.js UI  │  ───────────────────▶   │  Python Serverless (Vercel) │
│  (frontend)  │   { ticker, start,      │  1. Descarga datos Yahoo    │
│              │     days }              │  2. Feature engineering     │
│  Recharts    │  ◀───────────────────   │  3. Random Forest (sklearn) │
│  (gráfico)   │   { history,            │  4. Forecast iterativo      │
└──────────────┘     predictions,        └────────────────────────────┘
                      metrics }
```

### Pipeline de Machine Learning

1. **Datos**: se descargan los cierres diarios desde la API pública *chart* de
   Yahoo Finance usando solo la librería estándar (`urllib`). No se usa
   `yfinance` para mantener el *bundle* liviano (ver
   [Decisiones de diseño](#-decisiones-de-diseño)).
2. **Features** (sobre la serie de cierres `Close`):
   - Lags: `lag_1`, `lag_2`, `lag_5`
   - Medias móviles: `MA_7`, `MA_14`, `MA_30`
   - Variación porcentual diaria
3. **Variable objetivo**: precio de cierre del día siguiente (`Close` desplazado).
4. **Modelo**: `RandomForestRegressor` (200 árboles, `max_depth=12`) de
   scikit-learn.
5. **Validación**: *split* temporal (sin *shuffle*) reservando el tramo final
   para calcular **RMSE**, **MAE** y **R²** honestos.
6. **Proyección**: forecast **iterativo multi-paso** — cada predicción se
   reincorpora a la serie para predecir el siguiente día.

---

## 🛠️ Stack tecnológico

| Componente   | Tecnología                                  |
| ------------ | ------------------------------------------- |
| Frontend     | Next.js 14 (App Router) + Tailwind CSS      |
| Gráfico      | Recharts                                    |
| Backend ML   | Python Serverless Function (Vercel)         |
| Modelo       | Random Forest (`scikit-learn`)              |
| Datos        | API pública de Yahoo Finance (`urllib`)     |
| Deploy       | Vercel                                      |

---

## 💡 Decisiones de diseño

- **Sin `yfinance`**: las funciones *serverless* de Vercel tienen un límite de
  ~250 MB sin comprimir. `yfinance` arrastra `pandas`, `lxml` y `beautifulsoup4`,
  acercándose peligrosamente al límite, y su API es inestable (rate-limits). Se
  optó por consumir directamente el endpoint *chart* de Yahoo con `urllib`
  (cero dependencias). El *bundle* queda solo con `numpy` + `scikit-learn`.
- **Random Forest liviano**: 200 árboles con profundidad acotada entrenan en
  menos de 1 s sobre ~1-2 años de datos diarios, dentro del `maxDuration` de la
  función.
- **`maxDuration: 60`**: configurado en `vercel.json` para dar margen al
  *cold start* (importar `numpy`/`sklearn`) + descarga + entrenamiento.

---

## 📂 Estructura

```
stock-predictor/
├── app/
│   ├── layout.tsx                 # Layout raíz + metadata
│   ├── page.tsx                   # UI principal (formulario + resultados)
│   ├── globals.css                # Estilos Tailwind
│   └── components/
│       └── PredictionChart.tsx    # Gráfico histórico + predicción (Recharts)
├── api/
│   └── predict.py                 # Serverless function: descarga + ML + forecast
├── requirements.txt               # numpy, scikit-learn
├── vercel.json                    # Runtime Python + maxDuration
├── package.json
└── README.md
```

---

## ▶️ Ejecución local

Requisitos: Node.js 18+ y Python 3.9+.

```bash
# Frontend
npm install
npm run dev          # http://localhost:3000
```

El endpoint Python se ejecuta en Vercel. Para probar el frontend con el backend
real, usa `vercel dev` (Vercel CLI) que levanta ambos:

```bash
npm i -g vercel
vercel dev
```

---

## ☁️ Despliegue en Vercel

El proyecto está conectado a GitHub. Cada *push* a `main` dispara un deploy
automático. Alternativamente:

```bash
vercel --prod
```

Vercel detecta automáticamente:
- El frontend Next.js.
- La función `api/predict.py` como *serverless* Python (vía `requirements.txt`).

---

## 📊 Métricas mostradas

Para cada predicción la app reporta sobre el conjunto de validación temporal:

- **RMSE** — error cuadrático medio (raíz).
- **MAE** — error absoluto medio.
- **R²** — coeficiente de determinación.
- **N° de muestras** de entrenamiento.

---

## 🔮 Trabajo futuro

- Incorporar análisis de **sentimiento de noticias financieras** mediante un LLM
  (RAG sobre titulares) como *feature* adicional.
- Comparar Random Forest con modelos de **Deep Learning** (LSTM / Temporal
  Fusion Transformer) para series temporales.
- Backtesting con ventana deslizante y bandas de confianza.

---

> ⚠️ Proyecto académico. Las predicciones **no constituyen asesoría financiera**.
