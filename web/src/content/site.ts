/** Organizations named in the project document (ข้อมูลประกอบ AR ภาพรวม.docx). Text is quoted from it, not written fresh. */
export type SupportingOrganization = {
  icon: string;
  typeBadge?: string;
  name: string;
  role?: string;
  summary?: string;
  location?: string;
  mission?: string;
  tags?: { icon: string; label: string }[];
};

export const supportingOrganizations: SupportingOrganization[] = [
  {
    icon: "fa-solid fa-landmark",
    name: "มหาวิทยาลัยราชภัฏสกลนคร",
    summary:
      "ตามพันธกิจของมหาวิทยาลัยราชภัฏสกลนคร ปี พ.ศ.2568-2570 มีนโยบายการพัฒนาท้องถิ่น ด้านสังคมด้วยการยกระดับเศรษฐกิจฐานรากบนหลักปรัชญาเศรษฐกิจพอเพียง",
    location: "เลขที่ 680 ถนนนิตโย ตำบลธาตุเชิงชุม อำเภอเมือง จังหวัดสกลนคร 47000",
  },
  {
    icon: "fa-solid fa-building-columns",
    name: "สถาบันภาษา ศิลปะและวัฒนธรรม",
    role: "มหาวิทยาลัยราชภัฏสกลนคร",
    summary:
      "หน่วยที่ประยุกต์ใช้ความหลากหลายทางวัฒนธรรมในท้องถิ่นกับศาสตร์ทางสังคม วิทยาศาสตร์ เทคโนโลยีดิจิทัล รวมถึงศาสตร์อื่นๆ ให้เป็นวัฒนธรรมที่จับต้องได้โดยใช้การสื่อสารในรูปแบบออนไลน์อย่างเหมาะสม",
    mission:
      "ยกระดับองค์ความรู้ศิลปวัฒนธรรมและภูมิปัญญาท้องถิ่นของแหล่งเรียนรู้และพิพิธภัณฑ์จังหวัดสกลนครในรูปแบบออนไลน์เสมือนจริง",
  },
  {
    icon: "fa-solid fa-people-roof",
    typeBadge: "พื้นที่เป้าหมาย",
    name: "5 แหล่งเรียนรู้ จังหวัดสกลนคร",
    role: "ชุมชนโนนหอม • ชุมชนท่าแร่ • ชุมชนท่าวัด • ชุมชนห้วยยาง",
    location: "อำเภอเมืองสกลนคร จังหวัดสกลนคร",
  },
];

export const siteContact = {
  organization: "สถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร",
  address: "เลขที่ 680 ถนนนิตโย ตำบลธาตุเชิงชุม อำเภอเมือง จังหวัดสกลนคร 47000",
  phone: "042-970021",
  email: "saraban@snru.ac.th",
};

export const organizations = supportingOrganizations;

