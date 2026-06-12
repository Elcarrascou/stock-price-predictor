"use client";

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Barra de acciones (no se imprime) */}
      <div className="no-print mb-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-usach-blue/15 bg-white p-5 shadow-sm sm:flex-row">
        <div>
          <h1 className="text-lg font-semibold text-usach-navy">
            Documentación del proyecto
          </h1>
          <p className="text-sm text-slate-500">
            Descripción completa de la solución, su arquitectura y modo de uso.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-usach-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
            />
          </svg>
          Descargar PDF
        </button>
      </div>

      {/* ============ PORTADA ============ */}
      <section className="print-page doc-card mb-8 flex min-h-[70vh] flex-col items-center justify-center rounded-2xl border border-usach-blue/15 bg-white p-10 text-center shadow-lg shadow-usach-navy/5 print:min-h-[85vh] print:rounded-none print:border-0 print:shadow-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-usach.png"
          alt="Escudo Universidad de Santiago de Chile"
          className="mb-10 h-36 w-auto"
        />

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-usach-blue">
          Universidad de Santiago de Chile
        </p>
        <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">
          Magíster en Ciencia de Datos
        </p>

        <div className="my-8 h-1 w-24 rounded bg-usach-orange" />

        <h1 className="text-4xl font-bold text-usach-navy">
          Stock Price Predictor
        </h1>
        <p className="mt-3 max-w-xl text-base text-slate-600">
          Predicción de precios bursátiles mediante Random Forest desplegado
          como aplicación serverless en la nube
        </p>

        <div className="mt-12 space-y-2 text-base text-slate-600">
          <p>
            <span className="font-semibold text-usach-navy">Ramo:</span>{" "}
            Tópicos de Machine Learning en la Nube
          </p>
          <p>
            <span className="font-semibold text-usach-navy">Autor:</span>{" "}
            Daniel Carrasco
          </p>
          <p>
            <span className="font-semibold text-usach-navy">Profesor:</span>{" "}
            Leonardo Etchegaray
          </p>
        </div>

        <p className="mt-12 text-sm font-medium text-usach-blue">Junio 2026</p>
      </section>

      {/* ============ 1. PROBLEMA ============ */}
      <DocSection number="1" title="Descripción del problema">
        <p>
          Predecir el precio de un activo bursátil es uno de los problemas
          clásicos del análisis de series temporales financieras. Inversionistas
          y analistas necesitan estimar la trayectoria de corto plazo de una
          acción para apoyar decisiones de compra o venta, pero el acceso a
          herramientas de modelamiento suele requerir conocimientos técnicos,
          instalación de software y manejo de datos.
        </p>
        <p>
          Este proyecto resuelve esa fricción con una{" "}
          <strong>aplicación web pública</strong> donde cualquier usuario, sin
          conocimientos de programación, puede: (1) ingresar el ticker de una
          acción (ej. <code>AAPL</code>, <code>COPEC.SN</code>), (2) elegir el
          rango histórico de entrenamiento y (3) definir cuántos días desea
          proyectar. La aplicación descarga los datos reales del mercado,{" "}
          <strong>entrena un modelo de Machine Learning en la nube en tiempo
          real</strong> y entrega la proyección en un gráfico interactivo junto a
          métricas de calidad del modelo.
        </p>
      </DocSection>

      {/* ============ 2. METODOLOGÍA ============ */}
      <DocSection number="2" title="Metodología">
        <p>El flujo metodológico sigue las etapas estándar de un proyecto de ML:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Obtención de datos:</strong> los cierres diarios se
            descargan en línea desde la API pública <em>chart</em> de Yahoo
            Finance, sin necesidad de API key.
          </li>
          <li>
            <strong>Ingeniería de características</strong> sobre la serie de
            cierres:
            <ul className="mt-1 list-disc pl-5 text-base">
              <li>Rezagos (lags): cierre de hoy, de ayer y de hace 5 días.</li>
              <li>Medias móviles de 7, 14 y 30 días.</li>
              <li>Variación porcentual diaria.</li>
            </ul>
          </li>
          <li>
            <strong>Variable objetivo:</strong> el precio de cierre del día
            siguiente.
          </li>
          <li>
            <strong>Validación temporal honesta:</strong> la serie se divide sin
            mezclar (sin <em>shuffle</em>), reservando el tramo final (~15%)
            para calcular RMSE, MAE y R² sobre datos que el modelo nunca vio.
          </li>
          <li>
            <strong>Proyección iterativa multi-paso:</strong> el modelo se
            reentrena con toda la serie y predice un día a la vez; cada
            predicción se reincorpora a la serie para generar el día siguiente,
            hasta completar el horizonte solicitado (máx. 60 días hábiles).
          </li>
        </ol>
      </DocSection>

      {/* ============ 3. ARQUITECTURA Y MODELO ============ */}
      <DocSection number="3" title="Arquitectura y detalles del modelo">
        <h3 className="font-semibold text-usach-navy">3.1 Arquitectura cloud</h3>
        <pre className="overflow-x-auto rounded-lg bg-usach-navy p-4 text-[13px] leading-relaxed text-sky-100">
{`┌──────────────┐   POST /api/predict    ┌─────────────────────────────┐
│  Next.js UI  │ ────────────────────▶  │ Python Serverless (Vercel)  │
│  (frontend)  │  { ticker, start,      │ 1. Descarga datos Yahoo     │
│              │    days }              │ 2. Feature engineering      │
│  Recharts    │ ◀────────────────────  │ 3. Random Forest (sklearn)  │
│  (gráfico)   │  { history,            │ 4. Forecast iterativo       │
└──────────────┘    predictions,        └─────────────────────────────┘
                     metrics }`}
        </pre>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Frontend:</strong> Next.js 14 (App Router) + Tailwind CSS,
            gráfico con Recharts.
          </li>
          <li>
            <strong>Backend:</strong> función serverless Python en Vercel; se
            crea y destruye por solicitud (cómputo elástico, costo cero en
            reposo).
          </li>
          <li>
            <strong>CI/CD:</strong> repositorio en GitHub conectado a Vercel;
            cada <em>push</em> a <code>main</code> despliega automáticamente.
          </li>
        </ul>

        <h3 className="mt-4 font-semibold text-usach-navy">3.2 Modelo</h3>
        <p>
          Se utiliza un{" "}
          <strong>
            <code>RandomForestRegressor</code> de scikit-learn
          </strong>{" "}
          con 200 árboles, profundidad máxima 12 y mínimo de 2 muestras por
          hoja. Random Forest fue elegido por: robustez ante ruido, nulo
          requerimiento de escalamiento de variables, bajo riesgo de sobreajuste
          gracias al promedio de árboles, y tiempo de entrenamiento menor a 1
          segundo — clave para entrenar <em>on-demand</em> dentro del límite de
          ejecución de una función serverless.
        </p>

        <h3 className="mt-4 font-semibold text-usach-navy">
          3.3 Decisiones de diseño relevantes
        </h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Sin <code>yfinance</code>:</strong> el límite de ~250 MB del
            bundle serverless de Vercel hace riesgoso incluir pandas/lxml. Se
            consume la API de Yahoo directamente con <code>urllib</code>{" "}
            (librería estándar), dejando solo <code>numpy</code> +{" "}
            <code>scikit-learn</code> como dependencias.
          </li>
          <li>
            <strong>Días hábiles:</strong> las fechas proyectadas omiten fines
            de semana, coherente con el calendario bursátil.
          </li>
        </ul>
      </DocSection>

      {/* ============ 4. USO ============ */}
      <DocSection number="4" title="Instrucciones de acceso y uso">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Accede a la aplicación en su URL pública de Vercel (pestaña{" "}
            <strong>Predictor</strong>).
          </li>
          <li>
            Escribe un <strong>ticker</strong> válido de Yahoo Finance (ej.{" "}
            <code>AAPL</code>, <code>MSFT</code>, <code>COPEC.SN</code> para
            acciones chilenas, <code>BTC-USD</code> para cripto), o usa los
            botones de ejemplo.
          </li>
          <li>
            Selecciona la <strong>fecha de inicio</strong> del historial de
            entrenamiento (se recomienda al menos 1 año hacia atrás).
          </li>
          <li>
            Ajusta los <strong>días a predecir</strong> (1 a 60) y presiona{" "}
            <strong>Predecir</strong>.
          </li>
          <li>
            En segundos verás: tarjetas resumen (último cierre, proyección y
            variación %), el gráfico histórico + predicción, una guía de
            interpretación del gráfico y las métricas del modelo (RMSE, MAE,
            R²).
          </li>
        </ol>
      </DocSection>

      {/* ============ 5. CONCLUSIONES ============ */}
      <DocSection number="5" title="Conclusiones, aspectos relevantes y desafíos">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Se logró una aplicación de ML <strong>100% funcional en la
            nube</strong>, que entrena un modelo real por cada solicitud en
            segundos, demostrando la viabilidad del patrón{" "}
            <em>training-on-demand</em> en arquitectura serverless.
          </li>
          <li>
            <strong>Desafío — límites serverless:</strong> el tamaño del bundle
            (~250 MB) y el tiempo máximo de ejecución obligaron a elegir
            dependencias mínimas y un modelo liviano, descartando alternativas
            como LSTM que requieren GPU y tiempos mayores.
          </li>
          <li>
            <strong>Desafío — forecast multi-paso:</strong> al predecir de forma
            iterativa, el error se acumula; el modelo tiende a proyecciones
            conservadoras a horizontes largos. Esto se transparenta al usuario
            en la guía de interpretación.
          </li>
          <li>
            <strong>Limitación inherente:</strong> los precios bursátiles se
            aproximan a un paseo aleatorio; ningún modelo basado solo en
            precios pasados garantiza aciertos. El valor del proyecto está en
            el pipeline completo: datos en vivo → features → entrenamiento →
            despliegue → visualización.
          </li>
        </ul>

        <h3 className="mt-4 font-semibold text-usach-navy">
          Relación con LLM / Deep Learning
        </h3>
        <p>
          La solución usa <strong>ML tradicional (Random Forest)</strong>, no un
          LLM. Como trabajo futuro se propone incorporar un LLM para análisis de
          sentimiento de noticias financieras (RAG sobre titulares) como feature
          adicional, y comparar contra arquitecturas de Deep Learning para
          series temporales (LSTM, Temporal Fusion Transformer).
        </p>
      </DocSection>

      {/* ============ FICHA TÉCNICA ============ */}
      <DocSection number="6" title="Ficha técnica">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-base">
            <tbody>
              {[
                ["Frontend", "Next.js 14 + Tailwind CSS + Recharts"],
                ["Backend", "Python Serverless Function (Vercel)"],
                ["Modelo", "RandomForestRegressor — scikit-learn (200 árboles)"],
                ["Datos", "API pública chart de Yahoo Finance (urllib)"],
                ["Deploy", "Vercel (CI/CD desde GitHub, rama main)"],
                ["Repositorio", "github.com/Elcarrascou/stock-price-predictor"],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-slate-200">
                  <td className="w-36 py-2 pr-4 font-semibold text-usach-navy">
                    {k}
                  </td>
                  <td className="py-2 text-slate-600">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Daniel Carrasco · Profesor Leonardo Etchegaray · Tópicos de Machine
          Learning en la Nube · Magíster en Ciencia de Datos · Universidad de
          Santiago de Chile · Junio 2026
        </p>
      </DocSection>
    </main>
  );
}

function DocSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="print-avoid-break doc-card mb-6 rounded-2xl border border-usach-blue/15 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:px-0 print:shadow-none sm:p-8">
      <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-usach-navy">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-usach-blue text-base font-bold text-white">
          {number}
        </span>
        {title}
      </h2>
      <div className="space-y-3 text-base leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}
