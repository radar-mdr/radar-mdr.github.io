# Radar MDR × AI Act

> **EN** — A Spanish-language regulatory observatory for medical technology and clinical AI:
> live compliance timeline for the EU MDR, IVDR, AI Act (post-Omnibus) and FDA QMSR, built as a
> structured, verifiable database (every data point carries an official source and a
> verification date). Static site built with Astro; data as schema-validated JSON collections;
> automated daily source monitoring via GitHub Actions. Code: MIT. Data & content: CC BY 4.0.

Observatorio en español de plazos y obligaciones regulatorias para tecnología médica e IA
clínica: **MDR, IVDR, AI Act y FDA QMSR**. Cronología viva post-Omnibus con fuente oficial y
fecha de verificación en cada dato.

> Información divulgativa; no constituye asesoramiento legal ni regulatorio.

## Desarrollo

```bash
npm install
npm run dev      # servidor local en http://localhost:4321
npm run build    # valida esquemas Zod, genera el sitio en dist/ e indexa Pagefind
npm run preview  # sirve dist/ (necesario para probar /buscar)
```

Stack: [Astro](https://astro.build) (contenido en colecciones JSON validadas con Zod) + Vercel.
El plan completo está en [docs/PLAN.md](docs/PLAN.md) y el guion del día de congelación en
[docs/DIA-FINAL.md](docs/DIA-FINAL.md).

## Datos

El valor del sitio está en los datos estructurados, no en los artículos. Seis entidades en
`src/data/*.json`, con esquemas en [src/content.config.ts](src/content.config.ts):

| Entidad | Archivo | Estado |
|---|---|---|
| Plazo | `plazos.json` | ✅ 12 plazos post-Omnibus cargados |
| Fuente | `fuentes.json` | ✅ 23 fuentes cargadas |
| Guía (MDCG) | `guias.json` | 🔶 3 fichas en preparación |
| Obligación | `obligaciones.json` | ⬜ espera a las entrevistas |
| Organismo notificado | `organismos.json` | ⬜ espera a las entrevistas |
| Herramienta eQMS | `herramientas.json` | ⬜ espera a las entrevistas (plantilla: `herramientas.ejemplo.json`) |

**Reglas de los datos** (el foso es la confiabilidad):

- Todo dato lleva `fuente_url` oficial y `fecha_verificacion`.
- `estado: pendiente_confirmacion` cuando las fuentes discrepan (p. ej., el registro legacy de
  EUDAMED: 27 vs. 28 de noviembre de 2026).
- `nota_cambio` documenta qué movió el Omnibus y qué queda por actualizar cuando se publique en
  el DOUE.
- Comparador eQMS: cada fila exige ≥2 fuentes independientes; las estimaciones se etiquetan
  (regla codificada en `TablaEQMS.astro`).
- Copyright: resumir y enlazar, jamás republicar textos íntegros; las normas ISO/IEC se citan,
  no se copian.

## Distribución automática (sale de los mismos JSON)

| URL | Qué es |
|---|---|
| `/calendario.ics` | Calendario suscribible con todos los plazos + alarma a 30 días |
| `/api/plazos.json` · `/api/fuentes.json` | API pública de solo lectura (CC BY 4.0) |
| `/rss.xml` | Feed de cambios verificados (`nota_cambio` + `fecha_verificacion`) |
| `/cambios/` | Changelog público — borrador natural de cada newsletter |
| `/buscar/` | Buscador Pagefind (solo funciona sobre el build) |
| `/pro/` | Página fantasma del Pro 2027 (mide intención de pago) |

## Vigilancia automática

`.github/workflows/vigilancia.yml` corre a diario en GitHub Actions:
[scripts/vigilancia.py](scripts/vigilancia.py) descarga 8 fuentes clave, extrae el texto
principal y lo compara con los snapshots del repo; si algo cambió, **abre un issue con el
diff** (backlog que se escribe solo) y, con el secreto `ANTHROPIC_API_KEY`, añade un borrador
de alerta en español ([scripts/resumen_ia.py](scripts/resumen_ia.py) — siempre con revisión
humana antes de publicar). El secreto opcional `VERCEL_DEPLOY_HOOK` redespliega el sitio cada
mañana. Primera ejecución: lanzar a mano desde la pestaña Actions (siembra los snapshots).

## La regla de congelación

Desde el 7 de julio de 2026, cada tarea pendiente del verano es **datos o personas, nunca código**:

| Tarea S2-S8 | Ahora es… |
|---|---|
| 5 fichas MDCG | escribir en `src/data/guias.json` (el campo `resumen_es` admite Markdown) |
| Comparador eQMS | rellenar `herramientas.json` (≥2 fuentes por fila) |
| Newsletter nº 1-3 | copiar `/cambios/` desde el último envío → Buttondown |
| Alertas de cambios | revisar los issues que abre el bot |
| Página Pro | ya existe; solo mirar las respuestas del formulario |
| 10 entrevistas | LinkedIn + calendario, cero código |

Si un viernes dudas entre una feature y dos mensajes a RA managers, **ganan los mensajes** — el
sitio es la excusa; las entrevistas son el producto.

## Hoja de ruta (8 semanas)

- [x] **S1 (6-12 jul):** repo + esquema de datos + cronología online + fuentes + code freeze
- [ ] S1: **comprar dominio y desplegar en Vercel** ← única tarea crítica pendiente
- [ ] **S2 (13-19 jul):** Buttondown + primer post: «El Omnibus ha movido tus fechas»
- [ ] **S3-S4 (20 jul-2 ago):** 5 fichas MDCG en `guias.json` + arranque de entrevistas
- [ ] **S5-S6 (3-16 ago):** 5 entrevistas + rellenar `herramientas.json` (5 filas)
- [ ] **S7-S8 (17-30 ago):** 5 entrevistas más + newsletters nº 2-3 + formulario Tally en /pro
- [ ] **31 ago:** revisión contra criterios de corte (30-50 suscriptores · 10 entrevistas · 3-5 «pagaría por X»)

## Licencia

Código bajo [MIT](LICENSE). Datos regulatorios y contenido en español bajo
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es): reutilízalos y cítalos **con
enlace** — que consultores citen la cronología es distribución gratis.
