import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"

async def sin_desborde(page, nombre, ancho=320):
    await page.set_viewport_size({"width": ancho, "height": 800})
    overflow = await page.evaluate(
        "document.documentElement.scrollWidth - document.documentElement.clientWidth"
    )
    assert overflow <= 1, f"Desborde en {nombre} a {ancho}px: {overflow}"
    print(f"OK: sin desborde horizontal en {nombre} a {ancho}px")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(permissions=["clipboard-read", "clipboard-write"])

        # ---------- QR ----------
        page = await context.new_page()
        await page.goto(f"{BASE}/herramientas/qr.html")
        await page.fill("#qr-texto", "https://alcedomontero.do")
        await page.click("#btn-generar-qr")
        await page.wait_for_selector("#resultado-qr.mostrar")
        ancho_canvas = await page.locator("#qr-canvas").evaluate("el => el.width")
        assert ancho_canvas > 0
        href = await page.locator("#btn-descargar-qr").get_attribute("href")
        assert href.startswith("data:image/png")
        print("OK: QR generado, canvas con contenido y link de descarga PNG listo")
        await sin_desborde(page, "generador de QR")

        # ---------- Contraseñas ----------
        page2 = await context.new_page()
        await page2.goto(f"{BASE}/herramientas/contrasenas.html")
        await page2.click("#btn-generar-pw")
        await page2.wait_for_selector("#resultado-pw.mostrar")
        clave = await page2.input_value("#pw-salida")
        assert len(clave) == 16, len(clave)
        print(f"OK: contraseña generada con la longitud pedida ({len(clave)} caracteres)")

        for casilla in ["pw-mayusculas", "pw-minusculas", "pw-numeros", "pw-simbolos"]:
            await page2.uncheck(f"#{casilla}")
        await page2.click("#btn-generar-pw")
        toast = await page2.wait_for_selector("#toast-global.show.error")
        texto_toast = await toast.inner_text()
        assert "al menos un tipo" in texto_toast
        print("OK: sin ningún tipo de carácter marcado, avisa con un toast de error")
        await sin_desborde(page2, "generador de contraseñas")

        # ---------- Contador de texto ----------
        page3 = await context.new_page()
        await page3.goto(f"{BASE}/herramientas/contador-texto.html")
        await page3.fill("#ct-texto", "Hola mundo. Esta es una prueba,\ncon dos párrafos.\n\nSegundo párrafo aquí.")
        palabras = await page3.inner_text("#ct-palabras")
        oraciones = await page3.inner_text("#ct-oraciones")
        parrafos = await page3.inner_text("#ct-parrafos")
        assert int(palabras.replace(",", "")) > 0
        assert int(oraciones) >= 2
        assert int(parrafos) >= 2
        print(f"OK: contador de texto en vivo -> {palabras} palabras, {oraciones} oraciones, {parrafos} párrafos")
        await sin_desborde(page3, "contador de texto")

        # ---------- Paleta de colores ----------
        page4 = await context.new_page()
        await page4.goto(f"{BASE}/herramientas/paleta-colores.html")
        await page4.wait_for_selector(".pub-swatch")
        n_inicial = await page4.locator(".pub-swatch").count()
        assert n_inicial == 5, n_inicial
        print(f"OK: paleta inicial generada al cargar la página ({n_inicial} colores)")

        for modo in ["analoga", "complementaria", "triada", "monocromatica"]:
            await page4.select_option("#paleta-modo", modo)
            await page4.click('#form-paleta button[type="submit"]')
            colores = await page4.locator(".pub-swatch .codigo").all_inner_texts()
            assert len(colores) == 5, (modo, colores)
            assert all(c.startswith("#") and len(c) == 7 for c in colores), colores
            print(f"OK: paleta '{modo}' genera 5 colores hex válidos -> {colores}")

        color_antes = await page4.input_value("#paleta-color-base")
        await page4.click("#btn-paleta-azar")
        color_despues = await page4.input_value("#paleta-color-base")
        assert color_antes != color_despues
        print("OK: 'Sorpréndeme' cambia el color base al azar")

        primer_swatch = page4.locator(".pub-swatch").first
        codigo_esperado = (await primer_swatch.locator(".codigo").inner_text()).strip()
        await primer_swatch.click()
        toast4 = await page4.wait_for_selector("#toast-global.show")
        texto_toast4 = await toast4.inner_text()
        assert codigo_esperado in texto_toast4
        print(f"OK: clic en un color copia su código -> '{texto_toast4}'")
        await sin_desborde(page4, "paleta de colores")

        # ---------- Convertidor de unidades ----------
        page5 = await context.new_page()
        await page5.goto(f"{BASE}/herramientas/unidades.html")
        await page5.wait_for_selector("#un-salida")

        await page5.fill("#un-valor", "10")
        resultado_m_ft = await page5.inner_text("#un-salida")
        assert abs(float(resultado_m_ft) - 32.8084) < 0.001, resultado_m_ft
        print(f"OK: longitud -> 10 m equivalen a {resultado_m_ft} ft")

        await page5.select_option("#un-categoria", "peso")
        await page5.select_option("#un-unidad-desde", "kg")
        await page5.select_option("#un-unidad-hasta", "lb")
        await page5.fill("#un-valor", "5")
        resultado_kg_lb = await page5.inner_text("#un-salida")
        assert abs(float(resultado_kg_lb) - 11.0231) < 0.01, resultado_kg_lb
        print(f"OK: peso -> 5 kg equivalen a {resultado_kg_lb} lb")

        await page5.select_option("#un-categoria", "temperatura")
        await page5.select_option("#un-unidad-desde", "c")
        await page5.select_option("#un-unidad-hasta", "f")
        await page5.fill("#un-valor", "100")
        resultado_c_f = await page5.inner_text("#un-salida")
        assert resultado_c_f == "212", resultado_c_f
        print("OK: temperatura -> 100 °C equivalen a 212 °F")

        await page5.click("#btn-un-intercambiar")
        resultado_intercambiado = await page5.inner_text("#un-salida")
        assert abs(float(resultado_intercambiado) - 37.7778) < 0.01, resultado_intercambiado
        print(f"OK: intercambiar unidades -> ahora 100 °F equivalen a {resultado_intercambiado} °C")
        await sin_desborde(page5, "convertidor de unidades")

        await browser.close()
        print("\nTODAS LAS PRUEBAS DE LA FASE 6b PASARON")

asyncio.run(main())
