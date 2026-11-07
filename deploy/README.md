# คู่มือการติดตั้งและดูแลระบบ AllAR (Production Deployment Guide)

คู่มือนี้จัดทำขึ้นสำหรับเจ้าหน้าที่ฝ่ายเทคโนโลยีสารสนเทศ (IT) ของมหาวิทยาลัย สำหรับใช้ติดตั้ง กำหนดค่า สำรองข้อมูล และดูแลรักษาระบบ AllAR บนเซิร์ฟเวอร์ โดยใช้ Docker และ Docker Compose

> [!NOTE]
> ระบบกำหนดชื่อ Compose Project ไว้อย่างตายตัวว่า `name: allar` ส่งผลให้คอนเทนเนอร์จะมีชื่อนำหน้าเป็น `allar-web-1`, `allar-mariadb-1`, `allar-backup-1`, `allar-phpmyadmin-1` และ Volumes จะใช้ชื่อ `allar_db_data` และ `allar_uploads`
> **คำสั่งทั้งหมดในคู่มือนี้ต้องเรียกใช้งานจากภายในไดเรกทอรี `deploy/` เสมอ**

---

## 1. ภาพรวมระบบ (Architecture Overview)

ระบบ AllAR ประกอบด้วยบริการใน Docker Container ที่ทำงานร่วมกันผ่านบริดจ์เน็ตเวิร์กภายใน (`internal`) โดยไม่เปิดเผยพอร์ตฐานข้อมูลสู่ภายนอกเครื่อง:

```text
                      +---------------------------------------+
                      |             ผู้ใช้งาน / Client          |
                      +-------------------+-------------------+
                                          |
                                    HTTPS (443)
                                          v
                      +---------------------------------------+
                      |     Reverse Proxy (Nginx / Host)      |
                      +-------------------+-------------------+
                                          |
                               HTTP (127.0.0.1:3000)
                                          v
+================================= Docker (allar) =================================+
|                                                                                  |
|   +--------------------------+                     +-------------------------+   |
|   |       allar-web-1        |                     |      allar-backup-1     |   |
|   |    (Node.js / Next.js)   |                     |     (MariaDB Client     |   |
|   |      127.0.0.1:3000      |                     |    + Cron / Restore)    |   |
|   +------------+-------------+                     +------------+------------+   |
|                |                                                |                |
|                | (DATABASE_URL)                                 | (DB Dump)      |
|                +-----------------------+------------------------+                |
|                                        |                                         |
|                                        v                                         |
|                         +------------------------------+                         |
|                         |       allar-mariadb-1        |                         |
|                         |        (MariaDB 12.3)        |                         |
|                         |    3306 (internal network)   |                         |
|                         +--------------+---------------+                         |
|                                        |                                         |
| - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
| Volumes & Storage:                     |                                         |
|   - allar_db_data      ----------------+ (/var/lib/mysql)                        |
|   - allar_uploads      <---> [ allar-web-1 ] & [ allar-backup-1 ]                |
|   - ./backups (Host)   <---> [ allar-backup-1 ] (/backups)                       |
|                                                                                  |
| เครื่องมือจัดการชั่วคราว (--profile tools):                                      |
|   +--------------------------+                                                   |
|   |   allar-phpmyadmin-1     | ---> เชื่อมต่อ allar-mariadb-1:3306               |
|   |      127.0.0.1:8080      |                                                   |
|   +--------------------------+                                                   |
+==================================================================================+
```

- **allar-web-1**: เว็บแอปพลิเคชัน Next.js (Node 24 Standalone) รับการเชื่อมต่อผ่าน `127.0.0.1:3000` มีระบบ Migration ฐานข้อมูลอัตโนมัติก่อนเริ่มทำงาน
- **allar-mariadb-1**: ระบบจัดการฐานข้อมูล MariaDB 12.3 จัดเก็บข้อมูลลง Volume `allar_db_data` ทำงานบนเน็ตเวิร์กภายในเท่านั้น
- **allar-backup-1**: คอนเทนเนอร์สำรองข้อมูลอัตโนมัติ จัดการสำรองฐานข้อมูลและไฟล์สื่อลงโฟลเดอร์โฮสต์ `./backups`
- **allar-phpmyadmin-1**: บริการ phpMyAdmin สำหรับจัดการฐานข้อมูล จะเปิดใช้งานเฉพาะเมื่อระบุ `--profile tools` เท่านั้น โดยผูกกับ `127.0.0.1:8080` เพื่อความปลอดภัย

---

## 2. ความต้องการของเครื่อง (System Requirements)

- **ระบบปฏิบัติการ**: Linux (เช่น Ubuntu 22.04 / 24.04 LTS, Debian 12, RHEL 9) หรือ Windows Server / Windows 10/11 ที่ติดตั้ง Docker Desktop / WSL2
- **โปรแกรมที่จำเป็น**:
  - Docker Engine ≥ 24.0
  - Docker Compose v2 (คำสั่ง `docker compose`)
- **ทรัพยากรฮาร์ดแวร์**:
  - **RAM**: ขั้นต่ำ 2 GB สำหรับการรันระบบปกติ (สำหรับการ Build Image เว็บแอปพลิเคชัน แนะนำอย่างน้อย **3 GB** ขึ้นไป)
  - **CPU**: แนะนำ 2 vCPU ขึ้นไป
  - **พื้นที่จัดเก็บข้อมูล (Disk)**: ว่างอย่างน้อย **20 GB** (สำหรับ Docker Images, ฐานข้อมูล, และไฟล์โมเดล 3D/สื่อ)
- **การเชื่อมต่อเครือข่าย (Network)**:
  - เชื่อมต่ออินเทอร์เน็ตขาออก (Outbound Internet) ได้ สำหรับดึง Base Images (Node, MariaDB, phpMyAdmin) และติดตั้ง Dependency
  - เครือข่ายภายนอกไม่ต้องเปิดพอร์ตฐานข้อมูล (3306) เปิดเฉพาะพอร์ตสำหรับ Reverse Proxy (80, 443) เท่านั้น

---

## 3. ติดตั้งครั้งแรก (Initial Installation)

### 3.1 โคลนโปรเจกต์จาก GitHub
```bash
git clone https://github.com/fufu4826/allAR.git
cd allAR/deploy
```
> [!IMPORTANT]
> ต้องตรวจสอบให้แน่ใจว่ากำลังทำงานอยู่ในโฟลเดอร์ `deploy/` เสมอ

### 3.2 คัดลอกและสร้างไฟล์สภาพแวดล้อม (.env)
```bash
cp .env.example .env
```
*(บน Windows PowerShell ให้ใช้คำสั่ง `Copy-Item .env.example .env`)*

### 3.3 สร้างรหัสผ่านที่มีความปลอดภัยสูง
ระบบไม่อนุญาตให้ใช้รหัสผ่านแบบ Base64 เนื่องจากเครื่องหมาย slash (`/`) และ plus (`+`) จะทำให้การ parse ค่าสตริง `DATABASE_URL` ผิดพลาด ต้องสร้างรหัสผ่านแบบเลขฐานสิบหก (สุ่ม 24 ไบต์ ได้ตัวอักษร 0-9 a-f ยาว 48 ตัว) เท่านั้น:

- **บน Linux / macOS**:
  ```bash
  openssl rand -hex 24
  ```
- **บน Windows หรือเครื่องที่ไม่มีคำสั่ง openssl**:
  ```bash
  docker run --rm --entrypoint openssl mariadb:12.3 rand -hex 24
  ```

ให้สุ่มรหัสผ่าน 2 ชุด แล้วนำไปกรอกลงในไฟล์ `.env`:
- `DB_ROOT_PASSWORD`: รหัสผ่านผู้ดูแลระบบสูงสุดของ MariaDB
- `DB_PASSWORD`: รหัสผ่านสำหรับผู้ใช้ `allar_user`

> [!WARNING]
> หากไม่ได้กรอก `DB_ROOT_PASSWORD` หรือ `DB_PASSWORD` คำสั่ง `docker compose` จะปฏิเสธการเริ่มทำงานทันที

**สรุปตัวแปรคอนฟิกในไฟล์ `.env`:**
| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
| :--- | :--- | :--- |
| `DB_ROOT_PASSWORD` | *(ต้องระบุ)* | รหัสผ่าน root ของฐานข้อมูล MariaDB |
| `DB_NAME` | `allar_db` | ชื่อฐานข้อมูลของระบบ |
| `DB_USER` | `allar_user` | ชื่อผู้ใช้ฐานข้อมูล |
| `DB_PASSWORD` | *(ต้องระบุ)* | รหัสผ่านของผู้ใช้ฐานข้อมูล |
| `APP_VERSION` | `latest` | แท็กเวอร์ชันของ Image |
| `WEB_BIND` | `127.0.0.1` | ไอพีที่เปิดรับการเชื่อมต่อของเว็บ (127.0.0.1 สำหรับ reverse proxy) |
| `WEB_PORT` | `3000` | พอร์ตของเว็บแอปพลิเคชัน |
| `SITE_URL` | (ว่าง) | ที่อยู่เว็บจริงแบบเต็ม เช่น `https://lac.snru.ac.th` ใช้ทำลิงก์ใน `/sitemap.xml` และ `/robots.txt` · เว้นว่างได้ เว็บจะใช้โดเมนจาก Host / X-Forwarded-Host ที่ reverse proxy ส่งมา |
| `TRUST_PROXY` | `true` | `true` เมื่อมี reverse proxy อยู่ข้างหน้า (อ่าน Client IP จาก `X-Forwarded-For`) · ตั้ง `false` ถ้าเปิดเว็บตรงโดยไม่มี proxy |
| `BACKUP_TIME` | `02:00` | เวลาสำรองข้อมูลประจำวัน (เขตเวลา Asia/Bangkok) |
| `BACKUP_KEEP_DAYS` | `30` | จำนวนวันที่เก็บรักษาไฟล์สำรองข้อมูล |
| `PMA_PORT` | `8080` | พอร์ตของ phpMyAdmin (เฉพาะเมื่อเปิด profile tools) |

### 3.4 Build และรันคอนเทนเนอร์
```bash
docker compose up -d --build
```
*(การ build ครั้งแรกจะใช้เวลาประมาณ 2–3 นาที บนเครื่อง 2 vCPU ขนาด image `allar-web` ≈ 395 MB, `allar-backup` ≈ 460 MB)*
คอนเทนเนอร์ `allar-web-1` จะรอจนกระทั่ง `allar-mariadb-1` พร้อมทำงาน และจะทำการ Migration ฐานข้อมูลโดยอัตโนมัติก่อนเปิดให้บริการ

### 3.5 ตรวจสอบสถานะการทำงาน
ตรวจสอบว่าคอนเทนเนอร์ทุกตัวมีสถานะ `Up` หรือ `healthy`:
```bash
docker compose ps
```
ทดสอบเรียก Healthcheck endpoint:
```bash
curl http://127.0.0.1:3000/api/health
```
*(บน Windows PowerShell ให้ใช้คำสั่ง `curl.exe http://127.0.0.1:3000/api/health` หรือ `Invoke-RestMethod http://127.0.0.1:3000/api/health`)*

ผลลัพธ์ที่ถูกต้อง:
```json
{"status":"ok"}
```

---

## 4. นำเข้าข้อมูลที่ส่งแยก (Import Initial Data Bundle)

ฐานข้อมูลเริ่มต้น (`allar_db.sql.gz`) และไฟล์สื่อ 3D/รูปภาพ (`uploads.zip`) รวมถึงไฟล์ตรวจสอบความถูกต้อง (`SHA256SUMS.txt`) จะได้รับการจัดส่งแยกต่างหาก

### 4.1 คัดลอกไฟล์ไปยังไดเรกทอรี `deploy/backups/`
เมื่อสั่งรัน Compose ระบบ Docker จะสร้างโฟลเดอร์ `backups/` บน Linux ด้วยสิทธิ์ `root` ดังนั้นให้ใช้ `sudo cp`:
```bash
sudo cp allar_db.sql.gz uploads.zip SHA256SUMS.txt backups/
```
*(บน Windows ให้คัดลอกไฟล์ทั้งสามไปวางไว้ในโฟลเดอร์ `deploy\backups\` แล้วข้ามขั้น 4.2 ได้ เพราะสคริปต์นำเข้าตรวจ checksum ให้อีกครั้งอยู่แล้ว)*

### 4.2 ตรวจสอบความถูกต้องของไฟล์ (Checksum)
สามารถตรวจสอบความสมบูรณ์ของไฟล์เบื้องต้นได้ด้วยคำสั่ง:
```bash
cd backups && sha256sum -c SHA256SUMS.txt && cd ..
```

### 4.3 รันสคริปต์นำเข้าข้อมูล
- **บน Linux / macOS**:
  ```bash
  sh import-bundle.sh
  ```
- **บน Windows PowerShell (หรือเครื่องที่ไม่มี sh)**:
  ```powershell
  docker compose run --rm backup import
  docker compose restart web
  ```

> [!NOTE]
> สคริปต์จะทำการตรวจสอบ SHA256SUMS ภายในคอนเทนเนอร์ นำเข้าฐานข้อมูล MariaDB แตกไฟล์สื่อลงใน Volume `allar_uploads` ปรับสิทธิ์ไฟล์ (UID 10001) และรีสตาร์ตคอนเทนเนอร์เว็บเพื่อล้าง in-memory cache ทันที **ห้ามใช้คำสั่ง unzip หรือ mysql แบบ manual เอง**

---

## 5. สร้างผู้ดูแลระบบคนแรก (First Admin Creation)

ระบบ AllAR **ไม่มีบัญชีผู้ดูแลระบบเริ่มต้น (No default admin)** เพื่อความปลอดภัย ต้องสร้างบัญชีแรกผ่าน CLI ในคอนเทนเนอร์:

### 5.1 วิธีที่ 1: แบบถามรหัสผ่าน (Interactive - แนะนำ)
คำสั่งจะถามรหัสผ่าน (ความยาว 12–128 ตัวอักษร) โดยไม่แสดงตัวอักษรบนหน้าจอ:
```bash
docker compose exec web node scripts/create-admin.mjs <ชื่อผู้ใช้> "<ชื่อที่แสดง>"
```
*ตัวอย่างการใช้งาน:*
```bash
docker compose exec web node scripts/create-admin.mjs admin "System Administrator"
```

### 5.2 วิธีที่ 2: แบบส่งรหัสผ่านผ่านตัวแปรสภาพแวดล้อม (Non-interactive)
เหมาะสำหรับการใช้งานผ่าน Automation Script:
```bash
docker compose exec -T -e ADMIN_PASSWORD='<รหัสผ่านความยาว12ถึง128ตัวอักษร>' web node scripts/create-admin.mjs <ชื่อผู้ใช้> "<ชื่อที่แสดง>"
```

เมื่อสร้างสำเร็จ ระบบจะแสดงผล:
```text
admin created: <ชื่อผู้ใช้>
```
หลังจากนั้นสามารถเข้าสู่ระบบผ่านเบราว์เซอร์ได้ที่ URL:
```text
http://<โดเมนหรือไอพีเซิร์ฟเวอร์>/admin/login
```

---

## 6. เชื่อมกับโดเมนและ HTTPS (Domain & Reverse Proxy Setup)

> [!IMPORTANT]
> **ข้อกำหนดด้านเทคนิคสำหรับระบบ AR:**
> ฟังก์ชัน WebXR API (บน Chrome / Android) และ Quick Look AR (บน Safari / iOS) **จำเป็นต้องทำงานผ่าน HTTPS เท่านั้น** อุปกรณ์จะไม่ยอมให้เข้าถึงกล้องและระบบแสดงผลเสมือนจริงหากเชื่อมต่อผ่าน HTTP ปกติ

### 6.1 หลักการทำงานของ Proxy Header และ `TRUST_PROXY`
ในระบบ AllAR มีการตรวจสอบ IP Address เพื่อป้องกันการสุ่มรหัสผ่าน (Rate Limiting) และบันทึก Audit Log โดยเมื่อตั้งค่า `TRUST_PROXY=true` แอปพลิเคชัน Next.js จะอ่าน IP จริงของผู้ใช้จากค่า **ลำดับสุดท้าย (LAST hop)** ของ Header `X-Forwarded-For` เสมอ (ป้องกันการปลอมแปลง IP ที่ผู้ใช้อาจแทรกมาใน Header แรก)
**ดังนั้น สถาปัตยกรรมระบบต้องมี Reverse Proxy เพียงชั้นเดียว (Exactly one proxy) อยู่ข้างหน้าแอปพลิเคชัน AllAR เสมอ**

### 6.2 ตัวอย่างการกำหนดค่า Nginx
สร้างไฟล์คอนฟิกสำหรับ Nginx เช่น `/etc/nginx/sites-available/<ชื่อโดเมน>.conf`:

> [!NOTE]
> ไม่ต้องเพิ่ม MIME type ของ `.glb` / `.usdz` ใน Nginx เพราะแอปส่ง `Content-Type` ที่ถูกต้อง (`model/gltf-binary`, `model/vnd.usdz+zip`) และรองรับ Range request ให้เองแล้ว Nginx เพียงส่งต่อ header เดิม

```nginx
server {
    listen 80;
    server_name <ชื่อโดเมน>;

    # บังคับ Redirect ไปยัง HTTPS ทั้งหมด
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name <ชื่อโดเมน>;

    # ใบรับรอง SSL/TLS (ตัวอย่าง Let's Encrypt / Certbot)
    ssl_certificate /etc/letsencrypt/live/<ชื่อโดเมน>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<ชื่อโดเมน>/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ขนาดไฟล์อัปโหลดสูงสุด: ฟอร์มจัดการไอเทมของแอดมินรองรับ
    # GLB 100MB + USDZ 100MB + รูปภาพ 15MB + เสียง 30MB
    client_max_body_size 260m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Header ที่จำเป็นสำหรับการส่งต่อ
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts สำหรับการอัปโหลดไฟล์ขนาดใหญ่
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

ตรวจสอบคอนฟิกและโหลด Nginx ใหม่:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. สำรองและกู้คืนข้อมูล (Backup & Restore)

### 7.1 ตำแหน่งจัดเก็บและรอบการทำงานอัตโนมัติ
คอนเทนเนอร์ `allar-backup-1` ทำงานตลอดเวลา โดยมีรอบการสำรองข้อมูลอัตโนมัติ:
- **เวลาทำงาน**: ทุกวันในเวลา `BACKUP_TIME` (ค่าเริ่มต้นคือ `02:00` น. เวลาประเทศไทย Asia/Bangkok)
- **ที่เก็บไฟล์**: ไดเรกทอรี `deploy/backups/` บนเครื่องโฮสต์
- **รูปแบบชื่อไฟล์**:
  - ฐานข้อมูล: `db_YYYY-MM-DD_HHMM.sql.gz`
  - ไฟล์สื่อและโมเดล: `uploads_YYYY-MM-DD_HHMM.tar.gz`
- **การลบไฟล์เก่า (Retention)**: ระบบจะตรวจสอบและลบไฟล์สำรองที่มีอายุเกิน `BACKUP_KEEP_DAYS` (ค่าเริ่มต้น 30 วัน) โดยอัตโนมัติ
- **ตรวจสอบการทำงานของระบบ Backup**:
  ```bash
  docker compose logs backup
  ```

### 7.2 คำสั่งสั่งสำรองข้อมูลทันที (One-off Backup)
ก่อนการแก้ไขระบบหรืออัปเดตเวอร์ชัน สามารถสั่งสำรองข้อมูลทันทีได้ด้วยคำสั่ง:
```bash
docker compose run --rm backup now
```

### 7.3 การกู้คืนข้อมูล (Restore)
> [!IMPORTANT]
> คำสั่ง Restore ต้องระบุตัวเลือก `--yes` เสมอ (หากไม่ใส่ ระบบจะปฏิเสธการกู้คืนเพื่อป้องกันความผิดพลาด) และเมื่อ Restore เสร็จสิ้น **ต้องสั่ง `docker compose restart web` เสมอ** เนื่องจากเว็บแอปพลิเคชันมี in-memory cache หากไม่รีสตาร์ตข้อมูลที่กู้คืนมาจะไม่แสดงผลทันที

- **กู้คืนทั้งฐานข้อมูลและไฟล์สื่อพร้อมกัน**:
  ```bash
  docker compose run --rm backup restore --yes /backups/db_<วันที่_เวลา>.sql.gz /backups/uploads_<วันที่_เวลา>.tar.gz
  docker compose restart web
  ```

- **กู้คืนเฉพาะฐานข้อมูลอย่างเดียว**:
  ```bash
  docker compose run --rm backup restore --yes /backups/db_<วันที่_เวลา>.sql.gz
  docker compose restart web
  ```

- **กู้คืนเฉพาะไฟล์สื่อและโมเดล 3D**:
  ```bash
  docker compose run --rm backup restore --yes /backups/uploads_<วันที่_เวลา>.tar.gz
  docker compose restart web
  ```

### 7.4 การทดสอบกู้คืนข้อมูลประจำเดือน (Monthly Restore Drill)
แนะนำให้ทีม IT ดำเนินการทดสอบกู้คืนข้อมูล (Drill) อย่างน้อยเดือนละ 1 ครั้ง โดยจำลองการนำไฟล์ Backup ล่าสุดไปทดสอบ Restore บนเครื่องทดสอบ (Staging Server) เพื่อยืนยันว่า:
1. ไฟล์ Archive ไม่มีความเสียหายและสามารถแตกไฟล์ได้สมบูรณ์
2. ข้อมูลตารางและผู้ใช้งานสามารถเปิดดูได้ถูกต้อง
3. ไฟล์โมเดล 3D ในโฟลเดอร์ uploads สามารถดาวน์โหลดและแสดงผลบน AR ได้ครบถ้วน

### 7.5 การคัดลอกไฟล์สำรองออกนอกเครื่อง (Off-site Backup)
ควรตั้ง cron job หรือ rsync เพื่อคัดลอกไฟล์ในไดเรกทอรี `deploy/backups/` (คำสั่งด้านล่างรันจากโฟลเดอร์ `deploy/`) ไปยัง NAS หรือ Cloud Storage สำรองเป็นประจำ เช่น:
```bash
rsync -avz backups/ <เครื่องสำรอง>:/storage/allar-backups/
```

---

## 8. อัปเดตเวอร์ชัน (System Update & Rollback)

### 8.1 ขั้นตอนการอัปเดตเวอร์ชันระบบ
1. สั่งสำรองข้อมูลปัจจุบันก่อนเริ่มดำเนินการเสมอ:
   ```bash
   docker compose run --rm backup now
   ```
2. ดึงซอร์สโค้ดล่าสุดจาก Git Repository:
   ```bash
   git pull origin main
   ```
3. Rebuild Image และรันคอนเทนเนอร์ใหม่:
   ```bash
   docker compose up -d --build
   ```
   > [!NOTE]
   > จำเป็นต้องมีตัวเลือก `--build` เสมอ เนื่องจากสคริปต์สำรองข้อมูลและโค้ด Next.js ถูกบรรจุอยู่ใน Docker Image ในระหว่างขั้นตอน build และคอนเทนเนอร์เว็บจะทำการรัน Database Migration ให้โดยอัตโนมัติ

4. ตรวจสอบสถานะการทำงาน:
   ```bash
   docker compose ps
   curl http://127.0.0.1:3000/api/health
   ```

### 8.2 ขั้นตอนการย้อนกลับเวอร์ชัน (Rollback)
หากพบปัญหาหลังจากการอัปเดต:
1. สลับ Git ไปยัง Commit หรือ Tag เดิมที่เสถียร:
   ```bash
   git checkout <tag หรือ commit เดิม>
   ```
2. Rebuild และเริ่มคอนเทนเนอร์เวอร์ชันเดิม:
   ```bash
   docker compose up -d --build
   ```
3. หากเวอร์ชันที่มีปัญหามีการแก้ไขโครงสร้างฐานข้อมูล (Database Schema) ให้กู้คืนฐานข้อมูลกลับด้วยไฟล์ที่สำรองไว้ก่อนอัปเดต:
   ```bash
   docker compose run --rm backup restore --yes /backups/db_<ไฟล์สำรองก่อนอัปเดต>.sql.gz
   docker compose restart web
   ```

---

## 9. ใช้ phpMyAdmin / ต่อฐานข้อมูลแบบชั่วคราว (Database Maintenance)

เพื่อความปลอดภัยสูงสุด บริการ phpMyAdmin จะถูกปิดไว้เป็นค่าเริ่มต้น และถูกกำหนดให้อยู่ใน Profile `tools` โดยเปิดรับการเชื่อมต่อเฉพาะ `127.0.0.1:8080` เท่านั้น

### 9.1 เปิดใช้งาน phpMyAdmin
```bash
docker compose --profile tools up -d phpmyadmin
```

### 9.2 เชื่อมต่อผ่าน SSH Tunnel จากเครื่องของผู้ดูแลระบบ
เนื่องจากพอร์ต 8080 ไม่ได้เปิดสู่สาธารณะ ให้ผู้ดูแลระบบเปิด SSH Tunnel จากเครื่องส่วนตัว:
```bash
ssh -L 8080:127.0.0.1:8080 <ชื่อผู้ใช้เซิร์ฟเวอร์>@<ไอพีหรือโดเมนเซิร์ฟเวอร์>
```
จากนั้นเปิดเว็บเบราว์เซอร์ในเครื่องของท่านไปที่:
```text
http://127.0.0.1:8080
```

### 9.3 การเข้าสู่ระบบ
- **Username**: ค่าตาม `DB_USER` ใน `.env` (เช่น `allar_user`)
- **Password**: รหัสผ่านตาม `DB_PASSWORD` ใน `.env`
*(หรือใช้ username `root` และรหัสผ่าน `DB_ROOT_PASSWORD` สำหรับงานระดับผู้ดูแลระบบสูงสุด)*

### 9.4 ปิดการใช้งาน phpMyAdmin เมื่อเสร็จงาน
หลังจากเสร็จสิ้นภารกิจ ให้หยุดการทำงานของ phpMyAdmin ทันที:
```bash
docker compose --profile tools stop phpmyadmin
```

---

## 10. แก้ปัญหาที่พบบ่อย (Troubleshooting)

### 10.1 Web Healthcheck failing / คอนเทนเนอร์ web สถานะ unhealthy หรือ restart วนลูป
- **วิธีตรวจสอบ**:
  ```bash
  docker compose logs --tail=100 mariadb
  docker compose logs --tail=100 web
  ```
- **สาเหตุที่พบบ่อย**:
  1. `DB_PASSWORD` มีตัวอักษรพิเศษที่ไม่รองรับใน URL เช่น `@`, `:`, `/`, `+`, `#` ทำให้การเชื่อมต่อ `DATABASE_URL` ล้มเหลว (ให้แก้โดยใช้ `openssl rand -hex 24` สร้างใหม่)
  2. MariaDB ยังเริ่มต้นระบบไม่เสร็จสิ้น หรือ healthcheck ของ MariaDB ยังไม่ผ่าน
  3. Migration ฐานข้อมูลล้มเหลวเนื่องจากตารางเกิดการขัดแย้ง

### 10.2 อัปโหลดไฟล์แล้วแจ้งเตือนข้อผิดพลาด (413 Request Entity Too Large)
- **สาเหตุ**: ขนาดไฟล์โมเดล 3D หรือไฟล์เสียงมีขนาดใหญ่เกินกว่าที่ Reverse Proxy กำหนด
- **วิธีแก้ไข**: ตรวจสอบไฟล์คอนฟิกของ Nginx ให้แน่ใจว่าได้ระบุ `client_max_body_size 260m;` ในบล็อก `server` หรือ `location /` และสั่ง reload nginx ด้วยคำสั่ง `sudo nginx -s reload`

### 10.3 ภาษาไทยในฐานข้อมูลแสดงผลเป็นเครื่องหมายคำถาม (`???`)
- **สาเหตุ**: การเข้ารหัสฐานข้อมูลหรือตารางไม่ได้ใช้ UTF-8
- **วิธีตรวจสอบ**: คอนเทนเนอร์ MariaDB ถูกตั้งค่าเริ่มต้นไว้เป็น `--character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci` แล้ว หากยังพบปัญหา มักเกิดจากการ import ไฟล์ SQL ด้วย client ที่กำหนด charset ผิดพลาด ให้ตรวจสอบว่าไฟล์ dump มีบรรทัด `SET NAMES utf8mb4;` หรือแปลง encoding เป็น UTF-8 ก่อนนำเข้า

### 10.4 พอร์ตชนกับบริการอื่น (Port already in use)
- **สาเหตุ**: มีบริการอื่นบนโฮสต์ใช้งานพอร์ต `3000` หรือ `8080` อยู่ก่อนแล้ว
- **วิธีตรวจสอบ**:
  - บน Linux: `sudo ss -tulpn | grep 3000`
  - บน Windows: `Get-NetTCPConnection -LocalPort 3000`
- **วิธีแก้ไข**: แก้ไขค่า `WEB_PORT` หรือ `PMA_PORT` ในไฟล์ `.env` เช่น เปลี่ยนเป็น `WEB_PORT=3001` จากนั้นสั่ง `docker compose up -d` และแก้ไขพอร์ตใน Reverse Proxy ให้ชี้ไปยังพอร์ตใหม่

---

## 11. ความปลอดภัย (Security Best Practices)

### 11.1 คำเตือนเรื่องการลบข้อมูล (Volume Deletion Warning)
> [!CAUTION]
> **ข้อควรระวังขั้นวิกฤตสำหรับการลบคอนเทนเนอร์:**
> - คำสั่ง `docker compose down` จะหยุดและลบคอนเทนเนอร์เท่านั้น แต่ **ข้อมูลใน Volume ทั้งหมด (ฐานข้อมูล MariaDB และไฟล์สื่ออัปโหลด) จะยังคงอยู่ครบถ้วน ปลอดภัย**
> - **ห้ามใช้คำสั่ง `docker compose down -v` หรือ `docker compose down --volumes` บน Production โดยเด็ดขาด!** เพราะ flag `-v` จะสั่งลบ Volumes `allar_db_data` และ `allar_uploads` ทิ้งทันที ซึ่งจะทำให้ข้อมูลระบบและโมเดล 3D ทั้งหมดสูญหายอย่างถาวร

### 11.2 การเก็บรักษาไฟล์สภาพแวดล้อม (.env)
- ห้าม commit ไฟล์ `.env` ขึ้น Git Repository หรือเปิดเผยต่อสาธารณะโดยเด็ดขาด (ไฟล์ `.gitignore` ของระบบได้ป้องกันไฟล์ `.env` ไว้แล้ว)
- สำรองไฟล์ `.env` แยกเก็บไว้ในที่ปลอดภัย เช่น Password Manager ขององค์กร

### 11.3 การจำกัดการเข้าถึงฐานข้อมูล
- พอร์ต MariaDB (3306) ถูกจำกัดให้อยู่ในเครือข่าย Docker ภายใน (`internal`) เท่านั้น และไม่มีการ Map พอร์ตออกสู่ Host
- สำหรับ phpMyAdmin มีการ Bind ไว้ที่ `127.0.0.1:8080` เท่านั้น การเข้าถึงจากระยะไกลต้องทำผ่าน SSH Tunnel เท่านั้น

### 11.4 นโยบายรหัสผ่าน
- ผู้ดูแลระบบทุกคนต้องใช้รหัสผ่านที่มีความยาวไม่น้อยกว่า 12 ตัวอักษร
- รหัสผ่านผู้ดูแลระบบถูกเข้ารหัสด้วย Argon2id ตามมาตรฐานความปลอดภัยระดับสูง

### 11.5 การจัดการ Log ของคอนเทนเนอร์ (Log Rotation)
เพื่อป้องกันไม่ให้ขนาดไฟล์ Log ของ Docker ขยายตัวจนกินพื้นที่ดิสก์ แนะนำให้กำหนด Log Rotation ใน `/etc/docker/daemon.json` บนเซิร์ฟเวอร์:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
```
หลังจากแก้ไขไฟล์ ให้สั่ง `sudo systemctl restart docker`
