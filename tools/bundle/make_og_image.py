"""Build the 1200x630 social share image (Open Graph) from the welcome cover.

Usage (repo root): python tools/bundle/make_og_image.py
Writes web/public/brand/og-image.jpg (Next.js serves it as og:image for every page).
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
FONT_DIR = "C:/Windows/Fonts/"
bold = lambda s: ImageFont.truetype(FONT_DIR + "leelawdb.ttf", s)  # noqa: E731
regular = lambda s: ImageFont.truetype(FONT_DIR + "LeelawUI.ttf", s)  # noqa: E731

cover = Image.open("web/public/brand/heritage-cover.webp").convert("RGB")
scale = max(W / cover.width, H / cover.height)
cover = cover.resize((round(cover.width * scale), round(cover.height * scale)), Image.LANCZOS)
left = round((cover.width - W) * 0.55)
img = cover.crop((left, 0, left + W, H)).convert("RGBA")

# Same dark-left gradient as .welcome-overlay in cover.css.
overlay = Image.new("RGBA", (W, H))
stops = [(0.0, 0.91), (0.35, 0.80), (0.68, 0.40), (1.0, 0.18)]
px = overlay.load()
for x in range(W):
    t = x / (W - 1)
    for (t0, a0), (t1, a1) in zip(stops, stops[1:]):
        if t0 <= t <= t1:
            a = a0 + (a1 - a0) * (t - t0) / (t1 - t0)
            break
    for y in range(H):
        bottom = max(0.0, (y / H - 0.65) / 0.35) * 0.45
        px[x, y] = (34, 12, 20, int(255 * min(1.0, a + bottom * (1 - a))))
img = Image.alpha_composite(img, overlay)
d = ImageDraw.Draw(img)

# Logos on a white badge + brand text.
badge = (60, 48, 60 + 112, 48 + 70)
d.rounded_rectangle(badge, radius=12, fill="white")
for i, (path, w) in enumerate([("web/public/brand/snru-logo.png", 44), ("web/public/brand/language-institute-logo.jpg", 52)]):
    logo = Image.open(path).convert("RGBA")
    logo.thumbnail((w, 56))
    x = badge[0] + 8 + (0 if i == 0 else 50)
    img.paste(logo, (x, badge[1] + (70 - logo.height) // 2), logo)
d.text((190, 52), "แหล่งเรียนรู้สกลนคร 3D", font=bold(30), fill="white")
d.text((190, 92), "Sakon Nakhon Learning Sites 3D", font=regular(20), fill="#f4d4bd")

d.rectangle((60, 214, 100, 216), fill="#f4a35d")
d.text((114, 200), "SAKON NAKHON · THAILAND", font=bold(20), fill="#f5d4b6")
y = 238
for text, color in [("เปิดประตูสู่", "white"), ("5 แหล่งเรียนรู้", "#ffb982"), ("เมืองสกลนคร", "white")]:
    d.text((60, y), text, font=bold(66), fill=color)
    y += 86
d.text((60, y + 18), "สำรวจวัฒนธรรมและภูมิปัญญาชุมชน ผ่านโมเดล 3 มิติและ AR", font=regular(25), fill="#fff4eb")

img.convert("RGB").save("web/public/brand/og-image.jpg", "JPEG", quality=85, optimize=True, progressive=True)
print("wrote web/public/brand/og-image.jpg")
