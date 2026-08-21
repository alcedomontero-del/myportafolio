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
        await page.click('.lcars-nav-btn[data-area="control"]')
        await page.wait_for_selector("#grid-diagnostico .lcars-tarjeta-diag")
        print("OK: entré al área Centro de Control")

        # ---------- Las 6 tarjetas aparecen ----------
        tarjetas = page.locator("#grid-diagnostico .lcars-tarjeta-diag")
        assert await tarjetas.count() == 6, await tarjetas.count()
        print("OK: 6 tarjetas de diagnóstico cargadas")

        async def clase_de(data_id):
            tarjeta = page.locator(f'#grid-diagnostico .lcars-tarjeta-diag[data-id="{data_id}"]')
            clase = await tarjeta.get_attribute("class")
            return clase

        # ---------- En modo demo local, sin credenciales reales: todo ámbar ----------
        # salvo Plataformas, que sí tiene 2 canales de ejemplo -> verde.
        assert "ambar" in await clase_de("firebase")
        assert "ambar" in await clase_de("cloudinary")
        assert "ambar" in await clase_de("autenticacion")
        assert "ambar" in await clase_de("paypal")
        assert "ambar" in await clase_de("modo")
        assert "verde" in await clase_de("plataformas")
        print("OK: colores correctos con datos de demo (5 ámbar, 1 verde)")

        # ---------- Tocar una tarjeta ámbar despliega el paso a resolver ----------
        tarjeta_firebase = page.locator('#grid-diagnostico .lcars-tarjeta-diag[data-id="firebase"]')
        assert await tarjeta_firebase.get_attribute("aria-expanded") == "false"
        await tarjeta_firebase.click()
        assert await tarjeta_firebase.get_attribute("aria-expanded") == "true"
        paso_visible = await tarjeta_firebase.locator(".paso-resolver").is_visible()
        assert paso_visible
        texto_paso = await tarjeta_firebase.locator(".paso-resolver").inner_text()
        assert "console.firebase.google.com" in texto_paso
        print("OK: tarjeta ámbar despliega el paso de resolución al tocarla ->", texto_paso[:60])

        # volver a tocarla la cierra
        await tarjeta_firebase.click()
        assert await tarjeta_firebase.get_attribute("aria-expanded") == "false"
        print("OK: volver a tocarla la cierra")

        # ---------- Tarjeta verde no tiene paso desplegable ----------
        tarjeta_plataformas = page.locator('#grid-diagnostico .lcars-tarjeta-diag[data-id="plataformas"]')
        assert await tarjeta_plataformas.locator(".paso-resolver").count() == 0
        print("OK: tarjeta verde (Plataformas) no tiene paso de resolución")

        # ---------- Configurar PayPal desde Canales -> la tarjeta pasa a verde ----------
        await page.click('.lcars-nav-btn[data-area="canales"]')
        await page.fill("#config-paypal", "https://paypal.me/alcedomontero")
        await page.click("#btn-guardar-config-canales")
        await page.wait_for_timeout(400)
        await page.click('.lcars-nav-btn[data-area="control"]')
        await page.wait_for_selector("#grid-diagnostico .lcars-tarjeta-diag")
        assert "verde" in await clase_de("paypal")
        print("OK: tarjeta PayPal pasa a verde tras configurar el link")

        # ---------- Responsive 320px ----------
        await page.set_viewport_size({"width": 320, "height": 800})
        overflow = await page.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        assert overflow <= 1, f"Desborde en 320px: {overflow}"
        print("OK: sin desborde horizontal en Centro de Control a 320px")

        await browser.close()
        print("\nTODAS LAS PRUEBAS DEL CENTRO DE CONTROL PASARON")

asyncio.run(main())
