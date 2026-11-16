# Radar MDR × AI Act: instrucciones para asistentes de IA

Observatorio en español de plazos regulatorios (MDR, IVDR, AI Act, EHDS, QMSR). Sitio estático
con Astro, publicado en GitHub Pages. El valor del proyecto es que cada dato es fiable: lleva
fuente oficial, fecha de verificación e historial. Un dato inventado o sin verificar hace más
daño que una función que falta.

Las tareas habituales, paso a paso, están en [MANTENIMIENTO.md](MANTENIMIENTO.md).

## Antes de dar nada por terminado

```bash
npm run verificar
```

Comprueba tipos, construye el sitio y pasa las pruebas de `tests/`. Si tocaste
`scripts/vigilancia.py`, ejecuta también:

```bash
python -m unittest discover -s scripts -p "test_*.py"
```

Si una prueba falla, lo normal es que el cambio esté mal, no la prueba. No la borres ni la
relajes para que pase: lee el mensaje, que explica qué regla se ha roto.

## Reglas de los datos (`src/data/*.json`)

1. Ningún dato sin **fuente primaria** (EUR-Lex, health.ec.europa.eu, BOE, AEMPS, NANDO, FDA) y
   sin `fecha_verificacion`. Un resumen de una consultora, de un blog o de otra IA no es una
   fuente: sirve de pista y luego se comprueba en el documento oficial.
2. Si no puedes abrir la fuente oficial y leer el dato, no lo añadas. Dilo y déjalo pendiente.
3. Nunca se sobrescribe un plazo sin rastro: cada cambio añade una entrada a `historial` con
   `fecha`, `campo`, `valor_anterior`, `valor_nuevo`, `motivo` y `fuente_url`.
4. Un error de interpretación propio va además a `erratas.json`, con causa raíz y acción
   correctiva.
5. Lo que solo es una propuesta legislativa va a `propuestas.json`, nunca a `plazos.json` como
   si fuera una fecha vigente.
6. Las fichas de guías (`guias.json`) se escriben leyendo el PDF oficial: unas 300 palabras,
   Markdown puro (sin HTML) y sin copiar párrafos enteros.

## Reglas del código

- **CSP.** Cada página lleva una Content-Security-Policy que Astro genera con el hash de cada
  script y estilo (`security.csp` en `astro.config.mjs`). Por eso:
  - los scripts de página son `<script>` normales; nunca `is:inline` ni `define:vars`;
  - no se usan atributos `style=""` ni `onclick=""`;
  - un servicio externo nuevo (script, iframe, API) se añade a `astro.config.mjs`.
- `getCollection` se importa de `src/lib/coleccion.ts`, no de `astro:content`: conserva el orden
  de los JSON, que es editorial.
- La lógica que se pueda equivocar va en `src/lib/` como funciones puras con pruebas
  (`asistente.ts`, `ics.ts`). Las páginas `.astro` solo pintan.
- Si añades a un plazo un rol o una clase nuevos, el asistente «¿Qué me aplica?» tiene que
  conocerlos (`src/lib/asistente.ts`); hay una prueba que lo exige.
- Comentarios y nombres en español, como el resto del código. Los comentarios explican el
  porqué, no repiten lo que hace la línea.
- Sin servicios de pago ni dependencias nuevas si se puede evitar: el proyecto cuesta 0 €.

## Privacidad y publicación

- El repositorio es **público**. No se sube nada personal del autor (correos personales, datos
  fiscales, de salud o de estudios que no estén ya en `/sobre-mi/`), ni listas de tareas para él.
- Las notas internas y las tareas pendientes del autor van a la carpeta `privado/`, que está
  fuera de Git. Si no existe, créala y no la añadas a `.gitignore` (se excluye en
  `.git/info/exclude`).
- Los commits van con el correo `noreply` de GitHub del autor. Compruébalo con
  `git config user.email` antes del primer commit.
- Subir a `main` publica la web. No hagas `git push` ni cambies etiquetas sin que el autor lo
  pida expresamente, y nunca con `--force`.

## Mapa

| Dónde | Qué |
|---|---|
| `src/data/*.json` | Los datos. Esquemas en `src/content.config.ts` |
| `src/pages/` | Una página por archivo. `index.astro` es la cronología |
| `src/pages/que-me-aplica.astro` + `src/lib/asistente.ts` | Asistente de plazos por perfil |
| `src/lib/ics.ts` | Calendario `.ics` (general y del asistente) |
| `src/pages/en-tramitacion.astro` + `src/lib/tramitacion.ts` | Rastreador de propuestas legislativas |
| `src/components/ListaEspera.astro` | Alta en la lista de espera de Radar Pro (Tally) |
| `src/config.ts` | Dominio, correo de contacto, DOI e identificadores de servicios |
| `scripts/vigilancia.py` | Vigilancia diaria de fuentes; abre un issue si algo cambia |
| `tests/` | Pruebas de datos, del asistente y del sitio construido |
| `.github/workflows/` | Publicación, vigilancia y pruebas |
