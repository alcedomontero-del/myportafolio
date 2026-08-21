import asyncio
import os
import tempfile

from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"

def crear_imagen_prueba(ruta, ancho=800, alto=600):
    img = Image.new("RGB", (ancho, alto), (30, 120, 200))
    dibujo = ImageDraw.Draw(img)
    for x in range(0, ancho, 20):
        dibujo.line([(x, 0), (x, alto)], fill=(255, 255, 255), width=1)
    img.save(ruta, quality=95)

async def sin_desborde(page, nombre, ancho=320):
    await page.set_viewport_size({"width": ancho, "height": 900})
    overflow = await page.evaluate(
        "document.documentElement.scrollWidth - document.documentElement.clientWidth"
    )
    assert overflow <= 1, f"Desborde en {nombre} a {ancho}px: {overflow}"
    print(f"OK: sin desborde horizontal en {nombre} a {ancho}px")

async def main():
    with tempfile.TemporaryDirectory() as tmp:
        ruta_imagen = os.path.join(tmp, "prueba.jpg")
        crear_imagen_prueba(ruta_imagen)

        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context()

            # ---------- Compresor de imágenes ----------
            page = await context.new_page()
            await page.goto(f"{BASE}/herramientas/comprimir-imagen.html")
            await page.set_input_files("#comp-archivo", ruta_imagen)
            await page.wait_for_selector("#comp-controles:not([hidden])")
            print("OK: imagen cargada, controles de compresión visibles")

            await page.fill("#comp-calidad", "30")
            await page.select_option("#comp-formato", "image/jpeg")
            await page.click("#btn-comp-generar")
            await page.wait_for_selector("#resultado-comp.mostrar")

            peso_original = await page.inner_text("#comp-peso-original")
            peso_resultado = await page.inner_text("#comp-peso-resultado")
            ahorro = await page.inner_text("#comp-ahorro")
            assert peso_original != "—" and peso_resultado != "—"
            assert int(ahorro.replace("%", "")) > 0, ahorro
            print(f"OK: comprimida de {peso_original} a {peso_resultado} ({ahorro} de ahorro)")

            href_descarga = await page.get_attribute("#btn-comp-descargar", "href")
            assert href_descarga.startswith("blob:")
            print("OK: link de descarga listo (blob de la imagen comprimida)")
            await sin_desborde(page, "compresor de imágenes")

            # ---------- Redimensionar ----------
            page2 = await context.new_page()
            await page2.goto(f"{BASE}/herramientas/recortar-imagen.html")
            await page2.set_input_files("#rec-archivo", ruta_imagen)
            await page2.wait_for_selector("#rec-area-trabajo:not([hidden])")
            tamano_original = await page2.inner_text("#rec-tamano-original")
            assert "800" in tamano_original and "600" in tamano_original
            print(f"OK: imagen cargada, tamaño detectado -> {tamano_original}")

            await page2.fill("#rec-ancho", "400")
            alto_calculado = await page2.input_value("#rec-alto")
            assert alto_calculado == "300", alto_calculado
            print(f"OK: con proporción activa, ancho 400 calcula alto {alto_calculado} automáticamente")

            await page2.click("#btn-rec-redimensionar")
            await page2.wait_for_selector("#resultado-rec.mostrar")
            tamano_resultado = await page2.inner_text("#rec-tamano-resultado")
            assert "400" in tamano_resultado and "300" in tamano_resultado, tamano_resultado
            print(f"OK: imagen redimensionada -> {tamano_resultado}")

            # ---------- Recortar ----------
            await page2.locator("#rec-canvas").scroll_into_view_if_needed()
            deshabilitado_antes = await page2.is_disabled("#btn-rec-recortar")
            assert deshabilitado_antes
            print("OK: el botón 'Recortar selección' arranca deshabilitado sin selección")

            caja = await page2.eval_on_selector(
                "#rec-canvas",
                "el => { const r = el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; }",
            )
            x1 = caja["x"] + caja["w"] * 0.2
            y1 = caja["y"] + caja["h"] * 0.2
            x2 = caja["x"] + caja["w"] * 0.7
            y2 = caja["y"] + caja["h"] * 0.6
            await page2.mouse.move(x1, y1)
            await page2.mouse.down()
            await page2.mouse.move((x1 + x2) / 2, (y1 + y2) / 2)
            await page2.mouse.move(x2, y2)
            await page2.mouse.up()

            habilitado = await page2.is_enabled("#btn-rec-recortar")
            assert habilitado
            print("OK: al arrastrar sobre el lienzo, se habilita 'Recortar selección'")

            await page2.click("#btn-rec-recortar")
            await page2.wait_for_selector("#resultado-rec.mostrar")
            tamano_recorte = await page2.inner_text("#rec-tamano-resultado")
            print(f"OK: recorte generado -> {tamano_recorte}")

            href_recorte = await page2.get_attribute("#btn-rec-descargar", "href")
            assert href_recorte.startswith("data:image/png")
            print("OK: link de descarga del recorte listo (PNG)")

            await sin_desborde(page2, "redimensionador/recortador de imágenes")

            await browser.close()
            print("\nTODAS LAS PRUEBAS DE LA FASE 6c PASARON")

asyncio.run(main())
