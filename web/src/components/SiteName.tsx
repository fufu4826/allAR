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

/** Words that Thai line breaking does not know and would split mid-word: kept whole.
 *  (A village name "บ้าน…" is kept whole as well: โนน|หอม.) */
const KEEP_WHOLE = /(มีคาแอล|อัครเทวดา|อาสนวิหาร|บ้าน\S+)/;

/** Keeps village names and the words above on one line.
 *  Each space-separated phrase is also a `.name-part`, which the Phu Phan hero keeps whole
 *  ("จังหวัดสกลนคร" never splits into จังหวัด|สกลนคร); see phuphan-theme.css. */
function KeepVillage({ line }: { line: string }) {
  const parts = line.split(/\s+/);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="name-part">
            {part.split(KEEP_WHOLE).map((piece, j) =>
              j % 2 ? <span key={j} style={{ whiteSpace: "nowrap" }}>{piece}</span> : piece,
            )}
          </span>
        </Fragment>
      ))}
    </>
  );
}
