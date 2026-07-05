# Radar MDR × AI Act

Observatorio en español de plazos y obligaciones regulatorias para tecnología médica e IA
clínica: **MDR, IVDR, AI Act y FDA QMSR**. Cronología viva post-Omnibus con fuente oficial y
fecha de verificación en cada dato.

> Información divulgativa; no constituye asesoramiento legal ni regulatorio.

## Desarrollo

```bash
npm install
npm run dev      # servidor local en http://localhost:4321
npm run build    # valida esquemas Zod y genera el sitio estático en dist/
```

Stack: [Astro](https://astro.build) (contenido en colecciones JSON validadas con Zod) + Vercel.
El plan completo del proyecto está en [docs/PLAN.md](docs/PLAN.md).

## Datos

El valor del sitio está en los datos estructurados, no en los artículos. Seis entidades en
`src/data/*.json`, con esquemas en [src/content.config.ts](src/content.config.ts):

| Entidad | Archivo | Estado |
|---|---|---|
| Plazo | `plazos.json` | ✅ 12 plazos post-Omnibus cargados |
| Fuente | `fuentes.json` | ✅ 23 fuentes cargadas |
| Guía (MDCG) | `guias.json` | 🔶 3 fichas en preparación |
| Obligación | `obligaciones.json` | ⬜ pendiente |
| Organismo notificado | `organismos.json` | ⬜ pendiente |
| Herramienta eQMS | `herramientas.json` | ⬜ pendiente |

**Reglas de los datos** (el foso es la confiabilidad):

- Todo dato lleva `fuente_url` oficial y `fecha_verificacion`.
- `estado: pendiente_confirmacion` cuando las fuentes discrepan (p. ej., el registro legacy de
  EUDAMED: 27 vs. 28 de noviembre de 2026).
- `nota_cambio` documenta qué movió el Omnibus y qué queda por actualizar cuando se publique en
  el DOUE.
- Comparador eQMS: cada celda exige ≥2 fuentes independientes; las estimaciones se etiquetan.
- Copyright: resumir y enlazar, jamás republicar textos íntegros; las normas ISO/IEC se citan,
  no se copian.

## Hoja de ruta (8 semanas)

- [x] **S1 (6-12 jul):** repo + esquema de datos + cronología online + primeras fuentes
- [ ] S1: comprar dominio y desplegar en Vercel
- [ ] **S2 (13-19 jul):** resto de fuentes + formulario de suscripción (Buttondown/Beehiiv) + primer post
- [ ] **S3-S4 (20 jul-2 ago):** 5 fichas MDCG en español + página IA clínica completa + arranque de entrevistas
- [ ] **S5-S6 (3-16 ago):** 5 entrevistas + comparador eQMS v0 (5 herramientas) + script de vigilancia
- [ ] **S7-S8 (17-30 ago):** 5 entrevistas más + newsletters nº 2-3 + página «Pro» fantasma
- [ ] **31 ago:** revisión contra criterios de corte (30-50 suscriptores · 10 entrevistas · 3-5 «pagaría por X»)
