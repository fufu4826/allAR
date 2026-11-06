"""
Sakon Nakhon 5 Cultural Identities Map Generator - Master Edition
Blends Image 1 (3D relief + district boundaries) with Image 2 (rich pastel colors, environmental details, highways, legend card)
Accurately places the 5 key cultural landmarks in Sakon Nakhon.
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import scipy.ndimage as nd

def get_font(size, bold=False):
    font_file = "leelawdb.ttf" if bold else "leelawad.ttf"
    font_path = os.path.join("C:/Windows/Fonts", font_file)
    if not os.path.exists(font_path):
        font_file = "tahomabd.ttf" if bold else "tahoma.ttf"
        font_path = os.path.join("C:/Windows/Fonts", font_file)
    try:
        return ImageFont.truetype(font_path, size)
    except Exception:
        return ImageFont.load_default()

def draw_shadowed_rounded_rect(base_img, bbox, radius, fill, shadow_color=(0, 0, 0, 45), offset=(0, 8), blur=12):
    x0, y0, x1, y1 = bbox
    w = int(x1 - x0 + blur * 4)
    h = int(y1 - y0 + blur * 4)
    
    # Shadow layer
    sh_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sh_draw = ImageDraw.Draw(sh_img)
    sh_draw.rounded_rectangle([blur*2 + offset[0], blur*2 + offset[1], blur*2 + offset[0] + (x1-x0), blur*2 + offset[1] + (y1-y0)], radius=radius, fill=shadow_color)
    sh_img = sh_img.filter(ImageFilter.GaussianBlur(blur))
    
    base_img.paste(sh_img, (int(x0 - blur*2), int(y0 - blur*2)), sh_img)
    
    # Main rect
    draw = ImageDraw.Draw(base_img)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill)

def main():
    print("Generating Sakon Nakhon 5 Cultural Identities Map (Master Edition)...")
    
    # Canvas dimensions: 2000 x 2350 for wide layout and ample breathing room
    W, H = 2000, 2350
    canvas = Image.new("RGBA", (W, H), (182, 196, 212, 255))
    
    # Smooth periwinkle gradient background (Image 2 style)
    bg_arr = np.zeros((H, W, 4), dtype=np.uint8)
    for y in range(H):
        ratio = y / H
        # top: #A5B8CC -> bottom: #BBC9D8
        r = int(165 * (1 - ratio) + 187 * ratio)
        g = int(184 * (1 - ratio) + 201 * ratio)
        b = int(204 * (1 - ratio) + 216 * ratio)
        bg_arr[y, :] = [r, g, b, 255]
    canvas = Image.fromarray(bg_arr, mode="RGBA")
    
    # ========================================================
    # 1. Process 3D Relief & 18 Districts from Image 1
    # ========================================================
    im1_path = "C:/Users/msiii/.gemini/antigravity/brain/79952730-546d-40bb-92f0-abe76cc02fc1/.user_uploaded/media_1793693700215_3792e2d3.jpg"
    im1 = Image.open(im1_path)
    im1_gray = np.array(im1.convert("L"))
    
    # Segmentation of Image 1
    bright = im1_gray > 235
    top_closed = nd.binary_closing(bright, structure=np.ones((9, 9)))
    top_mask = nd.binary_fill_holes(top_closed)
    lines_mask = top_mask & (im1_gray < 235) & (im1_gray > 185)
    
    # District segmentations (18 districts)
    districts = top_mask & (~lines_mask)
    labeled_districts, num_districts = nd.label(districts)
    
    # District pastel color palettes
    pastel_tints = [
        [254, 243, 228],
        [252, 238, 220],
        [255, 246, 234],
        [250, 235, 215],
        [253, 241, 225],
        [251, 237, 218]
    ]
    
    dilated_top = nd.binary_dilation(top_mask, structure=np.ones((35, 35)))
    bg_diff = np.abs(im1_gray.astype(float) - 158.0)
    slab_mask = dilated_top & (bg_diff > 8)
    shadow_mask = dilated_top & (~top_mask) & (im1_gray < 155)
    shadow_intensity = np.clip((158.0 - im1_gray) / 100.0, 0, 1)
    
    # Build warm colorized 3D base
    h1, w1 = im1_gray.shape
    c_base = np.zeros((h1, w1, 4), dtype=np.uint8)
    
    for y in range(h1):
        for x in range(w1):
            if top_mask[y, x]:
                if lines_mask[y, x]:
                    # Warm district boundary line
                    c_base[y, x] = [218, 185, 145, 255]
                else:
                    # District pastel coloring
                    d_id = labeled_districts[y, x]
                    tint = pastel_tints[d_id % len(pastel_tints)]
                    c_base[y, x] = [tint[0], tint[1], tint[2], 255]
            elif shadow_mask[y, x]:
                # Translucent ambient shadow
                s = int(shadow_intensity[y, x] * 125)
                c_base[y, x] = [40, 55, 75, s]
            elif slab_mask[y, x]:
                # 3D side extrusion bevel
                factor = (im1_gray[y, x] - 120) / 80.0 * 0.4 + 0.7
                col = np.array([195, 155, 120], dtype=float) * factor
                c_base[y, x] = [int(np.clip(col[0], 0, 255)), int(np.clip(col[1], 0, 255)), int(np.clip(col[2], 0, 255)), 255]

    base_layer = Image.fromarray(c_base, mode="RGBA")
    
    # Target scale: 2.72x
    scale = 2.72
    target_w = int(w1 * scale)
    target_h = int(h1 * scale)
    base_scaled = base_layer.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Position map slab
    MAP_OX = 10
    MAP_OY = 320
    canvas.paste(base_scaled, (MAP_OX, MAP_OY), base_scaled)
    
    def to_canvas(x, y):
        return (int(MAP_OX + x * scale), int(MAP_OY + y * scale))
    
    draw = ImageDraw.Draw(canvas)
    
    # ========================================================
    # 2. Subtle District Name Labels (Honoring Map 1's 18 districts)
    # ========================================================
    print("Labeling districts...")
    district_names = {
        1: "อ.บ้านม่วง",
        2: "อ.คำตากล้า",
        3: "อ.อากาศอำนวย",
        4: "อ.เจริญศิลป์",
        5: "อ.วานรนิวาส",
        6: "อ.สว่างแดนดิน",
        7: "อ.พังโคน",
        8: "อ.กุสุมาลย์",
        9: "อ.พรรณานิคม",
        10: "อ.ส่องดาว",
        11: "อ.วาริชภูมิ",
        12: "อ.โพนนาแก้ว",
        13: "อ.นิคมน้ำอูน",
        14: "อ.เมืองสกลนคร",
        15: "อ.กุดบาก",
        16: "อ.โคกศรีสุพรรณ",
        17: "อ.เต่างอย",
        18: "อ.ภูพาน"
    }
    
    # Centroids of the 18 districts
    district_centroids = [
        (1, 157.6, 123.5),
        (2, 255.3, 146.2),
        (3, 324.8, 202.1),
        (4, 158.7, 202.4),
        (5, 236.1, 206.0),
        (6, 126.0, 256.0),
        (7, 241.0, 278.4),
        (8, 438.4, 287.6),
        (9, 296.2, 300.3),
        (10, 125.1, 300.7),
        (11, 188.3, 318.2),
        (12, 454.5, 330.3),
        (13, 225.1, 342.7),
        (14, 374.8, 343.5),
        (15, 266.4, 371.1),
        (16, 447.3, 388.5),
        (17, 393.5, 413.9),
        (18, 309.1, 415.9)
    ]
    
    f_dist = get_font(16, bold=False)
    for did, cx, cy in district_centroids:
        # Don't overlap with major landmark labels
        if did not in [14]: # Skip Mueang text here since city marker will label it
            px, py = to_canvas(cx, cy)
            name = district_names.get(did, "")
            draw.text((px, py), name, font=f_dist, fill=(160, 135, 110, 180), anchor="mm")

    # ========================================================
    # 3. Natural Geographic Features (Nong Han, Mountains, Trees)
    # ========================================================
    print("Drawing environmental elements...")
    
    # 3.1 Lake Nong Han (บึงหนองหาร)
    nong_han_im1_pts = [
        (355, 270), (370, 266), (388, 274), (402, 286), (405, 300),
        (396, 312), (382, 318), (368, 312), (356, 302), (348, 288), (348, 276)
    ]
    nh_poly = [to_canvas(x, y) for (x, y) in nong_han_im1_pts]
    
    lake_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lake_draw = ImageDraw.Draw(lake_img)
    lake_draw.polygon(nh_poly, fill=(80, 195, 218, 255), outline=(55, 160, 180, 255))
    
    # Water ripples inside Nong Han
    center_nh = to_canvas(376, 292)
    for r_offset in [-30, -10, 10, 30]:
        rx, ry = center_nh[0] + r_offset * 1.5, center_nh[1] + r_offset
        lake_draw.arc([rx - 45, ry - 12, rx + 45, ry + 12], start=180, end=360, fill=(255, 255, 255, 150), width=3)
    
    # Water lilies & lotus
    lotus_pos = to_canvas(366, 284)
    lake_draw.ellipse([lotus_pos[0]-10, lotus_pos[1]-6, lotus_pos[0]+10, lotus_pos[1]+6], fill=(70, 160, 95, 220))
    lake_draw.ellipse([lotus_pos[0]-4, lotus_pos[1]-8, lotus_pos[0]+4, lotus_pos[1]-1], fill=(255, 140, 170, 240))
    
    canvas.paste(lake_img, (0, 0), lake_img)
    
    # Lake Label
    f_lake = get_font(26, bold=True)
    f_lake_en = get_font(18, bold=False)
    lake_lbl_pos = to_canvas(376, 323)
    draw.text((lake_lbl_pos[0], lake_lbl_pos[1]), "บึงหนองหาร", font=f_lake, fill=(25, 95, 120, 255), anchor="mm")
    draw.text((lake_lbl_pos[0], lake_lbl_pos[1] + 24), "Nong Han Lake", font=f_lake_en, fill=(40, 115, 140, 220), anchor="mm")
    
    # 3.2 Huai Yang Reservoir (อ่างเก็บน้ำห้วยยาง)
    hy_pts = [to_canvas(x, y) for x, y in [(292, 332), (300, 335), (298, 342), (290, 340), (288, 335)]]
    draw.polygon(hy_pts, fill=(90, 185, 210, 230), outline=(65, 150, 175, 240))
    draw.text(to_canvas(294, 348), "อ่างฯ ห้วยยาง", font=get_font(16, bold=True), fill=(35, 105, 125), anchor="mm")
    
    # 3.3 Nam Oon Reservoir (เขื่อนน้ำอูน)
    no_pts = [to_canvas(x, y) for x, y in [(190, 250), (205, 248), (212, 256), (202, 264), (192, 260)]]
    draw.polygon(no_pts, fill=(95, 190, 215, 220), outline=(70, 155, 180, 240))
    draw.text(to_canvas(202, 269), "เขื่อนน้ำอูน", font=get_font(16, bold=True), fill=(35, 105, 125), anchor="mm")
    
    # 3.4 Phu Phan Mountains (เทือกเขาภูพาน)
    def draw_mountain(cx, cy, size=34):
        top = (cx, cy - size)
        left = (cx - int(size * 1.1), cy + int(size * 0.5))
        right = (cx + int(size * 1.1), cy + int(size * 0.5))
        mid = (cx, cy + int(size * 0.5))
        # Left facet (sunny terracotta)
        draw.polygon([top, left, mid], fill=(208, 148, 118, 240), outline=(160, 105, 80, 200))
        # Right facet (shaded terracotta)
        draw.polygon([top, mid, right], fill=(168, 112, 88, 240), outline=(130, 80, 60, 200))
        # Snow/mist peak cap
        c_top = top
        c_left = (cx - int(size * 0.35), cy - int(size * 0.5))
        c_right = (cx + int(size * 0.35), cy - int(size * 0.5))
        draw.polygon([c_top, c_left, (cx, cy - int(size * 0.45)), c_right], fill=(255, 255, 255, 220))
        
    mountain_locs = [
        (265, 345), (250, 360), (275, 370), (240, 385), (260, 400),
        (280, 415), (295, 395), (230, 410), (245, 430), (265, 440),
        (305, 435), (325, 445), (170, 310), (185, 325)
    ]
    for mx, my in mountain_locs:
        px, py = to_canvas(mx, my)
        draw_mountain(px, py, size=36)
        
    mtn_lbl_pos = to_canvas(265, 420)
    draw.text((mtn_lbl_pos[0], mtn_lbl_pos[1]), "เทือกเขาภูพาน (Phu Phan Range)", font=get_font(21, bold=True), fill=(125, 75, 55, 240), anchor="mm")
    
    # 3.5 Forest Trees (ทิวสนและป่าไม้)
    def draw_tree(tx, ty, kind="pine", scale_t=1.0):
        if kind == "pine":
            draw.rectangle([tx-2*scale_t, ty+10*scale_t, tx+2*scale_t, ty+18*scale_t], fill=(130, 90, 60))
            for i, (w_t, h_t, off_y) in enumerate([(14, 12, 10), (11, 10, 2), (8, 9, -5)]):
                pts = [
                    (tx, ty + (off_y - h_t) * scale_t),
                    (tx - w_t * scale_t, ty + off_y * scale_t),
                    (tx + w_t * scale_t, ty + off_y * scale_t)
                ]
                draw.polygon(pts, fill=(58 + i*8, 145 + i*10, 95 + i*8), outline=(40, 105, 68))
        else:
            draw.rectangle([tx-2*scale_t, ty+8*scale_t, tx+2*scale_t, ty+16*scale_t], fill=(130, 90, 60))
            draw.ellipse([tx-12*scale_t, ty-10*scale_t, tx+12*scale_t, ty+10*scale_t], fill=(72, 168, 110), outline=(48, 125, 80))

    tree_locs = [
        (255, 335), (280, 350), (235, 365), (220, 395), (285, 380),
        (310, 410), (225, 435), (250, 450), (175, 295), (195, 335),
        (140, 220), (155, 205), (170, 160), (230, 150), (320, 190),
        (350, 220), (410, 260), (430, 310), (380, 360), (350, 390)
    ]
    for i, (tx, ty) in enumerate(tree_locs):
        px, py = to_canvas(tx, ty)
        kind = "pine" if i % 2 == 0 else "leafy"
        draw_tree(px, py, kind=kind, scale_t=1.2)

    # ========================================================
    # 4. Highways & Road Network
    # ========================================================
    print("Drawing highways & routes...")
    
    def draw_road(pts_im1, width=11, color=(255, 255, 255, 255), outline_color=(220, 190, 155, 200)):
        canvas_pts = [to_canvas(x, y) for (x, y) in pts_im1]
        draw.line(canvas_pts, fill=outline_color, width=width + 4, joint="curve")
        draw.line(canvas_pts, fill=color, width=width, joint="curve")
        
    def draw_route_shield(cx, cy, route_num):
        px, py = to_canvas(cx, cy)
        rw, rh = 46, 28
        draw.rounded_rectangle([px - rw//2, py - rh//2, px + rw//2, py + rh//2], radius=8, fill=(235, 120, 60, 240), outline=(255, 255, 255), width=2)
        draw.text((px, py), str(route_num), font=get_font(18, bold=True), fill=(255, 255, 255), anchor="mm")

    # Highway 22 (Udon Thani -> Sakon Nakhon -> Tha Rae -> Nakhon Phanom)
    hwy22_pts = [
        (45, 228), (95, 230), (145, 235), (190, 242), (240, 255), (285, 272),
        (325, 286), (345, 278), (362, 262), (395, 248), (430, 238), (475, 232), (510, 230)
    ]
    draw_road(hwy22_pts, width=12)
    draw_route_shield(160, 235, "22")
    draw_route_shield(440, 236, "22")
    
    # Highway 213 (Sakon Nakhon -> Phu Phan Royal Centre -> Kalasin)
    hwy213_pts = [
        (325, 286), (308, 305), (290, 326), (275, 350), (255, 380), (235, 415), (210, 440), (195, 455)
    ]
    draw_road(hwy213_pts, width=11)
    draw_route_shield(255, 385, "213")

    # Highway 223 (Sakon Nakhon -> Non Hom -> Na Kae / Mukdahan)
    hwy223_pts = [
        (325, 286), (338, 315), (350, 340), (360, 355), (375, 385), (395, 420), (410, 450)
    ]
    draw_road(hwy223_pts, width=10)
    draw_route_shield(380, 395, "223")

    # Lakeside Route to Ban Tha Wat (Wat Klang & Wat Nuea)
    hwy_thawat_pts = [
        (325, 286), (345, 298), (365, 306), (385, 296), (390, 306), (405, 318), (430, 335), (465, 345)
    ]
    draw_road(hwy_thawat_pts, width=8, color=(255, 255, 255, 230))
    draw_route_shield(425, 335, "2028")

    # Secondary Routes
    draw_road([(190, 242), (185, 190), (180, 140), (175, 95)], width=9) # Hwy 222
    draw_route_shield(182, 160, "222")

    draw_road([(145, 235), (135, 275), (120, 320), (105, 355)], width=8) # Hwy 227
    draw_route_shield(125, 305, "227")

    draw_road([(180, 140), (225, 130), (280, 125), (325, 120)], width=7) # Hwy 2096
    draw_road([(345, 278), (355, 215), (360, 165)], width=7) # Hwy 2094
    draw_road([(362, 262), (375, 240), (385, 210)], width=7) # Hwy 2355

    # Sakon Nakhon City Center
    city_pt = to_canvas(325, 286)
    draw.ellipse([city_pt[0]-14, city_pt[1]-14, city_pt[0]+14, city_pt[1]+14], fill=(245, 140, 50), outline=(255, 255, 255), width=3)
    draw.ellipse([city_pt[0]-6, city_pt[1]-6, city_pt[0]+6, city_pt[1]+6], fill=(255, 255, 255))
    draw.text((city_pt[0] - 18, city_pt[1] + 18), "อ.เมืองสกลนคร", font=get_font(20, bold=True), fill=(60, 45, 30))

    # ========================================================
    # 5. The 5 Key Cultural Landmarks (Accurately Located)
    # ========================================================
    print("Drawing the 5 key cultural landmarks...")
    
    # 5 Landmark definitions (อ้างอิงข้อมูลภูมิสัณฐาน & ระดับความสูงจาก มิตรเอิร์ธ - MitrEarth)
    landmarks = [
        {
            "id": 1,
            "name_th": "ชุมชนท่าแร่ (บ้านท่าแร่)",
            "name_en": "Baan Tha Rae Community",
            "tag": "สันดอนทรายขอบแอ่งหนองหาร • 163 ม. รทก.",
            "pos_im1": (362, 262),
            "label_anchor": "top-left",
            "badge_pos": (-140, -90),
            "icon_type": "church",
            "geo_detail": "ภูมิสัณฐาน: สันดอนทรายชายฝั่งโบราณขอบแอ่งยุบตัวหนองหารด้านเหนือ ยกตัวสูงน้ำไม่ท่วม",
            "desc": "ชุมชนคาทอลิกที่ใหญ่ที่สุดในไทย ตึกโบราณสไตล์โคโลเนียลกว่า 100 ปี และเทศกาลแห่ดาวคริสต์มาส"
        },
        {
            "id": 2,
            "name_th": "ท่าวัด (วัดกลางศรีเชียงใหม่)",
            "name_en": "Wat Klang Si Chiang Mai",
            "tag": "ลานตะพักตะกอนน้ำพาริมหนองหาร • 160 ม. รทก.",
            "pos_im1": (390, 306),
            "label_anchor": "bottom",
            "badge_pos": (-60, 65),
            "icon_type": "sim",
            "geo_detail": "ภูมิสัณฐาน: ลานตะพักตะกอนน้ำพาริมทะเลสาบฝั่งใต้ ชั้นดินเหนียวปนศิลาแลงริมหนองหาร",
            "desc": "ศูนย์รวมจิตใจชุมชนท่าวัด สิมโบราณศิลปะล้านช้างอันวิจิตร และคันทวยแกะสลักไม้โบราณริมหนองหาร"
        },
        {
            "id": 3,
            "name_th": "ท่าวัด (วัดมหาพรหมโพธิราช)",
            "name_en": "Wat Maha Phrom Phothirat",
            "tag": "ตะพักศิลาแลงริมขอบหนองหาร • 161 ม. รทก.",
            "pos_im1": (385, 296),
            "label_anchor": "left",
            "badge_pos": (-260, -35),
            "icon_type": "sema",
            "geo_detail": "ภูมิสัณฐาน: ตะพักศิลาแลงริมหนองหาร แหล่งสะสมตัวหินศิลาแลงยุคทวารวดีริมขอบแอ่ง",
            "desc": "วัดโบราณคู่เมืองสกลนคร แหล่งโบราณคดีกลุ่มใบเสมาศิลาแลงทวารวดีและซากโบราณสถานริมฝั่งหนองหาร"
        },
        {
            "id": 4,
            "name_th": "ชุมชนโนนหอม (บ้านโนนหอม)",
            "name_en": "Baan Non Hom Community",
            "tag": "เนินดอนลอนลูกคลื่นหินทราย • 172 ม. รทก.",
            "pos_im1": (360, 355),
            "label_anchor": "bottom-left",
            "badge_pos": (-180, 50),
            "icon_type": "textile",
            "geo_detail": "ภูมิสัณฐาน: ที่ดอนลอนลูกคลื่นหินทรายปนศิลาแลงทางใต้ สภาพดินระบายน้ำดีเหมาะปลูกคราม",
            "desc": "วิถีชีวิตชนเผ่าภูไทโบราณ ภูมิปัญญาการย้อมครามธรรมชาติ ทอผ้าลายมัดหมี่ และศูนย์วัฒนธรรมชนเผ่า"
        },
        {
            "id": 5,
            "name_th": "ศูนย์ศึกษาการพัฒนาภูพานฯ",
            "name_en": "Phu Phan Royal Study Centre",
            "tag": "ลาดตะพักเชิงเขาภูพาน • 215 ม. รทก.",
            "pos_im1": (290, 326),
            "label_anchor": "left",
            "badge_pos": (-260, -45),
            "icon_type": "royal",
            "geo_detail": "ภูมิสัณฐาน: ลาดเชิงเขาปะทะ (Piedmont Slope) เทือกเขาภูพาน บริเวณปากอ่างเก็บน้ำห้วยยาง",
            "desc": "ต้นแบบการพัฒนาเกษตรตามแนวพระราชดำริ แหล่งกำเนิด '3 ดำมหัศจรรย์' (ไก่ดำ หมูดำ วัวดำทาจิมะ)"
        }
    ]

    def draw_landmark_icon(ix, iy, icon_type, size=28):
        if icon_type == "church":
            # Church building: nave, bell tower, cross, golden Christmas star
            draw.rectangle([ix-14, iy-4, ix+14, iy+14], fill=(245, 235, 220), outline=(130, 90, 60), width=2)
            draw.rectangle([ix-6, iy-20, ix+6, iy-4], fill=(230, 215, 195), outline=(130, 90, 60), width=2)
            draw.polygon([(ix-8, iy-20), (ix, iy-32), (ix+8, iy-20)], fill=(195, 75, 60), outline=(130, 90, 60), width=2)
            draw.line([(ix, iy-38), (ix, iy-32)], fill=(215, 160, 40), width=3)
            draw.line([(ix-4, iy-36), (ix+4, iy-36)], fill=(215, 160, 40), width=3)
            # Golden Christmas Star badge beside it
            sx, sy = ix + 18, iy - 22
            draw.polygon([(sx, sy-10), (sx+3, sy-3), (sx+10, sy), (sx+3, sy+3), (sx, sy+10), (sx-3, sy+3), (sx-10, sy), (sx-3, sy-3)], fill=(255, 210, 40), outline=(215, 140, 20), width=1)
        elif icon_type == "sim":
            # Lan Xang Sim: Tiered temple roof, golden spire
            draw.rectangle([ix-12, iy+2, ix+12, iy+14], fill=(245, 240, 230), outline=(120, 80, 40), width=2)
            draw.polygon([(ix-18, iy+2), (ix, iy-10), (ix+18, iy+2)], fill=(215, 110, 50), outline=(140, 60, 20), width=2)
            draw.polygon([(ix-14, iy-6), (ix, iy-18), (ix+14, iy-6)], fill=(195, 80, 30), outline=(130, 50, 15), width=2)
            draw.line([(ix, iy-26), (ix, iy-18)], fill=(245, 190, 35), width=3)
            draw.ellipse([ix-3, iy-28, ix+3, iy-22], fill=(255, 215, 45))
        elif icon_type == "sema":
            # Dvaravati Stone Bai Sema
            draw.rectangle([ix-14, iy+8, ix+14, iy+14], fill=(160, 155, 150), outline=(90, 85, 80), width=2)
            draw.ellipse([ix-12, iy+4, ix+12, iy+10], fill=(215, 145, 120))
            draw.polygon([(ix-10, iy+4), (ix-10, iy-14), (ix, iy-28), (ix+10, iy-14), (ix+10, iy+4)], fill=(190, 180, 165), outline=(100, 90, 80), width=2)
            draw.line([(ix, iy-22), (ix, iy+2)], fill=(120, 110, 100), width=2)
            draw.ellipse([ix-4, iy-12, ix+4, iy-4], fill=(215, 175, 90))
        elif icon_type == "textile":
            # Traditional Phu Thai indigo dress & Praewa sash
            draw.polygon([(ix-12, iy+14), (ix-8, iy-8), (ix+8, iy-8), (ix+12, iy+14)], fill=(35, 60, 120), outline=(15, 30, 75), width=2)
            draw.polygon([(ix-8, iy-8), (ix-2, iy-8), (ix+10, iy+12), (ix+4, iy+14)], fill=(225, 55, 55), outline=(160, 30, 30), width=1)
            draw.ellipse([ix+10, iy-12, ix+18, iy-4], fill=(55, 120, 85), outline=(30, 80, 50))
        elif icon_type == "royal":
            # Royal yellow golden medallion & 3 Black Animals silhouette
            draw.ellipse([ix-16, iy-16, ix+16, iy+16], fill=(255, 220, 60), outline=(210, 150, 20), width=2)
            draw.ellipse([ix-8, iy-4, ix+8, iy+8], fill=(35, 35, 40))
            draw.ellipse([ix-12, iy-8, ix-4, iy], fill=(35, 35, 40))
            draw.polygon([(ix, iy-18), (ix+8, iy-10), (ix, iy-6)], fill=(50, 165, 80))
            draw.polygon([(ix, iy-18), (ix-8, iy-10), (ix, iy-6)], fill=(75, 185, 95))

    for item in landmarks:
        c_pos = to_canvas(*item["pos_im1"])
        cx, cy = c_pos
        
        # 1. Pulsing map pin halo
        draw.ellipse([cx-24, cy-24, cx+24, cy+24], fill=(255, 107, 74, 80))
        draw.ellipse([cx-17, cy-17, cx+17, cy+17], fill=(255, 107, 74, 255), outline=(255, 255, 255), width=3)
        draw.text((cx, cy), str(item["id"]), font=get_font(21, bold=True), fill=(255, 255, 255), anchor="mm")
        
        # 2. Callout pill badge
        off_x, off_y = item["badge_pos"]
        bx0 = cx + off_x
        by0 = cy + off_y
        
        f_th = get_font(20, bold=True)
        f_sub = get_font(14, bold=False)
        
        th_w = int(draw.textlength(item["name_th"], font=f_th))
        sub_w = int(draw.textlength(item["tag"], font=f_sub))
        bw = max(th_w, sub_w) + 75
        bh = 58
        bx1 = bx0 + bw
        by1 = by0 + bh
        
        # Draw connector pointer line
        draw.line([(cx, cy), (bx0 + 25, by0 + bh//2)], fill=(255, 107, 74, 220), width=3)
        
        # Shadowed badge
        draw_shadowed_rounded_rect(canvas, (bx0, by0, bx1, by1), radius=16, fill=(255, 255, 255, 245), shadow_color=(0, 0, 0, 35), offset=(0, 4), blur=8)
        draw = ImageDraw.Draw(canvas)
        draw.rounded_rectangle([bx0, by0, bx1, by1], radius=16, outline=(235, 215, 195), width=2)
        
        # Number badge on the card
        draw.ellipse([bx0+12, by0+12, bx0+44, by0+44], fill=(255, 107, 74), outline=(255, 255, 255), width=2)
        draw.text((bx0+28, by0+28), str(item["id"]), font=get_font(18, bold=True), fill=(255, 255, 255), anchor="mm")
        
        # Text inside badge
        draw.text((bx0+54, by0+8), item["name_th"], font=f_th, fill=(40, 45, 55))
        draw.text((bx0+54, by0+32), item["tag"], font=f_sub, fill=(110, 90, 75))
        
        # Landmark icon next to label badge
        draw_landmark_icon(bx1 + 18, by0 + 28, item["icon_type"])

    # ========================================================
    # 6. Right Infographic Legend Card (Image 2 style)
    # ========================================================
    print("Drawing right infographic sidebar card...")
    
    card_x0, card_y0 = 1380, 320
    card_w, card_h = 560, 1340
    card_x1, card_y1 = card_x0 + card_w, card_y0 + card_h
    
    # Shadow and card background
    draw_shadowed_rounded_rect(canvas, (card_x0, card_y0, card_x1, card_y1), radius=30, fill=(255, 255, 255, 245), shadow_color=(0, 0, 0, 45), offset=(0, 8), blur=16)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=30, outline=(225, 232, 240), width=2)
    
    # Card Header
    draw.ellipse([card_x0 + 32, card_y0 + 28, card_x0 + 80, card_y0 + 76], fill=(255, 107, 74), outline=(255, 255, 255), width=3)
    draw.text((card_x0 + 56, card_y0 + 52), "★", font=get_font(26, bold=True), fill=(255, 255, 255), anchor="mm")
    
    draw.text((card_x0 + 98, card_y0 + 26), "5 แหล่งอัตลักษณ์สำคัญ", font=get_font(28, bold=True), fill=(35, 45, 60))
    draw.text((card_x0 + 98, card_y0 + 60), "5 CULTURAL IDENTITIES OF SAKON NAKHON", font=get_font(14, bold=True), fill=(130, 145, 160))
    
    draw.line([(card_x0 + 32, card_y0 + 95), (card_x1 - 32, card_y0 + 95)], fill=(235, 240, 245), width=2)
    
    # 5 Legend Items
    item_y = card_y0 + 115
    item_spacing = 238
    
    for item in landmarks:
        ix0, iy0 = card_x0 + 22, item_y
        ix1, iy1 = card_x1 - 22, item_y + 218
        
        draw.rounded_rectangle([ix0, iy0, ix1, iy1], radius=20, fill=(248, 250, 253), outline=(230, 236, 244), width=1)
        
        # Number Badge
        draw.ellipse([ix0 + 20, iy0 + 22, ix0 + 64, iy0 + 66], fill=(255, 107, 74), outline=(255, 255, 255), width=2)
        draw.text((ix0 + 42, iy0 + 44), str(item["id"]), font=get_font(24, bold=True), fill=(255, 255, 255), anchor="mm")
        
        # Illustrated Icon on top right
        draw_landmark_icon(ix1 - 45, iy0 + 44, item["icon_type"], size=32)
        
        # Titles
        draw.text((ix0 + 78, iy0 + 18), item["name_th"], font=get_font(22, bold=True), fill=(35, 45, 60))
        draw.text((ix0 + 78, iy0 + 45), item["name_en"], font=get_font(16, bold=False), fill=(115, 125, 140))
        
        # Category Tag pill
        tag_w = int(draw.textlength(item["tag"], font=get_font(14, bold=True))) + 26
        draw.rounded_rectangle([ix0 + 24, iy0 + 78, ix0 + 24 + tag_w, iy0 + 108], radius=12, fill=(255, 240, 235), outline=(255, 205, 190), width=1)
        draw.text((ix0 + 36, iy0 + 86), item["tag"], font=get_font(14, bold=True), fill=(215, 75, 45))
        
        # Description lines
        desc_lines = [
            item["desc"][:46],
            item["desc"][46:]
        ]
        draw.text((ix0 + 24, iy0 + 122), desc_lines[0], font=get_font(15, bold=False), fill=(80, 90, 105))
        if len(desc_lines) > 1 and desc_lines[1]:
            draw.text((ix0 + 24, iy0 + 148), desc_lines[1], font=get_font(15, bold=False), fill=(80, 90, 105))
            
        # 3D AR Ready indicator & Geomorphology
        draw.rounded_rectangle([ix0 + 24, iy0 + 180, ix0 + 155, iy0 + 206], radius=8, fill=(235, 245, 255))
        draw.text((ix0 + 32, iy0 + 185), "📱 WebAR Ready", font=get_font(12, bold=True), fill=(40, 120, 200))

        geo_short = item["tag"]
        geo_w = int(draw.textlength(geo_short, font=get_font(12, bold=True))) + 20
        draw.rounded_rectangle([ix0 + 165, iy0 + 180, ix0 + 165 + geo_w, iy0 + 206], radius=8, fill=(240, 248, 242))
        draw.text((ix0 + 175, iy0 + 185), f"🌍 {geo_short}", font=get_font(12, bold=True), fill=(40, 125, 70))
        
        item_y += item_spacing

    # Footer source badge inside right card
    draw.rounded_rectangle([card_x0 + 22, card_y1 - 38, card_x1 - 22, card_y1 - 10], radius=8, fill=(242, 246, 252), outline=(220, 230, 242), width=1)
    draw.text(((card_x0 + card_x1)//2, card_y1 - 24), "ข้อมูลภูมิสัณฐาน & DEM: มิตรเอิร์ธ (MitrEarth)", font=get_font(13, bold=True), fill=(95, 115, 140), anchor="mm")

    # ========================================================
    # 7. Header, Navigation, Compass Rose & Province Signs
    # ========================================================
    print("Drawing header, compass rose and province directions...")
    
    # 7.1 Top Header
    title_font = get_font(88, bold=True)
    sub_font = get_font(30, bold=True)
    draw.text((80, 65), "สกลนคร", font=title_font, fill=(45, 55, 72))
    draw.text((82, 165), "S A K O N   N A K H O N", font=sub_font, fill=(105, 120, 140))
    
    draw.rounded_rectangle([80, 215, 680, 258], radius=14, fill=(255, 255, 255, 235), outline=(215, 225, 235), width=1)
    draw.text((100, 225), "📍 แผนที่ 5 แหล่งอัตลักษณ์ตามภูมิสัณฐานจริง (อ้างอิง: มิตรเอิร์ธ MitrEarth)", font=get_font(18, bold=True), fill=(55, 75, 95))
    
    # Navigation Pills (Home, Map) like in Image 2
    draw.rounded_rectangle([80, 275, 210, 320], radius=16, fill=(255, 255, 255), outline=(215, 225, 235), width=2)
    draw.text((110, 286), "🏠  HOME", font=get_font(17, bold=True), fill=(80, 95, 115))
    
    draw.rounded_rectangle([225, 275, 355, 320], radius=16, fill=(255, 255, 255), outline=(215, 225, 235), width=2)
    draw.text((255, 286), "📍  MAP", font=get_font(17, bold=True), fill=(80, 95, 115))

    # 7.2 Compass Rose in Top-Right
    comp_x, comp_y = 1860, 150
    draw.ellipse([comp_x - 55, comp_y - 55, comp_x + 55, comp_y + 55], fill=(255, 255, 255, 240), outline=(210, 220, 232), width=3)
    draw.ellipse([comp_x - 45, comp_y - 45, comp_x + 45, comp_y + 45], fill=None, outline=(230, 238, 245), width=2)
    
    # North Arrow
    draw.polygon([(comp_x, comp_y - 40), (comp_x - 12, comp_y), (comp_x, comp_y - 8)], fill=(245, 95, 55))
    draw.polygon([(comp_x, comp_y - 40), (comp_x + 12, comp_y), (comp_x, comp_y - 8)], fill=(220, 65, 30))
    # South Arrow
    draw.polygon([(comp_x, comp_y + 40), (comp_x - 12, comp_y), (comp_x, comp_y + 8)], fill=(155, 170, 185))
    draw.polygon([(comp_x, comp_y + 40), (comp_x + 12, comp_y), (comp_x, comp_y + 8)], fill=(125, 140, 155))
    
    draw.text((comp_x, comp_y - 75), "N", font=get_font(28, bold=True), fill=(60, 75, 95), anchor="mm")

    # 7.3 Directional Signs to Neighboring Provinces (Image 2 style)
    def draw_dir_sign(x, y, line1, line2, arrow=""):
        f1 = get_font(22, bold=True)
        f2 = get_font(16, bold=False)
        w_box = max(int(draw.textlength(line1, font=f1)), int(draw.textlength(line2, font=f2))) + 50
        h_box = 64
        draw.rounded_rectangle([x - w_box//2, y - h_box//2, x + w_box//2, y + h_box//2], radius=14, fill=(255, 255, 255, 220), outline=(210, 222, 235), width=2)
        draw.text((x, y - 12), f"{arrow} {line1}".strip(), font=f1, fill=(60, 85, 115), anchor="mm")
        draw.text((x, y + 15), line2, font=f2, fill=(110, 130, 155), anchor="mm")

    draw_dir_sign(130, 960, "ไป จ.อุดรธานี", "To Udon Thani", arrow="←")
    draw_dir_sign(150, 1260, "ไป จ.อุดรธานี", "To Udon Thani", arrow="←")
    draw_dir_sign(740, 230, "ไป จ.หนองคาย / จ.บึงกาฬ", "To Nong Khai & Bueng Kan", arrow="↑")
    draw_dir_sign(1240, 820, "ไป จ.นครพนม", "To Nakhon Phanom", arrow="→")
    draw_dir_sign(1260, 1480, "จ.นครพนม", "Nakhon Phanom", arrow="")
    draw_dir_sign(390, 1860, "ไป จ.กาฬสินธุ์", "To Kalasin", arrow="↙")
    draw_dir_sign(1120, 1890, "ไป จ.มุกดาหาร", "To Mukdahan", arrow="↘")

    # ========================================================
    # 8. Save High-Resolution Map Files
    # ========================================================
    print("Saving high-resolution master map...")
    os.makedirs("c:/เว็ปฝึกงาน/assets", exist_ok=True)
    out_web_path = "c:/เว็ปฝึกงาน/assets/sakon_nakhon_5identities_map.png"
    canvas.save(out_web_path, "PNG", quality=95)
    print(f"Saved: {out_web_path}")

    out_artifact_path = "C:/Users/msiii/.gemini/antigravity/brain/79952730-546d-40bb-92f0-abe76cc02fc1/sakon_nakhon_5identities_map.png"
    canvas.save(out_artifact_path, "PNG", quality=95)
    print(f"Saved: {out_artifact_path}")
    print("Master map generation completed successfully!")

if __name__ == "__main__":
    main()
