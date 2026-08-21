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
        page = await browser.new_page()
        page.on("console", lambda msg: print("BROWSER:", msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: print("PAGEERROR:", exc))

        await login(page)
        print("OK login")

        # ---------- Categorías: crear ----------
        await page.click('.lcars-subnav [data-sub="categorias"]')
        await page.fill("#categoria-emoji", "🎨")
        await page.fill("#categoria-nombre", "Diseño gráfico")
        await page.click("#btn-guardar-categoria")
        await page.wait_for_selector("#lista-categorias >> text=Diseño gráfico")
        print("OK: categoría nueva creada y aparece en la lista")

        # ---------- Categorías: editar ----------
        item = page.locator('#lista-categorias .lcars-item', has_text="Diseño gráfico")
        await item.locator('[data-accion="editar"]').click()
        await page.fill("#categoria-nombre", "Diseño gráfico y branding")
        await page.click("#btn-guardar-categoria")
        await page.wait_for_selector("#lista-categorias >> text=Diseño gráfico y branding")
        print("OK: categoría editada correctamente")

        # ---------- Proyectos: el select de categoría debe incluirla ----------
        await page.click('.lcars-subnav [data-sub="proyectos"]')
        opciones = await page.locator("#proyecto-categoria option").all_inner_texts()
        assert any("Diseño gráfico" in o for o in opciones), opciones
        print("OK: la categoría nueva aparece en el select de proyectos ->", opciones)

        # ---------- Proyectos: crear ----------
        await page.fill("#proyecto-titulo", "Landing page para restaurante")
        await page.select_option("#proyecto-categoria", label=[o for o in opciones if "Diseño gráfico" in o][0])
        await page.fill("#proyecto-url", "https://ejemplo.com/restaurante")
        await page.fill("#proyecto-necesidad", "Necesitaban presencia web para el menú.")
        await page.fill("#proyecto-quehice", "Diseñé y publiqué una landing responsiva.")
        await page.fill("#proyecto-resultado", "Aumentaron las reservas online un 40%.")
        await page.check("#proyecto-destacado")
        await page.click("#btn-guardar-proyecto")
        await page.wait_for_selector("#lista-proyectos >> text=Landing page para restaurante")
        print("OK: proyecto nuevo creado (con categoría, caso de estudio y destacado)")

        # verificar que el badge de destacado (⭐) aparece
        titulo_item = await page.locator('#lista-proyectos .lcars-item-titulo').first.inner_text()
        assert "⭐" in titulo_item, titulo_item
        print("OK: proyecto destacado muestra la estrella ->", titulo_item)

        # ---------- Proyectos: editar ----------
        item_p = page.locator('#lista-proyectos .lcars-item', has_text="Landing page para restaurante")
        await item_p.locator('[data-accion="editar"]').click()
        await page.wait_for_selector("#titulo-form-proyecto:has-text('Editar proyecto')")
        valor_necesidad = await page.input_value("#proyecto-necesidad")
        assert "menú" in valor_necesidad
        await page.fill("#proyecto-titulo", "Landing page para restaurante (v2)")
        await page.click("#btn-guardar-proyecto")
        await page.wait_for_selector("#lista-proyectos >> text=Landing page para restaurante (v2)")
        print("OK: proyecto editado, datos precargados correctamente")

        # ---------- Proyectos: eliminar ----------
        page.once("dialog", lambda dialog: asyncio.create_task(dialog.accept()))
        item_p2 = page.locator('#lista-proyectos .lcars-item', has_text="Landing page para restaurante (v2)")
        await item_p2.locator('[data-accion="eliminar"]').click()
        await page.wait_for_selector("#lista-proyectos >> text=Landing page para restaurante (v2)", state="detached")
        print("OK: proyecto eliminado")

        # ---------- Testimonios: crear, editar ----------
        await page.click('.lcars-subnav [data-sub="testimonios"]')
        await page.fill("#testimonio-autor", "María Pérez")
        await page.fill("#testimonio-cargo", "Dueña de restaurante")
        await page.fill("#testimonio-texto", "Quedé encantada con el resultado final.")
        await page.click("#btn-guardar-testimonio")
        await page.wait_for_selector("#lista-testimonios >> text=María Pérez")
        print("OK: testimonio creado")

        item_t = page.locator('#lista-testimonios .lcars-item', has_text="María Pérez")
        await item_t.locator('[data-accion="editar"]').click()
        await page.fill("#testimonio-cargo", "Dueña de Restaurante El Buen Sabor")
        await page.click("#btn-guardar-testimonio")
        await page.wait_for_selector("#lista-testimonios >> text=Dueña de Restaurante El Buen Sabor")
        print("OK: testimonio editado")

        # ---------- Categorías: eliminar (la que creamos) ----------
        await page.click('.lcars-subnav [data-sub="categorias"]')
        page.once("dialog", lambda dialog: asyncio.create_task(dialog.accept()))
        item_c = page.locator('#lista-categorias .lcars-item', has_text="Diseño gráfico y branding")
        await item_c.locator('[data-accion="eliminar"]').click()
        await page.wait_for_selector("#lista-categorias >> text=Diseño gráfico y branding", state="detached")
        print("OK: categoría eliminada")

        # ---------- Estado vacío: borrar todo y comprobar mensajes ----------
        # Ojo: borrarDatosDeDemo() hace removeItem(), y local-db.js vuelve a
        # sembrar datos de ejemplo si la clave no existe (a propósito, para
        # que la primera vez que alguien abre el panel no esté vacío). Para
        # probar el estado vacío real hay que dejar un array [] explícito.
        await page.evaluate("""
            () => {
                localStorage.setItem('portafolio_proyectos', '[]');
                localStorage.setItem('portafolio_categorias', '[]');
                localStorage.setItem('portafolio_testimonios', '[]');
            }
        """)
        await page.reload()
        await page.wait_for_selector("#app-admin:not([hidden])")
        await page.wait_for_selector("#lista-proyectos .lcars-estado-vacio")
        await page.click('.lcars-subnav [data-sub="categorias"]')
        await page.wait_for_selector("#lista-categorias .lcars-estado-vacio")
        await page.click('.lcars-subnav [data-sub="testimonios"]')
        await page.wait_for_selector("#lista-testimonios .lcars-estado-vacio")
        print("OK: estados vacíos se muestran correctamente")

        # ---------- Responsive del formulario en 320px ----------
        await page.set_viewport_size({"width": 320, "height": 800})
        overflow = await page.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        assert overflow <= 1, f"Desborde en 320px: {overflow}"
        print("OK: sin desborde horizontal en 320px con el formulario de Portafolio")

        await browser.close()
        print("\nTODAS LAS PRUEBAS DE PORTAFOLIO PASARON")

asyncio.run(main())
