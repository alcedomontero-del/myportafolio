import asyncio
import xml.etree.ElementTree as ET
import urllib.request
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"

async def main():
    # ---------- sitemap.xml ----------
    with urllib.request.urlopen(f"{BASE}/sitemap.xml") as resp:
        cuerpo = resp.read()
        content_type = resp.headers.get("Content-Type", "")
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    raiz = ET.fromstring(cuerpo)  # falla si el XML no es válido
    urls = [el.text for el in raiz.findall("s:url/s:loc", ns)]
    assert len(urls) == 15, f"Se esperaban 15 URLs, hay {len(urls)}"
    assert "https://alcedomontero.do/" in urls
    assert "https://alcedomontero.do/herramientas.html" in urls
    assert "https://alcedomontero.do/descargables.html" in urls
    assert "https://alcedomontero.do/herramientas/creador-diploma.html" in urls
    assert not any("admin.html" in u or "login.html" in u for u in urls)
    print(f"OK: sitemap.xml válido con {len(urls)} URLs públicas (admin/login excluidas)")

    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # ---------- Aviso de cookies: aparece en la primera visita ----------
        contexto1 = await browser.new_context()
        pagina1 = await contexto1.new_page()
        await pagina1.goto(f"{BASE}/index.html")
        await pagina1.wait_for_selector(".pub-aviso-cookies", timeout=5000)
        print("OK: aviso de cookies aparece en la primera visita")

        # ---------- Aceptar: desaparece y queda guardado ----------
        await pagina1.click('.pub-aviso-cookies [data-cookies="aceptar"]')
        await pagina1.wait_for_selector(".pub-aviso-cookies", state="detached", timeout=3000)
        pref = await pagina1.evaluate("() => localStorage.getItem('pref-cookies')")
        assert pref == "aceptado", pref
        print("OK: al aceptar, el aviso desaparece y queda guardada la preferencia")

        # ---------- Recargar: no se vuelve a mostrar ----------
        await pagina1.reload()
        await pagina1.wait_for_timeout(500)
        visible = await pagina1.locator(".pub-aviso-cookies").count()
        assert visible == 0, "El aviso reapareció después de aceptar"
        print("OK: tras recargar, el aviso ya no reaparece (se recuerda la decisión)")

        # ---------- En modo local (demo) nunca se carga el script de Analytics ----------
        # aunque el usuario haya aceptado — evita ensuciar las estadísticas
        # reales con visitas de prueba/demostración.
        script_ga = await pagina1.locator("#gtag-analytics").count()
        assert script_ga == 0, "Analytics se cargó en modo local — no debería"
        es_local = await pagina1.evaluate("() => window.ES_LOCAL")
        assert es_local is True
        print("OK: en modo local, Analytics nunca se carga aunque se haya aceptado")

        # ---------- Rechazar: también desaparece, también se recuerda ----------
        contexto2 = await browser.new_context()
        pagina2 = await contexto2.new_page()
        await pagina2.goto(f"{BASE}/herramientas.html")
        await pagina2.wait_for_selector(".pub-aviso-cookies", timeout=5000)
        await pagina2.click('.pub-aviso-cookies [data-cookies="rechazar"]')
        await pagina2.wait_for_selector(".pub-aviso-cookies", state="detached", timeout=3000)
        pref2 = await pagina2.evaluate("() => localStorage.getItem('pref-cookies')")
        assert pref2 == "rechazado", pref2
        await pagina2.reload()
        await pagina2.wait_for_timeout(500)
        visible2 = await pagina2.locator(".pub-aviso-cookies").count()
        assert visible2 == 0, "El aviso reapareció después de rechazar"
        script_ga2 = await pagina2.locator("#gtag-analytics").count()
        assert script_ga2 == 0
        print("OK: al rechazar, el aviso desaparece, se recuerda la decisión y no se carga Analytics")

        # ---------- Responsive 320px con el aviso visible ----------
        contexto3 = await browser.new_context()
        pagina3 = await contexto3.new_page()
        await pagina3.set_viewport_size({"width": 320, "height": 800})
        await pagina3.goto(f"{BASE}/index.html")
        await pagina3.wait_for_selector(".pub-aviso-cookies", timeout=5000)
        overflow = await pagina3.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        assert overflow <= 1, f"Desborde en 320px con el aviso de cookies visible: {overflow}"
        print("OK: sin desborde horizontal en 320px con el aviso de cookies visible")

        await browser.close()
        print("\nTODAS LAS PRUEBAS DE LA FASE 9 (EXTRAS) PASARON")

asyncio.run(main())
