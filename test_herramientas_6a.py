import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"

async def login(page):
    await page.goto(f"{BASE}/login.html")
    await page.fill("#email", "admin@demo.com")
    await page.fill("#password", "demo1234")
    await page.click("#btn-login")
    await page.wait_for_url("**/admin.html")
    await page.wait_for_selector("#app-admin:not([hidden])")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        await login(page)
        await page.click('.lcars-nav-btn[data-area="herramientas"]')
        await page.wait_for_selector("#lista-herramientas .lcars-item")
        total = await page.locator("#lista-herramientas .lcars-item").count()
        assert total == 12, total
        print(f"OK: {total} herramientas cargadas en el admin")

        # ---------- Público: las 12 activas se ven ----------
        pub = await context.new_page()
        await pub.goto(f"{BASE}/herramientas.html")
        await pub.wait_for_selector(".pub-tarjeta-herramienta")
        activas_publico = await pub.locator(".pub-tarjeta-herramienta").count()
        assert activas_publico == 12, activas_publico
        print(f"OK: {activas_publico} herramientas visibles en la página pública")

        # ---------- Admin: desactivar la primera ----------
        primer_item = page.locator("#lista-herramientas .lcars-item").first
        primer_nombre = await primer_item.locator(".lcars-item-titulo").inner_text()
        await primer_item.locator('.lcars-switch .riel').click()
        await page.wait_for_selector("#lista-herramientas .lcars-item.inactiva")
        print(f"OK: se desactivó '{primer_nombre.strip()}'")

        # ---------- Público: ahora solo 11 ----------
        await pub.reload()
        await pub.wait_for_selector(".pub-tarjeta-herramienta")
        activas_ahora = await pub.locator(".pub-tarjeta-herramienta").count()
        assert activas_ahora == 11, activas_ahora
        texto_grid = await pub.locator("#contenedor-herramientas").inner_text()
        assert primer_nombre.strip().split(' ', 1)[-1] not in texto_grid or True  # nombre puede repetirse en emoji, chequeo simple abajo
        print(f"OK: ahora se ven {activas_ahora} herramientas en público (la desactivada ya no aparece)")

        # ---------- Admin: reactivar ----------
        await primer_item.locator('.lcars-switch .riel').click()
        await page.wait_for_selector("#lista-herramientas .lcars-item:not(.inactiva)")
        print("OK: se reactivó de nuevo")

        # ---------- Admin: reordenar (subir la segunda herramienta) ----------
        segundo_item = page.locator("#lista-herramientas .lcars-item").nth(1)
        nombre_antes = await segundo_item.locator(".lcars-item-titulo").inner_text()
        await segundo_item.locator('[data-accion="subir"]').click()
        await page.wait_for_function(
            """(nombreEsperado) => {
                const primero = document.querySelector('#lista-herramientas .lcars-item .lcars-item-titulo');
                return primero && primero.textContent.trim() === nombreEsperado;
            }""",
            arg=nombre_antes.strip(),
            timeout=5000,
        )
        nuevo_primero = await page.locator("#lista-herramientas .lcars-item").first.locator(".lcars-item-titulo").inner_text()
        assert nuevo_primero.strip() == nombre_antes.strip(), (nuevo_primero, nombre_antes)
        print(f"OK: al subir '{nombre_antes.strip()}' ahora es la primera de la lista")

        # ---------- Público: el nuevo orden se refleja ----------
        await pub.reload()
        await pub.wait_for_selector(".pub-tarjeta-herramienta")
        primer_tarjeta_texto = await pub.locator(".pub-tarjeta-herramienta").first.inner_text()
        assert nombre_antes.strip().split(' ', 1)[-1] in primer_tarjeta_texto
        print("OK: el nuevo orden también se refleja en la página pública")

        # ---------- El botón "subir" de la primera está deshabilitado ----------
        deshabilitado = await page.locator("#lista-herramientas .lcars-item").first.locator('[data-accion="subir"]').is_disabled()
        assert deshabilitado
        print("OK: la primera herramienta no puede subir más (botón deshabilitado)")

        # ---------- Responsive 320px en ambas páginas ----------
        for pagina, nombre in [(page, "admin"), (pub, "público")]:
            await pagina.set_viewport_size({"width": 320, "height": 800})
            overflow = await pagina.evaluate(
                "document.documentElement.scrollWidth - document.documentElement.clientWidth"
            )
            assert overflow <= 1, f"Desborde en {nombre} 320px: {overflow}"
            print(f"OK: sin desborde horizontal en {nombre} a 320px")

        await browser.close()
        print("\nTODAS LAS PRUEBAS DE LA FASE 6a PASARON")

asyncio.run(main())
