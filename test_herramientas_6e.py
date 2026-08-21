import asyncio

from playwright.async_api import async_playwright

BASE = "http://localhost:8080"


async def sin_desborde(page, nombre, ancho=320):
    await page.set_viewport_size({"width": ancho, "height": 900})
    overflow = await page.evaluate(
        "document.documentElement.scrollWidth - document.documentElement.clientWidth"
    )
    assert overflow <= 1, f"Desborde en {nombre} a {ancho}px: {overflow}"
    print(f"OK: sin desborde horizontal en {nombre} a {ancho}px")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()

        # ---------- Creador de CV ----------
        page = await context.new_page()
        await page.goto(f"{BASE}/herramientas/creador-cv.html")

        # Sin nombre -> debe avisar el error y no intentar generar nada
        await page.click("#btn-cv-generar")
        error = page.locator("#cv-error")
        await error.wait_for(state="visible", timeout=5000)
        assert "nombre" in (await error.inner_text()).lower()
        print("OK: sin nombre, avisa el error y no genera el PDF")

        # Arranca con un bloque de experiencia y uno de educación ya listos
        assert await page.locator("#cv-lista-experiencia .pub-entrada-repetible").count() == 1
        assert await page.locator("#cv-lista-educacion .pub-entrada-repetible").count() == 1
        print("OK: el formulario arranca con un bloque de experiencia y uno de educación")

        # Agregar un segundo bloque de experiencia
        await page.click("#btn-cv-agregar-experiencia")
        await page.wait_for_function(
            "document.querySelectorAll('#cv-lista-experiencia .pub-entrada-repetible').length === 2"
        )
        print("OK: se puede agregar un segundo bloque de experiencia")

        # Quitar el bloque recién agregado
        await page.locator("#cv-lista-experiencia .pub-entrada-repetible-quitar").last.click()
        await page.wait_for_function(
            "document.querySelectorAll('#cv-lista-experiencia .pub-entrada-repetible').length === 1"
        )
        print("OK: quitar un bloque de experiencia lo saca del formulario")

        await page.fill("#cv-nombre", "María Fernández")
        await page.fill("#cv-puesto", "Diseñadora gráfica freelance")
        await page.fill("#cv-correo", "maria@ejemplo.com")
        await page.fill("#cv-resumen", "Diseñadora con 5 años de experiencia en branding.")
        exp = page.locator("#cv-lista-experiencia .pub-entrada-repetible").first
        await exp.locator('[data-campo="puesto"]').fill("Diseñadora")
        await exp.locator('[data-campo="empresa"]').fill("Estudio Creativo")
        edu = page.locator("#cv-lista-educacion .pub-entrada-repetible").first
        await edu.locator('[data-campo="titulo"]').fill("Lic. en Diseño Gráfico")
        await page.fill("#cv-habilidades", "Illustrator, Branding, Photoshop")

        # Sin internet en este entorno de pruebas: jsPDF no carga -> toast de error
        await page.click("#btn-cv-generar")
        await page.wait_for_selector(".toast.error.show", timeout=8000)
        texto_error = await page.locator(".toast.error").inner_text()
        print("OK: sin internet, avisa con un toast en vez de trabarse ->", texto_error[:60])

        await sin_desborde(page, "creador de CV")

        # ---------- Creador de diploma ----------
        page2 = await context.new_page()
        await page2.goto(f"{BASE}/herramientas/creador-diploma.html")

        await page2.click("#btn-dip-generar")
        error2 = page2.locator("#dip-error")
        await error2.wait_for(state="visible", timeout=5000)
        assert "destinatario" in (await error2.inner_text()).lower()
        print("OK: sin destinatario, avisa el error y no genera el PDF")

        await page2.fill("#dip-destinatario", "Juan Pérez")
        await page2.fill("#dip-motivo", "Completar el curso de Diseño Web Básico")
        await page2.fill("#dip-emisor", "Academia Digital RD")
        await page2.select_option("#dip-estilo", "azul")

        await page2.click("#btn-dip-generar")
        await page2.wait_for_selector(".toast.error.show", timeout=8000)
        print("OK: sin internet, avisa con un toast en vez de trabarse")

        await sin_desborde(page2, "creador de diploma")

        # ---------- Ambas aparecen en el listado público de herramientas ----------
        page3 = await context.new_page()
        await page3.goto(f"{BASE}/herramientas.html")
        for href in ["creador-cv.html", "creador-diploma.html"]:
            await page3.wait_for_selector(f'a.pub-tarjeta-herramienta[href="herramientas/{href}"]')
        print("OK: las 2 herramientas de la fase 6e aparecen en el listado público")

        await browser.close()

    print("\nTODAS LAS PRUEBAS DE LA FASE 6e PASARON")


if __name__ == "__main__":
    asyncio.run(main())
