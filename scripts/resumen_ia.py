#!/usr/bin/env python3
"""Opcional: añade al issue un borrador de alerta en español redactado por Claude.

Requiere el secreto ANTHROPIC_API_KEY en GitHub (Settings → Secrets → Actions).
Coste: céntimos por ejecución con Haiku. Si no hay clave o no hay cambios,
no hace nada. El borrador SIEMPRE se revisa antes de publicar (humano en el bucle).
"""
import json
import os
import pathlib
import urllib.request

PENDIENTE = pathlib.Path(__file__).resolve().parent.parent / "vigilancia" / "pendiente_issue.md"

clave = os.environ.get("ANTHROPIC_API_KEY")
if not clave or not PENDIENTE.exists():
    raise SystemExit(0)

diffs = PENDIENTE.read_text(encoding="utf-8")[:12000]

peticion = {
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 500,
    "messages": [
        {
            "role": "user",
            "content": (
                "Eres el editor del observatorio 'Radar MDR × AI Act'. A partir de estos diffs "
                "de páginas regulatorias oficiales, redacta en español un borrador de alerta de "
                "3-5 frases, sobrio y factual, indicando qué parece haber cambiado y qué habría "
                "que verificar en la fuente oficial antes de publicar. Si los cambios parecen "
                "cosméticos (fechas de plantilla, menús, banners), dilo claramente.\n\n" + diffs
            ),
        }
    ],
}

req = urllib.request.Request(
    "https://api.anthropic.com/v1/messages",
    data=json.dumps(peticion).encode(),
    headers={
        "content-type": "application/json",
        "x-api-key": clave,
        "anthropic-version": "2023-06-01",
    },
)

with urllib.request.urlopen(req, timeout=60) as r:
    datos = json.load(r)

texto = "".join(b.get("text", "") for b in datos.get("content", []))
PENDIENTE.write_text(
    diffs + "\n\n## Borrador de alerta (generado por IA — revisar antes de publicar)\n\n" + texto + "\n",
    encoding="utf-8",
)
print("[ok] borrador de alerta añadido al issue")
