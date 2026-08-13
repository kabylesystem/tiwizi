from playwright.sync_api import sync_playwright
with sync_playwright() as pl:
    b = pl.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 860})
    pg.goto("http://localhost:3000/")
    pg.wait_for_timeout(2500)
    pg.screenshot(path="home.png")
    pg.set_viewport_size({"width": 390, "height": 844})
    pg.wait_for_timeout(600)
    pg.screenshot(path="home-mobile.png")
    b.close()
print("ok")
