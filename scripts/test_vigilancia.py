#!/usr/bin/env python3
"""Pruebas del extractor y del resumen de cambios de la vigilancia. No usan la red.

Ejecución:  python -m unittest discover -s scripts -p "test_*.py"
"""
import json
import pathlib
import sys
import unittest

RAIZ = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))

import vigilancia  # noqa: E402

PAGINA = """
<html><body class="cookies-enabled">
  <header>Menú</header>
  <div id="cookie-banner">Usamos cookies. Aceptar.</div>
  <main>
    <h1>Guías</h1>
    <table>{filas}</table>
  </main>
  <footer>Pie</footer>
  <script>var x = 1;</script>
</body></html>
"""
FILA = "<tr><td>MDCG 2026-4 rev.1</td><td>Position Paper</td><td>October 2026</td></tr>"
FILA_NUEVA = "<tr><td>MDCG 2026-6</td><td>Clinical evidence for orphan IVDs</td><td>November 2026</td></tr>"


class ExtraerTexto(unittest.TestCase):
    def test_quita_plantilla_y_avisos_de_cookies(self):
        texto = vigilancia.extraer_texto(PAGINA.format(filas=FILA))
        self.assertIn("MDCG 2026-4 rev.1", texto)
        for ruido in ("Menú", "Pie", "cookies", "var x"):
            self.assertNotIn(ruido, texto)

    def test_no_borra_la_pagina_si_el_body_menciona_cookies(self):
        # <body class="cookies-enabled"> no es un aviso: el contenido tiene que seguir ahí.
        self.assertIn("Guías", vigilancia.extraer_texto(PAGINA.format(filas=FILA)))


class ResumirCambios(unittest.TestCase):
    def setUp(self):
        self.antes = vigilancia.extraer_texto(PAGINA.format(filas=FILA))
        self.ahora = vigilancia.extraer_texto(PAGINA.format(filas=FILA_NUEVA + FILA))

    def test_ensena_solo_lo_anadido(self):
        resumen = vigilancia.resumir_cambios(self.antes, self.ahora)
        self.assertEqual(len(resumen.splitlines()), 1)
        self.assertTrue(resumen.startswith("+ "))
        self.assertIn("MDCG 2026-6 Clinical evidence for orphan IVDs November 2026", resumen)

    def test_ensena_lo_quitado(self):
        resumen = vigilancia.resumir_cambios(self.ahora, self.antes)
        self.assertTrue(resumen.startswith("- "))
        self.assertIn("MDCG 2026-6", resumen)

    def test_un_cambio_al_final_de_una_pagina_larga_no_se_pierde(self):
        # El fallo que tapó la MDCG 2026-6: la página era una sola «frase» enorme y el diff
        # se cortaba antes de llegar al cambio.
        relleno = " ".join(f"palabra{i}" for i in range(5000))
        resumen = vigilancia.resumir_cambios(relleno + " fin", relleno + " MDCG 2026-6 fin")
        self.assertIn("MDCG 2026-6", resumen)
        self.assertLessEqual(len(resumen), vigilancia.MAX_RESUMEN + 100)

    def test_muchos_cambios_se_recortan_y_se_avisa(self):
        antes = " ".join(f"a{i} comun{i}" for i in range(600))
        ahora = " ".join(f"b{i} comun{i}" for i in range(600))
        resumen = vigilancia.resumir_cambios(antes, ahora)
        self.assertIn("fragmentos en total", resumen)
        self.assertLessEqual(len(resumen), vigilancia.MAX_RESUMEN + 100)


class Recortar(unittest.TestCase):
    FICHA = ("Basic information Status Awaiting committee decision Key events 16/12/2025 "
             "Legislative proposal published Transparency Meetings 21/10/2026 MedTech Europe")

    def test_deja_solo_el_trozo_entre_las_marcas(self):
        texto = vigilancia.recortar(self.FICHA, "Status", "Transparency")
        self.assertTrue(texto.startswith("Status Awaiting"))
        self.assertIn("Legislative proposal published", texto)
        self.assertNotIn("MedTech Europe", texto)  # las reuniones con grupos de interés no cuentan

    def test_si_falta_una_marca_no_recorta_ese_lado(self):
        self.assertEqual(vigilancia.recortar(self.FICHA, "No existe", None), self.FICHA)
        self.assertTrue(vigilancia.recortar(self.FICHA, "Status", "No existe").endswith("MedTech Europe"))

    def test_sin_marcas_devuelve_el_texto(self):
        self.assertEqual(vigilancia.recortar(self.FICHA), self.FICHA)


class FuentesVigiladas(unittest.TestCase):
    def test_cada_expediente_del_rastreador_esta_vigilado(self):
        propuestas = json.loads((RAIZ / "src" / "data" / "propuestas.json").read_text(encoding="utf-8"))
        urls = [f["url"] for f in vigilancia.FUENTES]
        for p in propuestas:
            self.assertIn(p["ficha_oficial"], urls, f"{p['id']}: añade su ficha a FUENTES en vigilancia.py")

    def test_slugs_unicos(self):
        slugs = [f["slug"] for f in vigilancia.FUENTES]
        self.assertEqual(len(slugs), len(set(slugs)))


if __name__ == "__main__":
    unittest.main()
