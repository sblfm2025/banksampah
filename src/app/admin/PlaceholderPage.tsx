export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-3 text-slate-600">
        Modul ini dijadwalkan setelah alur permintaan operator selesai.
      </p>
    </div>
  );
}
