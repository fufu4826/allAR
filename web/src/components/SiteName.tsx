import { Fragment } from "react";

/** Learning-site names break before "ชุมชน…" (and Phu Phan's also before "อันเนื่องมาจาก…"),
 *  so each part of the long official name starts its own line. */
export function siteNameLines(name: string): string[] {
  return name
    .replace(/(อันเนื่องมาจาก)/, "\n$1")
    .replace(/\s+(ชุมชน)/, "\n$1")
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function SiteName({ name }: { name: string }) {
  const lines = siteNameLines(name);
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <KeepVillage line={line} />
        </Fragment>
      ))}
    </>
  );
}

/** Keeps a village name ("บ้านโนนหอม") on one line: Thai line breaking would otherwise split it (โนน|หอม).
 *  Each space-separated phrase is also a `.name-part`, which the Phu Phan hero keeps whole
 *  ("จังหวัดสกลนคร" never splits into จังหวัด|สกลนคร); see phuphan-theme.css. */
function KeepVillage({ line }: { line: string }) {
  const parts = line.split(/\s+/);
  return (
    <>
      {parts.map((part, i) => {
        const at = part.indexOf("บ้าน");
        return (
          <Fragment key={i}>
            {i > 0 && " "}
            <span className="name-part">
              {at <= 0 ? part : <>{part.slice(0, at)}<span style={{ whiteSpace: "nowrap" }}>{part.slice(at)}</span></>}
            </span>
          </Fragment>
        );
      })}
    </>
  );
}
