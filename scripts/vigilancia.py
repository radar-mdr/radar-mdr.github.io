#!/usr/bin/env python3
"""Vigilancia de fuentes regulatorias del Radar MDR × AI Act.

Descarga cada URL, extrae el texto principal (sin menús, scripts ni pies),
lo compara con el snapshot anterior (vigilancia/snapshots/) y, si hay cambios,
escribe un resumen con diff en vigilancia/pendiente_issue.md para que el
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

# Fuentes vigiladas. Empieza con estas 8; añade/quita según ruido observado.
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
]

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SNAP = RAIZ / "vigilancia" / "snapshots"
SNAP.mkdir(parents=True, exist_ok=True)
PENDIENTE = RAIZ / "vigilancia" / "pendiente_issue.md"

UA = {"User-Agent": "Mozilla/5.0 (RadarMDRxAIAct/0.1; vigilancia de fuentes publicas; contacto en el repo)"}


def extraer_texto(html: str) -> str:
    """Texto principal de la página, sin ruido de plantilla."""
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "form", "noscript", "svg", "aside"]):
        tag.decompose()
    principal = soup.find("main") or soup.body or soup
    texto = principal.get_text(" ", strip=True)
    return re.sub(r"\s+", " ", texto)


def main() -> int:
    novedades: list[tuple[dict, str]] = []

    for f in FUENTES:
        try:
            r = requests.get(f["url"], headers=UA, timeout=30)
            r.raise_for_status()
        except Exception as e:  # noqa: BLE001 — queremos seguir con el resto
            print(f"[aviso] {f['slug']}: no se pudo descargar ({e})", file=sys.stderr)
            continue

        actual = extraer_texto(r.text)
        ruta = SNAP / f"{f['slug']}.txt"
        anterior = ruta.read_text(encoding="utf-8") if ruta.exists() else None
        ruta.write_text(actual, encoding="utf-8")

        if anterior is None:
            print(f"[semilla] {f['slug']}: snapshot inicial guardado")
        elif actual != anterior:
            diff = "\n".join(
                difflib.unified_diff(
                    anterior.split(". "),
                    actual.split(". "),
                    fromfile="antes",
                    tofile="ahora",
                    lineterm="",
                    n=1,
                )
            )
            novedades.append((f, diff[:3000]))
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
