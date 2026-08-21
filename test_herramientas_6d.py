import asyncio
import os
import tempfile

from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"

# Un PDF de una sola página, válido pero mínimo, escrito a mano (no
# necesita ninguna librería) — solo para probar la herramienta
# "PDF a imágenes" sin depender de jsPDF (que sí necesita internet).
PDF_MINIMO = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 60 >>
stream
BT /F1 24 Tf 20 100 Td (Pagina de prueba) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF
"""


def crear_imagen_prueba(ruta, ancho=600, alto=400):
    img = Image.new("RGB", (ancho, alto), (200, 60, 60))
    dibujo = ImageDraw.Draw(img)
    dibujo.text((20, 20), "PRUEBA", fill=(255, 255, 255))
    img.save(ruta, quality=95)


async def sin_desborde(page, nombre, ancho=320):
    await page.set_viewport_size({"width": ancho, "height": 900})
    overflow = await page.evaluate(
        "document.documentElement.scrollWidth - document.documentElement.clientWidth"
    )
    assert overflow <= 1, f"Desborde en {nombre} a {ancho}px: {overflow}"
    print(f"OK: sin desborde horizontal en {nombre} a {ancho}px")


async def main():
    with tempfile.TemporaryDirectory() as tmp:
        ruta_img1 = os.path.join(tmp, "una.jpg")
        ruta_img2 = os.path.join(tmp, "dos.jpg")
        crear_imagen_prueba(ruta_img1)
        crear_imagen_prueba(ruta_img2, ancho=400, alto=300)
        ruta_pdf = os.path.join(tmp, "prueba.pdf")
        with open(ruta_pdf, "wb") as f:
            f.write(PDF_MINIMO)

        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context()

            # ---------- Imágenes a PDF ----------
            page = await context.new_page()
            await page.goto(f"{BASE}/herramientas/imagenes-a-pdf.html")
            await page.set_input_files("#imgpdf-archivos", [ruta_img1, ruta_img2])
            await page.wait_for_selector(".pub-miniatura-item", timeout=5000)
            items = page.locator(".pub-miniatura-item")
            assert await items.count() == 2
            print("OK: 2 imágenes agregadas a la lista, con miniatura cada una")

            # Reordenar: bajar la primera y confirmar que cambió el orden
            nombre_antes = await items.nth(0).locator(".pub-miniatura-nombre").inner_text()
            await items.nth(0).locator('[data-accion="bajar"]').click()
            nombre_despues = await items.nth(1).locator(".pub-miniatura-nombre").inner_text()
            assert nombre_antes == nombre_despues
            print("OK: reordenar con las flechas mueve la imagen de posición")

            # Quitar una imagen
            await items.nth(0).locator('[data-accion="quitar"]').click()
            await page.wait_for_function("document.querySelectorAll('.pub-miniatura-item').length === 1")
            print("OK: quitar una imagen la saca de la lista")

            assert await page.locator("#btn-imgpdf-generar").is_enabled()
            print("OK: botón 'Generar PDF' habilitado con al menos una imagen")

            # Sin internet en este entorno de pruebas: el intento de generar
            # debe fallar de forma controlada avisando por qué, no romper la página.
            await page.click("#btn-imgpdf-generar")
            await page.wait_for_selector(".toast.error.show", timeout=8000)
            texto_error = await page.locator(".toast.error").inner_text()
            print("OK: sin internet, avisa con un toast en vez de trabarse ->", texto_error[:60])

            await sin_desborde(page, "imágenes a PDF")

            # ---------- PDF a imágenes ----------
            page2 = await context.new_page()
            await page2.goto(f"{BASE}/herramientas/pdf-a-imagenes.html")
            await page2.set_input_files("#pdfimg-archivo", ruta_pdf)
            await page2.wait_for_selector("#pdfimg-controles:not([hidden])")
            print("OK: PDF cargado, controles de conversión visibles")

            await page2.click("#btn-pdfimg-convertir")
            await page2.wait_for_selector(".toast.error.show", timeout=8000)
            print("OK: sin internet, avisa con un toast en vez de trabarse")

            await sin_desborde(page2, "PDF a imágenes")

            # ---------- OCR ----------
            page3 = await context.new_page()
            await page3.goto(f"{BASE}/herramientas/ocr.html")
            await page3.set_input_files("#ocr-archivo", ruta_img1)
            await page3.wait_for_selector("#ocr-controles:not([hidden])")
            print("OK: imagen cargada, controles de OCR visibles")

            await page3.click("#btn-ocr-extraer")
            await page3.wait_for_selector(".toast.error.show", timeout=8000)
            print("OK: sin internet, avisa con un toast en vez de trabarse")

            await sin_desborde(page3, "extractor de texto (OCR)")

            # ---------- Las 3 aparecen en el listado público de herramientas ----------
            page4 = await context.new_page()
            await page4.goto(f"{BASE}/herramientas.html")
            for href in ["imagenes-a-pdf.html", "pdf-a-imagenes.html", "ocr.html"]:
                await page4.wait_for_selector(f'a.pub-tarjeta-herramienta[href="herramientas/{href}"]')
            print("OK: las 3 herramientas de la fase 6d aparecen en el listado público")

            await browser.close()

        print("\nTODAS LAS PRUEBAS DE LA FASE 6d PASARON")


if __name__ == "__main__":
    asyncio.run(main())
