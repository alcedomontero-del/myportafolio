import asyncio
import os
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"


def crear_pdf_prueba(ruta):
    # No hace falta un PDF válido de verdad: el input de archivo y la
    # subida (FileReader -> base64 en modo local) no validan contenido,
    # solo necesitan bytes reales en disco.
    with open(ruta, "wb") as f:
        f.write(b"%PDF-1.4\n%fake pdf for test\n")


async def login(page):
    await page.goto(f"{BASE}/login.html")
    await page.fill("#email", "admin@demo.com")
    await page.fill("#password", "demo1234")
    await page.click("#btn-login")
    await page.wait_for_url("**/admin.html")
    await page.wait_for_selector("#app-admin:not([hidden])")


async def main():
    ruta_pdf = "/tmp/cv-prueba.pdf"
    ruta_pdf2 = "/tmp/app-prueba.pdf"
    crear_pdf_prueba(ruta_pdf)
    crear_pdf_prueba(ruta_pdf2)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()
        page.on("console", lambda msg: print("BROWSER:", msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: print("PAGEERROR:", exc))

        await login(page)
        await page.click('.lcars-nav-btn[data-area="descargables"]')
        print("OK: entré al área Descargables")

        # ---------- El CV de ejemplo aparece pero sin archivo ----------
        item_demo = page.locator('#lista-descargables .lcars-item', has_text="CV — Currículum")
        await item_demo.wait_for()
        assert "sin archivo" in await item_demo.locator(".lcars-item-meta").inner_text()
        print("OK: el CV de ejemplo aparece marcado como 'sin archivo' hasta que se suba uno real")

        # ---------- Crear: subir un archivo real marcado como CV ----------
        await page.fill("#descargable-nombre", "CV actualizado 2026")
        await page.fill("#descargable-descripcion", "Mi currículum más reciente en PDF.")
        await page.set_input_files("#descargable-archivo", ruta_pdf)
        await page.check("#descargable-es-cv")
        await page.click("#btn-guardar-descargable")
        item_nuevo = page.locator('#lista-descargables .lcars-item', has_text="CV actualizado 2026")
        await item_nuevo.wait_for()
        assert "archivo cargado" in await item_nuevo.locator(".lcars-item-meta").inner_text()
        assert "Marcado como CV" in await item_nuevo.locator(".lcars-item-meta").inner_text()
        print("OK: archivo con CV subido y marcado correctamente en la lista")

        # ---------- Crear: una app propia (no CV) ----------
        await page.fill("#descargable-nombre", "Convertidor de moneda offline")
        await page.fill("#descargable-descripcion", "App de escritorio gratuita, código abierto.")
        await page.set_input_files("#descargable-archivo", ruta_pdf2)
        await page.click("#btn-guardar-descargable")
        item_app = page.locator('#lista-descargables .lcars-item', has_text="Convertidor de moneda offline")
        await item_app.wait_for()
        assert "Marcado como CV" not in await item_app.locator(".lcars-item-meta").inner_text()
        print("OK: app propia (sin marcar como CV) creada correctamente")

        # ---------- Sin archivo y sin edición: no debe guardar ----------
        await page.fill("#descargable-nombre", "Archivo sin subir")
        await page.fill("#descargable-descripcion", "No debería guardarse.")
        await page.click("#btn-guardar-descargable")
        await page.wait_for_selector("text=Elige un archivo PDF o ZIP para subir")
        conteo = await page.locator('#lista-descargables .lcars-item', has_text="Archivo sin subir").count()
        assert conteo == 0
        print("OK: sin elegir archivo (y sin estar editando), avisa el error y no guarda")

        # ---------- Editar: cambiar nombre sin tocar el archivo ----------
        await item_app.locator('[data-accion="editar"]').click()
        await page.fill("#descargable-nombre", "Convertidor de moneda offline v2")
        await page.click("#btn-guardar-descargable")
        await page.wait_for_selector("#lista-descargables >> text=Convertidor de moneda offline v2")
        print("OK: archivo editado sin volver a subirlo, conserva el archivo anterior")

        # ---------- Eliminar ----------
        item_editar = page.locator('#lista-descargables .lcars-item', has_text="Convertidor de moneda offline v2")
        page.once("dialog", lambda dialog: asyncio.create_task(dialog.accept()))
        await item_editar.locator('[data-accion="eliminar"]').click()
        await page.wait_for_timeout(1000)
        restante = await page.locator('#lista-descargables .lcars-item', has_text="Convertidor de moneda offline v2").count()
        if restante:
            print("DEBUG lista tras eliminar:", await page.locator("#lista-descargables").inner_text())
        assert restante == 0
        print("OK: archivo eliminado")

        # ---------- Responsive admin ----------
        await page.set_viewport_size({"width": 320, "height": 800})
        desborde = await page.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        assert desborde == 0, f"Desborde de {desborde}px en admin Descargables a 320px"
        print("OK: sin desborde horizontal en admin Descargables a 320px")

        # ---------- Página pública: el CV subido aparece destacado ----------
        pagina_publica = await context.new_page()
        pagina_publica.on("console", lambda msg: print("BROWSER:", msg.text) if msg.type == "error" else None)
        await pagina_publica.goto(f"{BASE}/descargables.html")
        await pagina_publica.wait_for_selector(".pub-cv-destacado")
        texto_cv = await pagina_publica.locator(".pub-cv-destacado").inner_text()
        assert "CV actualizado 2026" in texto_cv
        print("OK: CV destacado visible en la página pública")

        boton_descarga = pagina_publica.locator(".pub-cv-destacado a.pub-btn-primario")
        assert await boton_descarga.get_attribute("download") is not None
        print("OK: botón de descarga del CV tiene atributo download")

        # El demo original (sin archivo) NO debe aparecer en público
        contenido = await pagina_publica.locator("#contenedor-descargables").inner_text()
        assert "CV — Currículum" not in contenido
        print("OK: el archivo de ejemplo sin subir no aparece en la página pública")

        # ---------- Nav: el link a Descargables existe en index y herramientas ----------
        await pagina_publica.goto(f"{BASE}/index.html")
        assert await pagina_publica.locator('.pub-nav a[href="descargables.html"]').count() == 1
        await pagina_publica.goto(f"{BASE}/herramientas.html")
        assert await pagina_publica.locator('.pub-nav a[href="descargables.html"]').count() == 1
        print("OK: el link 'Descargables' aparece en la navegación de index y herramientas")

        # ---------- Responsive público ----------
        await pagina_publica.goto(f"{BASE}/descargables.html")
        for ancho in (375, 360, 320):
            await pagina_publica.set_viewport_size({"width": ancho, "height": 800})
            desborde = await pagina_publica.evaluate(
                "document.documentElement.scrollWidth - document.documentElement.clientWidth"
            )
            assert desborde == 0, f"Desborde de {desborde}px en público a {ancho}px"
        print("OK: sin desborde horizontal en la página pública de Descargables (375/360/320px)")

        await browser.close()

    os.remove(ruta_pdf)
    os.remove(ruta_pdf2)
    print("\nTODAS LAS PRUEBAS DE DESCARGABLES PASARON")


if __name__ == "__main__":
    asyncio.run(main())
