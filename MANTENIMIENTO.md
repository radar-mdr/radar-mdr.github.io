# Mantenimiento del Radar

Recetas para las tareas que se repiten. Cada una termina igual: `npm run verificar` en verde
antes de subir nada. Las reglas generales están en [CLAUDE.md](CLAUDE.md).

## 1. Revisar la vigilancia (cada semana)

La vigilancia abre una incidencia en GitHub cada día que cambia alguna de las fuentes. Cada
incidencia enseña, por fuente, lo añadido (`+`) y lo quitado (`-`).

1. Lee primero las fuentes oficiales: el **índice de guías MDCG**, la página del **AI Act** y
   **EUDAMED**. Team-NB, MedTech Europe y AESIA casi siempre traen solo noticias.
2. Decide si cambia un dato del Radar:
   - una guía MDCG nueva o revisada → receta 3;
   - una fecha, un estado o una referencia legal → receta 2;
   - cambios de menú, noticias o actos sin efecto en los datos → nada.
3. Cierra la incidencia con una línea: «Sin cambios de datos» o «Actualizado en `<commit>`».

Si una fuente aparece todos los días sin cambios reales, su página lleva texto que cambia solo
(fechas, contadores, avisos). Mira `extraer_texto` en `scripts/vigilancia.py` y quita ese ruido,
con su prueba en `scripts/test_vigilancia.py`.

## 2. Corregir o añadir un plazo (`src/data/plazos.json`)

1. Abre la fuente oficial y localiza el artículo. Sin eso, no sigas.
2. Cambia el campo y añade una entrada al final de `historial`:

   ```json
   {
     "fecha": "2026-11-10",
     "campo": "fecha",
     "valor_anterior": "2027-05-28",
     "valor_nuevo": "2027-05-27",
     "motivo": "El plazo termina el día 27 según el art. 3 del Reg. 1182/71.",
     "fuente_url": "https://eur-lex.europa.eu/..."
   }
   ```

3. Pon `fecha_verificacion` a hoy. El `id` del plazo no se cambia nunca aunque cambie la fecha:
   es el ancla de los enlaces y del calendario.
4. Si era un error tuyo de interpretación, añade una errata a `erratas.json`.
5. Un plazo nuevo empieza con una entrada de historial de `campo: "alta"`. Usa los roles y las
   clases que ya existen; si necesitas uno nuevo, enséñaselo al asistente (receta 4).

De ahí salen solos la cronología, `/cambios/`, el RSS, el calendario, la API y el asistente.

## 3. Añadir la ficha de una guía (`src/data/guias.json`)

1. Descarga el PDF desde el índice oficial del MDCG y léelo entero.
2. Añade la entrada copiando la forma de las anteriores. El `resumen_es` lleva unas 300 palabras
   en Markdown puro, con apartados en negrita («Qué es», «Para qué te sirve»…).
3. `relevancia_ia` va de 1 (no trata de IA) a 5 (trata de IA en productos sanitarios).
4. Si la guía fija una fecha, añádela también como plazo (receta 2).
5. Actualiza la fila de guías de la tabla «Datos» del README.

## 4. El asistente «¿Qué me aplica?»

El asistente no guarda datos propios: cruza las respuestas con `norma`, `tipo`,
`roles_afectados` y `clases_producto` de cada plazo. Por eso:

- un plazo nuevo con roles y clases conocidos aparece solo;
- un rol o una clase nuevos hacen fallar la prueba «el asistente conoce todos los roles y
  clases». Añádelos en `rolesDe` o `clasesDe` de `src/lib/asistente.ts` y, si hace falta una
  respuesta nueva, en `src/pages/que-me-aplica.astro`;
- cada regla nueva lleva su prueba en `tests/asistente.test.mjs`, escrita como un caso real
  («fabricante de clase IIb implantable…»).

El asistente es orientativo y tiene que seguir diciéndolo en la página.

## 4b. Actualizar «En tramitación» (`src/data/propuestas.json`)

La vigilancia vigila la ficha de cada expediente en el Observatorio Legislativo del Parlamento
(solo la parte del estado, los hitos y los documentos). Cuando avise:

1. Abre la ficha oficial (`ficha_oficial`) y mira qué ha cambiado: un documento nuevo, una
   votación, una fecha indicativa del pleno que se mueve.
2. Marca el hito como hecho (`hecho: true` y `fecha_iso`) o añade el nuevo, siempre con su
   `fuente_url` oficial (`*.europa.eu`). Una fecha que solo da la prensa o una consultora no
   entra: se queda en «Sin fecha oficial».
3. Si cambia la etapa (por ejemplo, el Parlamento aprueba su posición), actualiza `etapas`.
   La prueba de coherencia avisa si el orden no cuadra.
4. Añade una entrada a `historial` y pon `fecha_verificacion` a hoy.
5. Si la Comisión, el Parlamento o el Consejo cambian el texto, revisa la tabla `cambios`.

Para añadir un expediente nuevo: copia la forma de uno existente y añade su ficha a `FUENTES`
en `scripts/vigilancia.py`, con `desde: "Status"` y `hasta: "Transparency"` (hay una prueba que
lo exige). Cuando se publique en el DOUE, sácalo de `propuestas.json`, pasa sus fechas a
`plazos.json` y menciónalo en «Ya adoptado» de la página.

## 5. Añadir un servicio externo

La CSP bloquea todo lo que no esté en la lista. Para añadir un script, un iframe o una API de
otro dominio, edita `security.csp` en `astro.config.mjs`:

| Qué añades | Dónde |
|---|---|
| Un `<script src>` externo | `scriptDirective.resources` |
| Un `<iframe>` | `frame-src` |
| Una llamada `fetch` o un píxel | `connect-src` o `img-src` |
| Un formulario que envía a otro dominio | `form-action` |

Después, abre la página con `npm run build && npm run preview` y mira la consola del navegador:
un bloqueo de la CSP sale ahí en rojo. Añade el servicio también a `src/pages/privacidad.astro`.

## 6. Actualizar dependencias

Dependabot abre los PR una vez al mes. El workflow «Pruebas» se ejecuta en cada uno.

- Verde y actualización menor o de parche → se puede fusionar.
- Salto de versión mayor (Astro, TypeScript) → pruébalo antes en local con `npm run verificar` y
  abre el sitio con `npm run preview`.
- Astro pide una versión mínima de Node (está en el README). Si el build falla solo en GitHub,
  mira primero la versión de Node del workflow.

## 7. Publicar una versión (con DOI de Zenodo)

1. Sube `version` y `date-released` en `CITATION.cff`.
2. Añade la versión al «Historial de versiones» del README.
3. `npm run verificar`, commit y subida a `main`.
4. En GitHub → Releases → «Draft a new release»: etiqueta nueva sobre `main`. Zenodo archiva la
   versión en unos minutos.

El DOI de `src/config.ts` es el de «todas las versiones» y no cambia.

## 8. Si algo falla

| Síntoma | Causa habitual |
|---|---|
| El build falla con `Enlace con https://` | Una URL de los datos no empieza por `https://` |
| El build falla con `InvalidContentEntryDataError` | Falta un campo o tiene un valor fuera del esquema (`src/content.config.ts`) |
| Un botón o un filtro no hace nada en la web | Un script `is:inline` o un servicio externo sin declarar: mira la consola |
| `/buscar/` no encuentra nada en `npm run dev` | Normal: el índice solo existe tras `npm run build` |
| Una prueba dice «rol desconocido» o «clase desconocida» | Has usado un rol o una clase nuevos en un plazo: receta 4 |
| La web publicada no cambia tras subir | Mira en GitHub → Actions si «Publicar web en GitHub Pages» ha terminado |
