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

/** Keeps a village name ("บ้านโนนหอม") on one line: Thai line breaking would otherwise split it (โนน|หอม). */
function KeepVillage({ line }: { line: string }) {
  const at = line.indexOf("บ้าน");
  if (at <= 0) return <>{line}</>;
  return (
    <>
      {line.slice(0, at)}
      <span style={{ whiteSpace: "nowrap" }}>{line.slice(at)}</span>
    </>
  );
}
