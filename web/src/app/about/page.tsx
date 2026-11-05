export const metadata = { title: "เกี่ยวกับโครงการ | คลังภูมิปัญญาชุมชน 3D/AR" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 leading-relaxed">
      <h1 className="text-2xl font-bold">เกี่ยวกับโครงการ</h1>
      <p className="mt-4">
        เว็บไซต์คลังภูมิปัญญาและผลิตภัณฑ์ชุมชนรูปแบบ 3 มิติและความจริงเสริม (3D/AR) รวบรวมวัตถุพิพิธภัณฑ์
        ผลิตภัณฑ์ ภูมิปัญญา และสถานที่สำคัญของ 5 ชุมชนในจังหวัดสกลนคร
        ให้ทุกคนชมได้ผ่านเว็บเบราว์เซอร์ และวางโมเดลในพื้นที่จริงผ่านโทรศัพท์มือถือ
      </p>
      <p className="mt-4">
        ดำเนินการโดย สถาบันภาษา ศิลปะและวัฒนธรรม (พิพิธภัณฑ์เมืองสกลนคร) มหาวิทยาลัยราชภัฏสกลนคร
      </p>
      <h2 className="mt-8 text-lg font-semibold">ชุมชนที่ร่วมโครงการ</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-6">
        <li>ศูนย์ศึกษาการพัฒนาภูพานอันเนื่องมาจากพระราชดำริ</li>
        <li className="text-muted">ชุมชนที่ 2 (รอข้อมูล)</li>
        <li className="text-muted">ชุมชนที่ 3 (รอข้อมูล)</li>
        <li className="text-muted">ชุมชนที่ 4 (รอข้อมูล)</li>
        <li className="text-muted">ชุมชนที่ 5 (รอข้อมูล)</li>
      </ol>
    </div>
  );
}
