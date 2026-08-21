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
        await page.click('.lcars-nav-btn[data-area="canales"]')
        print("OK: entré al área Canales y contacto")

        # ---------- Canal: crear ----------
        await page.fill("#canal-nombre", "Upwork")
        await page.fill("#canal-parametro", "upwork")
        await page.fill("#canal-url", "https://upwork.com/freelancers/tuusuario")
        await page.fill("#canal-texto-boton", "Contáctame en Upwork")
        await page.click("#btn-guardar-canal")
        await page.wait_for_selector("#lista-canales >> text=Upwork")
        print("OK: canal Upwork creado")

        # ---------- Canal: editar ----------
        item = page.locator('#lista-canales .lcars-item', has_text="Upwork")
        await item.locator('[data-accion="editar"]').click()
        await page.fill("#canal-texto-boton", "Escríbeme en Upwork")
        await page.click("#btn-guardar-canal")
        await page.wait_for_selector("#lista-canales >> text=?de=upwork")
        print("OK: canal Upwork editado")

        # ---------- Configuración general: PayPal + punto de estado ----------
        await page.fill("#config-paypal", "https://paypal.me/alcedomontero")
        await page.uncheck("#config-punto-estado")
        await page.click("#btn-guardar-config-canales")
        await page.wait_for_timeout(400)
        config_guardada = await page.evaluate("() => JSON.parse(localStorage.getItem('portafolio_config'))")
        assert config_guardada["paypalLink"] == "https://paypal.me/alcedomontero"
        assert config_guardada["mostrarPuntoEstado"] is False
        print("OK: configuración general guardada ->", config_guardada)

        # ---------- Público: sin ?de= muestra todos los canales ----------
        pagina_publica = await context.new_page()
        await pagina_publica.goto(f"{BASE}/index.html")
        await pagina_publica.wait_for_selector("#contenedor-contacto .pub-canal-cta", timeout=5000)
        botones = await pagina_publica.locator("#contenedor-contacto .pub-canal-cta").count()
        assert botones == 3, botones  # fiverr + workana (demo) + upwork
        print(f"OK: sin ?de= se muestran los {botones} canales disponibles")

        # ---------- Público: el punto de estado está oculto (config lo apagó) ----------
        oculto = await pagina_publica.evaluate(
            "() => getComputedStyle(document.getElementById('punto-estado')).display"
        )
        assert oculto == "none", oculto
        print("OK: punto de estado oculto según configuración")

        # ---------- Público: el ícono de PayPal aparece en el pie ----------
        await pagina_publica.wait_for_selector("#link-paypal:not([hidden])", timeout=3000)
        href_paypal = await pagina_publica.get_attribute("#link-paypal", "href")
        assert href_paypal == "https://paypal.me/alcedomontero"
        print("OK: ícono de PayPal visible con el link correcto")

        # ---------- Público: con ?de=upwork solo muestra ese canal ----------
        await pagina_publica.goto(f"{BASE}/index.html?de=upwork")
        await pagina_publica.wait_for_selector("#contenedor-contacto .pub-canal-cta", timeout=5000)
        botones_de = await pagina_publica.locator("#contenedor-contacto .pub-canal-cta").count()
        assert botones_de == 1, botones_de
        texto_boton = await pagina_publica.locator("#contenedor-contacto .pub-canal-cta").inner_text()
        assert "Upwork" in texto_boton, texto_boton
        print("OK: con ?de=upwork solo se muestra el botón de Upwork ->", texto_boton.strip())

        # ---------- Público: ?de= con un parámetro que no existe -> fallback a todos ----------
        await pagina_publica.goto(f"{BASE}/index.html?de=noexiste")
        await pagina_publica.wait_for_selector("#contenedor-contacto .pub-canal-cta", timeout=5000)
        botones_fallback = await pagina_publica.locator("#contenedor-contacto .pub-canal-cta").count()
        assert botones_fallback == 3, botones_fallback
        print("OK: ?de= con parámetro inexistente cae de vuelta a mostrar todos los canales")

        # ---------- Canal: eliminar ----------
        page.once("dialog", lambda dialog: asyncio.create_task(dialog.accept()))
        item2 = page.locator('#lista-canales .lcars-item', has_text="Upwork")
        await item2.locator('[data-accion="eliminar"]').click()
        await page.wait_for_selector("#lista-canales >> text=Upwork", state="detached")
        print("OK: canal Upwork eliminado")

        # ---------- Responsive 320px ----------
        await pagina_publica.goto(f"{BASE}/index.html")
        await pagina_publica.wait_for_selector("#contenedor-contacto .pub-canal-cta")
        await pagina_publica.set_viewport_size({"width": 320, "height": 800})
        overflow = await pagina_publica.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        assert overflow <= 1, f"Desborde en 320px: {overflow}"
        print("OK: sin desborde horizontal en 320px con la sección de contacto")

        await page.set_viewport_size({"width": 320, "height": 800})
        overflow_admin = await page.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        assert overflow_admin <= 1, f"Desborde admin en 320px: {overflow_admin}"
        print("OK: sin desborde horizontal en 320px en el formulario admin de Canales")

        await browser.close()
        print("\nTODAS LAS PRUEBAS DE CANALES Y CONTACTO PASARON")

asyncio.run(main())
