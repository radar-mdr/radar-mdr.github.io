# Radar MDR × AI Act

> **EN** — A Spanish-language regulatory observatory for medical technology and clinical AI:
> live compliance timeline for the EU MDR, IVDR, AI Act (post-Omnibus, Reg. (EU) 2026/1744), EHDS
> and FDA QMSR, built as a structured, verifiable database. Every data point carries an official
> source, a verification date and an ALCOA+ change history; corrections are published as CAPA-style
> errata. Static site built with Astro; data as schema-validated JSON collections; automated daily
> source monitoring via GitHub Actions + Python. Code: MIT. Data & content: CC BY 4.0.

Observatorio en español de plazos y obligaciones regulatorias para tecnología médica e IA
clínica: **MDR, IVDR, AI Act, EHDS y FDA QMSR**. Cada dato lleva fuente oficial, fecha de
verificación e historial de cambios.

> Información divulgativa; no constituye asesoramiento legal ni regulatorio.

## Desarrollo

```bash
npm install
npm run dev      # servidor local en http://localhost:4321
npm run build    # valida esquemas Zod, genera el sitio en dist/ e indexa Pagefind
npm run preview  # sirve dist/ (necesario para probar /buscar)
```

Los ajustes del sitio (dominio, email, LinkedIn, repositorio, Buttondown, GoatCounter) están en
[src/config.ts](src/config.ts). Si un campo está vacío, la función correspondiente se desactiva
en lugar de mostrar un enlace roto.

Documentación: [puesta en marcha](docs/PUESTA-EN-MARCHA.md) · [plan](docs/PLAN.md) · [distribución y UTM](docs/DISTRIBUCION.md) ·
[guion de entrevistas v2](docs/ENTREVISTAS.md) · [día de congelación](docs/DIA-FINAL.md).

## Datos

El valor está en los datos estructurados, no en los artículos. Colecciones en `src/data/*.json`,
con esquemas en [src/content.config.ts](src/content.config.ts):

| Entidad | Archivo | Estado (17-10-2026) |
|---|---|---|
| Plazo | `plazos.json` | ✅ 23 plazos (MDR, IVDR, AI Act, EHDS, QMSR), todos reverificados, con historial |
| Obligación | `obligaciones.json` | ✅ Matrices MDR e IVDR por clase + 4 fichas por agente económico |
| Organismo notificado | `organismos.json` | ✅ 53 organismos (52 MDR, 19 IVDR) verificados en NANDO |
| Glosario | `glosario.json` | ✅ 92 términos ES/EN |
| Propuesta en tramitación | `propuestas.json` | ✅ Revisión MDR/IVDR, COM(2025) 1023 |
| Fe de erratas | `erratas.json` | ✅ 4 erratas cerradas con CAPA |
| Requisitos eQMS | `requisitos-eqms.json` | ✅ 15 requisitos (ISO 13485, Part 11, MDR) |
| Guía (MDCG) | `guias.json` | ✅ 5 fichas publicadas: MDCG 2025-6, 2019-11 rev.1, 2020-1, 2025-4 y 2025-10 |
| Fuente | `fuentes.json` | ✅ 30 fuentes |
| Herramienta eQMS | `herramientas.json` | ⬜ vacía hasta tener 2 fuentes por fila (plantilla: `herramientas.ejemplo.json`) |

**Reglas de los datos** (resumen de la [metodología](src/pages/metodologia.astro)):

- Todo dato lleva `fuente_url` y `fecha_verificacion`. A los 90 días sin reverificar se marca en amarillo.
- Estados: `vigente`, `pendiente_confirmacion`, `en_tramitacion` (fuera del calendario) y `aplazado`.
- **Nunca se sobrescribe sin rastro**: cada cambio añade una entrada a `historial` con valor
  anterior, valor nuevo, motivo y fuente (ALCOA+). De ahí salen `/cambios` y `/rss.xml`.
- Los errores de interpretación van a `erratas.json` con corrección, causa raíz y acción correctiva.
- Comparador eQMS: cada fila exige al menos 2 fuentes independientes.
- Copyright: resumir y enlazar; las normas ISO/IEC se citan, no se copian.

### Cómo corregir un plazo

1. Cambia el campo en `plazos.json`.
2. Añade una entrada a su `historial`: `fecha`, `campo`, `valor_anterior`, `valor_nuevo`, `motivo` y `fuente_url`.
3. Actualiza `fecha_verificacion`.
4. Si era un error de interpretación (no un cambio normativo), añade también una errata a `erratas.json`.

## Distribución automática (sale de los mismos JSON)

| URL | Qué es |
|---|---|
| `/calendario.ics` | Calendario con todos los plazos vigentes y alarma a 30 días |
| `/?rol=…&clase=…` | Cronología filtrada y compartible |
| `/api/plazos.json` · `/api/fuentes.json` · `/api/organismos.json` | API pública de solo lectura (CC BY 4.0) |
| `/rss.xml` | Feed de cambios desde el historial de cada plazo |
| `/cambios/` | Registro de cambios público: el borrador natural de cada newsletter |
| `/buscar/` | Buscador Pagefind (solo funciona sobre el build) |

## Vigilancia automática

`.github/workflows/vigilancia.yml` corre a diario en GitHub Actions:
[scripts/vigilancia.py](scripts/vigilancia.py) descarga 8 fuentes clave, extrae el texto
principal y lo compara con los snapshots del repo. Si algo cambió, **abre un issue con el
diff**. Con el secreto `ANTHROPIC_API_KEY` añade un borrador de alerta en español
([scripts/resumen_ia.py](scripts/resumen_ia.py)), siempre con revisión humana antes de publicar.
El secreto opcional `VERCEL_DEPLOY_HOOK` redespliega el sitio cada mañana.

## Pendiente (solo lo puede hacer el autor)

Paso a paso, con los comandos, en [docs/PUESTA-EN-MARCHA.md](docs/PUESTA-EN-MARCHA.md).

- [ ] Fusionar la rama `mejoras-feedback-octubre` en `main`.
- [ ] Comprar el dominio y ponerlo en `dominio` de `src/config.ts`: es la única línea que hay
      que cambiar (el `robots.txt`, el sitemap, el `og:url` y el calendario salen de ahí).
- [ ] Crear el repo en GitHub, `git push`, conectar Vercel y lanzar a mano la primera vigilancia.
- [ ] Probar la vista previa en el Post Inspector de LinkedIn (ver [DISTRIBUCION.md](docs/DISTRIBUCION.md)).
- [ ] Buttondown con correo del dominio → `buttondownUsuario` y `email` en `src/config.ts`.
- [ ] GoatCounter (sin cookies) → `goatcounterCodigo` en `src/config.ts`.
- [ ] Revisar el texto de [/sobre-mi](src/pages/sobre-mi.astro), elegir el correo público y añadir `repositorio`.
- [ ] Formulario Tally en `/pro` (iframe comentado en [pro.astro](src/pages/pro.astro)).
- [x] Fichas en español de MDCG 2019-11 rev.1, 2025-4, 2020-1 y 2025-10 (17-10-2026).

## Historial de versiones

- **v0.3.1 (17-10-2026):** cuatro fichas MDCG nuevas leídas de los PDF oficiales, tabla
  IMDRF de la MDCG 2019-11 en IA clínica, escalera del lunar corregida (errata E-004),
  `robots.txt` generado desde `config.ts` y guía de puesta en marcha.
- **v0.3 (octubre de 2026):** se levanta la congelación de julio para incorporar el temario y la
  revisión externa: datos reverificados, IVDR y EHDS, matrices de obligaciones, directorio NANDO,
  IA clínica completa, «En tramitación», metodología, historial ALCOA+, fe de erratas, Open Graph y «Sobre mí».
- **v0.2 (7-7-2026):** calendario, API, RSS, changelog, buscador y vigilancia automática.
- **v0.1 (5-7-2026):** esquema de datos y cronología post-Omnibus.

## Licencia

Código bajo [MIT](LICENSE). Datos regulatorios y contenido en español bajo
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es): reutilízalos y cítalos **con
enlace**.
