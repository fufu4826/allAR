# AllAR — คลังภูมิปัญญาชุมชน 3D/AR

> **🤖 ถึง AI ผู้ช่วยของสมาชิกทีม:** ถ้าคุณได้รับลิงก์ repo นี้ ให้อ่าน [`docs/team/AI-GUIDE.md`](docs/team/AI-GUIDE.md) ก่อนตอบ แล้วทำตามขั้นตอนเริ่มแชทในคู่มือนั้น (ถามหน้าที่ → งานที่ค้าง → งานรอบนี้)
> **👥 สมาชิกทีม:** เริ่มแชทใหม่กับ AI ตัวไหนก็ได้ แล้วส่งลิงก์ https://github.com/fufu4826/allAR พร้อมพิมพ์ว่า "อ่านคู่มือทีมแล้วเริ่มงาน"

เว็บแอปแสดงวัตถุพิพิธภัณฑ์ ผลิตภัณฑ์ ภูมิปัญญา และสถานที่ของ 5 ชุมชนในจังหวัดสกลนครเป็นโมเดล 3 มิติ ดูผ่าน AR บนมือถือได้ มีเสียงบรรยาย (audio guide) และแผนที่ชุมชน
จัดทำสำหรับสถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร

- ผู้ชมทั่วไปใช้งานได้โดยไม่ต้องล็อกอิน: แผนที่ชุมชน → ชุมชน → ชิ้นงาน 3D / AR / เสียงบรรยาย / ค้นหา
- ผู้ดูแลจัดการเนื้อหาที่ `/admin`: ชุมชน หมวดหมู่ ชิ้นงาน (อัปโหลด GLB, USDZ, รูป, เสียง) ผู้ดูแล และบันทึกการใช้งาน

## ติดตั้งบนเซิร์ฟเวอร์

repository นี้ใช้พัฒนา ส่วนที่ส่งมอบให้ สวท. ติดตั้งอยู่ที่ repository แยก **[fufu4826/sakon-learning-sites-3d](https://github.com/fufu4826/sakon-learning-sites-3d)** ซึ่งมีเฉพาะ `deploy/` และ `web/` คู่มือติดตั้งอยู่ใน **[deploy/README.md](deploy/README.md)**

ฐานข้อมูลตั้งต้น (`allar_db.sql.gz`) และไฟล์สื่อ (`uploads.zip`) ไม่อยู่ใน repository ใดเลย จะจัดส่งแยกพร้อม `SHA256SUMS.txt`

### ออกรุ่นใหม่ให้ repository ส่งมอบ

```bash
git clone https://github.com/fufu4826/sakon-learning-sites-3d.git ../sakon-learning-sites-3d
sh tools/release/export-delivery.sh ../sakon-learning-sites-3d     # ส่งออกจาก commit ปัจจุบัน
cd ../sakon-learning-sites-3d
git add -A && git commit -m "รุ่น 1.1.0: <สรุปสิ่งที่เปลี่ยน>"
git tag -a v1.1.0 -m "รุ่น 1.1.0" && git push origin main --tags
```

สคริปต์ส่งออกเฉพาะไฟล์ที่ commit แล้ว และจะหยุดถ้าพบร่องรอยของเครื่องมือพัฒนาหรือเซิร์ฟเวอร์ทดสอบในไฟล์ที่จะส่ง แก้ไฟล์ต้นทางใน repository นี้แล้วส่งออกใหม่ ห้ามแก้ใน repository ส่งมอบโดยตรง เพราะจะถูกเขียนทับในรุ่นถัดไป

## โครงสร้าง

| โฟลเดอร์ | เนื้อหา |
| :--- | :--- |
| `web/` | Next.js 16 (App Router) + Drizzle ORM + MariaDB, `@google/model-viewer`, Leaflet |
| `web/drizzle/` | migration ของฐานข้อมูล (รันอัตโนมัติเมื่อ container web เริ่มทำงาน) |
| `deploy/` | `docker-compose.yml`, สำรอง/กู้คืนอัตโนมัติ, สคริปต์นำเข้าข้อมูล, คู่มือติดตั้ง |
| `design/ar-heritage/` | ต้นแบบดีไซน์ HTML/CSS ของทีมหน้าบ้าน (แบบของหน้าเว็บ) |
| `docs/team/` | คู่มือทีมสำหรับ AI ผู้ช่วยของสมาชิก |
| `docs/plan/` | แผนงานและ prompt ที่ใช้สั่งงาน |
| `tools/bundle/` | เครื่องมือสร้างชุดข้อมูลส่งมอบ |
| `tools/release/` | สคริปต์และไฟล์ต้นแบบสำหรับส่งออกไป repository ส่งมอบ |

## พัฒนาบนเครื่อง

ต้องมี Node.js 24 และ MariaDB (ใช้ stack ใน `deploy/` ได้ หรือฐานข้อมูลของตัวเอง)

```bash
cd web
npm ci
# สร้าง web/.env.local เช่น
#   DATABASE_URL=mysql://<ผู้ใช้>:<รหัสผ่าน>@127.0.0.1:3306/<ฐานข้อมูล>
#   UPLOAD_DIR=<โฟลเดอร์เก็บไฟล์สื่อ>
npm run db:migrate
npm run db:seed        # ข้อมูลตั้งต้นจาก src/data (ชุมชนภูพาน + ชุมชน 2–5 ยังไม่เผยแพร่)
node scripts/create-admin.mjs <ชื่อผู้ใช้> "<ชื่อที่แสดง>"
npm run dev
npm test
```

สร้างชุดข้อมูลส่งมอบใหม่จากเว็บจริง: `python tools/bundle/make_delivery.py <dump.sql> <โฟลเดอร์ uploads> data-bundle/delivery` (ใส่เฉพาะไฟล์ที่ฐานข้อมูลอ้างถึง และหยุดถ้าไฟล์ใดหาย)
