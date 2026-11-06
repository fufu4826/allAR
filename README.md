# AllAR — คลังภูมิปัญญาชุมชน 3D/AR

> **🤖 ถึง AI ผู้ช่วยของสมาชิกทีม:** ถ้าคุณได้รับลิงก์ repo นี้ ให้อ่าน [`docs/team/AI-GUIDE.md`](docs/team/AI-GUIDE.md) ก่อนตอบ แล้วทำตามขั้นตอนเริ่มแชทในคู่มือนั้น (ถามหน้าที่ → งานที่ค้าง → งานรอบนี้)
> **👥 สมาชิกทีม:** เริ่มแชทใหม่กับ AI ตัวไหนก็ได้ แล้วส่งลิงก์ https://github.com/fufu4826/allAR พร้อมพิมพ์ว่า "อ่านคู่มือทีมแล้วเริ่มงาน"

เว็บแอปแสดงวัตถุพิพิธภัณฑ์ ผลิตภัณฑ์ ภูมิปัญญา และสถานที่ของ 5 ชุมชนในจังหวัดสกลนครเป็นโมเดล 3 มิติ ดูผ่าน AR บนมือถือได้ มีเสียงบรรยาย (audio guide) และแผนที่ชุมชน
จัดทำสำหรับสถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร

- ผู้ชมทั่วไปใช้งานได้โดยไม่ต้องล็อกอิน: แผนที่ชุมชน → ชุมชน → ชิ้นงาน 3D / AR / เสียงบรรยาย / ค้นหา
- ผู้ดูแลจัดการเนื้อหาที่ `/admin`: ชุมชน หมวดหมู่ ชิ้นงาน (อัปโหลด GLB, USDZ, รูป, เสียง) ผู้ดูแล และบันทึกการใช้งาน

## ติดตั้งบนเซิร์ฟเวอร์

ใช้ Docker Compose เท่านั้น ดูขั้นตอนทั้งหมดใน **[deploy/README.md](deploy/README.md)**

```bash
git clone https://github.com/fufu4826/allAR.git
cd allAR/deploy
cp .env.example .env    # แล้วกรอกรหัสผ่าน (openssl rand -hex 24)
docker compose up -d --build
```

ฐานข้อมูลตั้งต้น (`allar_db.sql.gz`) และไฟล์สื่อ (`uploads.zip`) ไม่อยู่ใน repository นี้ จะจัดส่งแยกพร้อม `SHA256SUMS.txt`

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

สร้าง `uploads.zip` สำหรับส่งมอบใหม่: `python tools/bundle/make_uploads_zip.py` (ตรวจว่าไฟล์ทุกไฟล์ที่ฐานข้อมูลอ้างถึงมีอยู่จริง)
