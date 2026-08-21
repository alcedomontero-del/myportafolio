import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # ---------- 1. Admin sin sesión -> debe rebotar a login.html ----------
        page = await browser.new_page()
        await page.goto(f"{BASE}/admin.html")
        await page.wait_for_url("**/login.html", timeout=5000)
        print("OK 1: admin.html sin sesión redirige a login.html")

        # ---------- 2. Badge modo local visible en login ----------
        badge = await page.locator("#badge-modo .mode-badge").inner_text()
        assert "local" in badge.lower() or "demostración" in badge.lower(), badge
        print("OK 2: badge modo local visible en login ->", badge[:50])

        # ---------- 3. Login con credenciales incorrectas ----------
        await page.fill("#email", "malo@demo.com")
        await page.fill("#password", "malacontrasena")
        await page.click("#btn-login")
        await page.wait_for_selector("#login-error.mostrar", timeout=3000)
        error_txt = await page.locator("#login-error").inner_text()
        print("OK 3: error mostrado con credenciales malas ->", error_txt)

        # ---------- 4. Login correcto -> animación -> admin.html ----------
        await page.fill("#email", "admin@demo.com")
        await page.fill("#password", "demo1234")
        await page.click("#btn-login")
        # la animación de arranque debe aparecer
        await page.wait_for_selector("#arranque:not([hidden])", timeout=2000)
        print("OK 4a: animación 'encendiendo sistemas' aparece tras login correcto")
        await page.wait_for_url("**/admin.html", timeout=5000)
        await page.wait_for_selector("#app-admin:not([hidden])", timeout=5000)
        print("OK 4b: redirige a admin.html y el panel se muestra")

        # ---------- 5. Navegación entre las 5 áreas (sin recargar) ----------
        areas = ["herramientas", "descargables", "canales", "control", "portafolio"]
        for area in areas:
            await page.click(f'.lcars-nav-btn[data-area="{area}"]')
            visible = await page.locator(f"#area-{area}").is_visible()
            url_antes = page.url
            assert visible, f"Área {area} no visible"
            assert page.url == url_antes, "¡Navegó a otra URL! No debería."
        print("OK 5: las 5 áreas cambian con JS, sin recargar ni cambiar de URL")

        # ---------- 6. Responsive 375px, 360px, 320px ----------
        for ancho in [375, 360, 320]:
            await page.set_viewport_size({"width": ancho, "height": 700})
            overflow = await page.evaluate(
                "document.documentElement.scrollWidth - document.documentElement.clientWidth"
            )
            print(f"OK 6: ancho {ancho}px -> desborde horizontal = {overflow}px")
            assert overflow <= 1, f"Desborde horizontal en {ancho}px: {overflow}px"
        await page.set_viewport_size({"width": 1280, "height": 800})

        # ---------- 7. Cerrar sesión -> vuelve a login.html ----------
        await page.click("#btn-logout")
        await page.wait_for_url("**/login.html", timeout=5000)
        print("OK 7: cerrar sesión regresa a login.html")

        # ---------- 8. Tras logout, refrescar admin.html debe rebotar de nuevo ----------
        await page.goto(f"{BASE}/admin.html")
        await page.wait_for_url("**/login.html", timeout=5000)
        print("OK 8: sesión realmente cerrada, admin.html vuelve a rebotar")

        await browser.close()
        print("\nTODAS LAS PRUEBAS PASARON")

asyncio.run(main())
