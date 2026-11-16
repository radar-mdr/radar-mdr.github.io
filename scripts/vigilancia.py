#!/usr/bin/env python3
"""Vigilancia de fuentes regulatorias del Radar MDR × AI Act.

Descarga cada URL, extrae el texto principal (sin menús, scripts ni pies),
lo compara con el snapshot anterior (vigilancia/snapshots/) y, si hay cambios,
escribe lo añadido y lo quitado en vigilancia/pendiente_issue.md para que el
workflow de GitHub Actions abra un issue automáticamente.

Primera ejecución: solo siembra los snapshots (no abre issue).
Ejecución local:  python scripts/vigilancia.py
"""
from __future__ import annotations

import difflib
import pathlib
import re
import sys

import requests
from bs4 import BeautifulSoup

# Fuentes vigiladas: 8 páginas generales y la ficha de cada expediente de «En tramitación».
# Añade o quita según el ruido observado. Opcional: «desde» y «hasta» limitan la comparación
# a un trozo de la página (ver recortar).
# NANDO y el DOUE cambian por diseño casi a diario: vigílalos a mano de momento.
FUENTES = [
    {
        "slug": "mdcg-guias",
        "nombre": "Índice de guías MDCG (Comisión Europea)",
        "url": "https://health.ec.europa.eu/medical-devices-sector/new-regulations/guidance-mdcg-endorsed-documents-and-other-guidance_en",
    },
    {
        "slug": "eudamed",
        "nombre": "EUDAMED — página oficial",
        "url": "https://health.ec.europa.eu/medical-devices-eudamed/overview_en",
    },
    {
        "slug": "ai-act",
        "nombre": "AI Act — Comisión Europea (AI Office)",
        "url": "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    },
    {
        "slug": "aemps-ps",
        "nombre": "AEMPS — Productos sanitarios",
        "url": "https://www.aemps.gob.es/productos-sanitarios/",
    },
    {
        "slug": "aesia",
        "nombre": "AESIA",
        "url": "https://aesia.digital.gob.es/",
    },
    {
        "slug": "team-nb",
        "nombre": "Team-NB",
        "url": "https://www.team-nb.org/",
    },
    {
        "slug": "fda-qmsr",
        "nombre": "FDA — QMSR",
        "url": "https://www.fda.gov/medical-devices/postmarket-requirements-devices/quality-management-system-regulation-qmsr",
    },
    {
        "slug": "medtech-europe",
        "nombre": "MedTech Europe — News",
        "url": "https://www.medtecheurope.org/news-and-events/news/",
    },
    # Expedientes de «En tramitación» (src/data/propuestas.json). De cada ficha del
    # Observatorio Legislativo solo cuenta del estado a los documentos: la lista de reuniones
    # con grupos de interés («Transparency») cambia casi a diario y no es un paso del expediente.
    {
        "slug": "oeil-revision-mdr-ivdr",
        "nombre": "Expediente 2025/0404(COD): revisión del MDR y el IVDR",
        "url": "https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=2025/0404(COD)",
        "desde": "Status",
        "hasta": "Transparency",
    },
    {
        "slug": "oeil-omnibus-digital",
        "nombre": "Expediente 2025/0360(COD): Ómnibus digital",
        "url": "https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=2025/0360(COD)",
        "desde": "Status",
        "hasta": "Transparency",
    },
    {
        "slug": "oeil-biotech-act",
        "nombre": "Expediente 2025/0406(COD): Biotech Act",
        "url": "https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=2025/0406(COD)",
        "desde": "Status",
        "hasta": "Transparency",
    },
]

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SNAP = RAIZ / "vigilancia" / "snapshots"
SNAP.mkdir(parents=True, exist_ok=True)
PENDIENTE = RAIZ / "vigilancia" / "pendiente_issue.md"

UA = {"User-Agent": "Mozilla/5.0 (RadarMDRxAIAct/0.1; vigilancia de fuentes publicas; contacto en el repo)"}


# Avisos de cookies y de consentimiento: cambian solos y no son contenido.
RUIDO = re.compile(r"cookie|consent|gdpr", re.I)

# Tope del resumen de cada fuente y de cada fragmento dentro del issue.
MAX_RESUMEN = 3000
MAX_FRAGMENTO = 400


def extraer_texto(html: str) -> str:
    """Texto principal de la página, sin ruido de plantilla."""
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "form", "noscript", "svg", "aside"]):
        tag.decompose()
    for tag in soup.find_all(attrs={"id": RUIDO}) + soup.find_all(attrs={"class": RUIDO}):
        # Nunca el contenedor de la página: hay webs que marcan <body> con «cookies-enabled».
        if tag.decomposed or tag.name in ("html", "body", "main") or tag.find("main"):
            continue
        tag.decompose()
    principal = soup.find("main") or soup.body or soup
    texto = principal.get_text(" ", strip=True)
    return re.sub(r"\s+", " ", texto)


def recortar(texto: str, desde: str | None = None, hasta: str | None = None) -> str:
    """Solo la parte de la página entre dos marcas (incluida la primera).

    Si una marca no aparece, no se recorta por ese lado: mejor un aviso de más que dejar
    de vigilar en silencio si la web cambia sus títulos.
    """
    inicio = texto.find(desde) if desde else -1
    if inicio > 0:
        texto = texto[inicio:]
    fin = texto.find(hasta, len(desde or "")) if hasta else -1
    if fin > 0:
        texto = texto[:fin]
    return texto.strip()


def resumir_cambios(anterior: str, actual: str) -> str:
    """Solo lo que se ha añadido (+) y quitado (-), con unas palabras de contexto.

    Se compara palabra a palabra: muchas páginas apenas llevan puntos, y un diff por
    frases enseñaba un bloque enorme que tapaba el cambio real.
    """
    a, b = anterior.split(), actual.split()
    lineas: list[str] = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op == "equal":
            continue
        contexto = " ".join(a[max(0, i1 - 6):i1])
        if i2 > i1:
            lineas.append(f"- …{contexto} [{' '.join(a[i1:i2])[:MAX_FRAGMENTO]}]")
        if j2 > j1:
            lineas.append(f"+ …{contexto} [{' '.join(b[j1:j2])[:MAX_FRAGMENTO]}]")
    resumen = "\n".join(lineas)
    if len(resumen) > MAX_RESUMEN:
        resumen = resumen[:MAX_RESUMEN] + f"\n… ({len(lineas)} fragmentos en total; mira la página)"
    return resumen


def main() -> int:
    novedades: list[tuple[dict, str]] = []

    for f in FUENTES:
        try:
            r = requests.get(f["url"], headers=UA, timeout=30)
            r.raise_for_status()
        except Exception as e:  # noqa: BLE001 — queremos seguir con el resto
            print(f"[aviso] {f['slug']}: no se pudo descargar ({e})", file=sys.stderr)
            continue

        actual = recortar(extraer_texto(r.text), f.get("desde"), f.get("hasta"))
        ruta = SNAP / f"{f['slug']}.txt"
        anterior = ruta.read_text(encoding="utf-8") if ruta.exists() else None
        ruta.write_text(actual, encoding="utf-8")

        if anterior is None:
            print(f"[semilla] {f['slug']}: snapshot inicial guardado")
        elif actual != anterior:
            novedades.append((f, resumir_cambios(anterior, actual)))
            print(f"[cambio] {f['slug']}")
        else:
            print(f"[ok] {f['slug']}: sin cambios")

    if novedades:
        cuerpo = ["## Cambios detectados por la vigilancia automática", ""]
        for f, diff in novedades:
            cuerpo += [f"### {f['nombre']}", f"URL: {f['url']}", "", "```diff", diff, "```", ""]
        cuerpo += [
            "---",
            "_Pasos: 1) revisar el diff, 2) actualizar `src/data/*.json` con `fecha_verificacion` y `nota_cambio`, 3) publicar la alerta (LinkedIn/newsletter)._",
        ]
        PENDIENTE.write_text("\n".join(cuerpo), encoding="utf-8")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
