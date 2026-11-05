import Link from "next/link";

export default function ItemCard({
  href,
  name,
  thumbnail,
  caption,
  hasAudio,
}: {
  href: string;
  name: string;
  thumbnail: string | null;
  caption?: string;
  hasAudio?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-square bg-brand-soft">
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={name} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
          3D · AR
        </span>
        {hasAudio && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] text-ink">🔊 เสียง</span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-1 font-medium">{name}</p>
        {caption && <p className="line-clamp-1 text-xs text-muted">{caption}</p>}
      </div>
    </Link>
  );
}
