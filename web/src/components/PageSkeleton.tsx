export default function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 pt-8">
      <div className="h-8 w-2/3 rounded-full bg-line" />
      <div className="mt-3 h-4 w-1/3 rounded-full bg-line" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-line" />
        ))}
      </div>
    </div>
  );
}
