import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # ---------- 1. Carga con datos de ejemplo (semilla de local-db) ----------
        await page.goto(f"{BASE}/index.html")
        await page.wait_for_selector("#contenedor-proyectos .pub-tarjeta", timeout=5000)
        tarjetas = await page.locator(".pub-tarjeta").count()
        assert tarjetas == 2, tarjetas
        print(f"OK 1: {tarjetas} proyectos de ejemplo cargados")

        # ---------- 2. El destacado aparece primero ----------
        primer_titulo = await page.locator(".pub-tarjeta h3").first.inner_text()
        assert "Sistema de reservas" in primer_titulo, primer_titulo
        print("OK 2: el proyecto destacado aparece primero ->", primer_titulo)

        # ---------- 3. Mini caso de estudio visible ----------
        texto_caso = (await page.locator(".pub-caso-estudio").first.inner_text()).lower()
        assert "necesidad" in texto_caso and "qué hice" in texto_caso and "resultado" in texto_caso
        print("OK 3: mini caso de estudio (necesidad/qué hice/resultado) visible")

        # ---------- 4. Categoría visible en la tarjeta ----------
        etiqueta = await page.locator(".pub-etiqueta-categoria").first.inner_text()
        assert etiqueta.strip() != "", etiqueta
        print("OK 4: etiqueta de categoría visible ->", etiqueta)

        # ---------- 5. Testimonios cargados ----------
        await page.wait_for_selector("#contenedor-testimonios .pub-testimonio", timeout=5000)
        testimonios_count = await page.locator(".pub-testimonio").count()
        assert testimonios_count == 1, testimonios_count
        print(f"OK 5: {testimonios_count} testimonio de ejemplo cargado")

        # ---------- 6. Punto de estado (modo local = ámbar) ----------
        clase_punto = await page.get_attribute("#punto-estado", "class")
        assert "local" in clase_punto, clase_punto
        print("OK 6: punto de estado en modo local (ámbar) ->", clase_punto)

        # hover muestra info
        await page.hover("#punto-estado")
        info = await page.locator("#info-punto").inner_text()
        assert "local" in info.lower()
        print("OK 6b: info del punto de estado al hacer hover ->", info)

        # ---------- 7. Open Graph presente ----------
        og_title = await page.get_attribute('meta[property="og:title"]', "content")
        og_desc = await page.get_attribute('meta[property="og:description"]', "content")
        assert og_title and og_desc
        print("OK 7: meta Open Graph presentes ->", og_title)

        # ---------- 8. Badge de modo en el footer ----------
        badge = await page.locator("#badge-modo .mode-badge").inner_text()
        assert "local" in badge.lower()
        print("OK 8: badge de modo visible en el footer")

        # ---------- 9. Navegación con anclas (sin recargar) ----------
        url_antes = page.url
        await page.click('a[href="#proyectos"]')
        await page.wait_for_timeout(300)
        assert page.url.startswith(url_antes)
        print("OK 9: navegación por ancla funciona")

        # ---------- 10. Responsive 320/360/375 ----------
        for ancho in [375, 360, 320]:
            await page.set_viewport_size({"width": ancho, "height": 800})
            overflow = await page.evaluate(
                "document.documentElement.scrollWidth - document.documentElement.clientWidth"
            )
            assert overflow <= 1, f"Desborde en {ancho}px: {overflow}"
            print(f"OK 10: sin desborde horizontal en {ancho}px")
        await page.set_viewport_size({"width": 1280, "height": 800})

        # ---------- 11. Estado vacío ----------
        await page.evaluate("""
            () => {
                localStorage.setItem('portafolio_proyectos', '[]');
                localStorage.setItem('portafolio_testimonios', '[]');
            }
        """)
        await page.reload()
        await page.wait_for_selector("#contenedor-proyectos .pub-estado-vacio", timeout=5000)
        await page.wait_for_selector("#contenedor-testimonios .pub-estado-vacio", timeout=5000)
        print("OK 11: estados vacíos se muestran correctamente en la página pública")

        # ---------- 12. Integración real: lo que se crea en admin aparece en público ----------
        await page.evaluate("""
            () => {
                localStorage.removeItem('portafolio_proyectos');
                localStorage.removeItem('portafolio_categorias');
                localStorage.removeItem('portafolio_testimonios');
            }
        """)
        admin_page = await context.new_page()
        await admin_page.goto(f"{BASE}/login.html")
        await admin_page.fill("#email", "admin@demo.com")
        await admin_page.fill("#password", "demo1234")
        await admin_page.click("#btn-login")
        await admin_page.wait_for_url("**/admin.html")
        await admin_page.wait_for_selector("#app-admin:not([hidden])")
        await admin_page.wait_for_function(
            "document.querySelectorAll('#proyecto-categoria option').length > 0", timeout=5000
        )
        await admin_page.fill("#proyecto-titulo", "Proyecto de prueba de integración")
        await admin_page.fill("#proyecto-necesidad", "Necesidad de prueba")
        await admin_page.fill("#proyecto-quehice", "Qué hice de prueba")
        await admin_page.fill("#proyecto-resultado", "Resultado de prueba")
        await admin_page.click("#btn-guardar-proyecto")
        await admin_page.wait_for_selector("#lista-proyectos >> text=Proyecto de prueba de integración")
        await admin_page.close()

        await page.reload()
        await page.wait_for_selector("#contenedor-proyectos >> text=Proyecto de prueba de integración", timeout=5000)
        print("OK 12: proyecto creado en admin aparece de inmediato en la página pública")

        await browser.close()
        print("\nTODAS LAS PRUEBAS DE LA PÁGINA PÚBLICA PASARON")

asyncio.run(main())
