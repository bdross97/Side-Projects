type Spec = { label: string; value: string };

export function SpecGrid({ specs }: { specs: readonly Spec[] }) {
  return (
    <dl className="grid grid-cols-1 border-t border-l border-neutral-800 bg-black sm:grid-cols-2 lg:grid-cols-3">
      {specs.map((spec) => (
        <div key={spec.label} className="border-r border-b border-neutral-800 p-6">
          <dt className="font-sans text-[10px] uppercase tracking-[0.35em] text-neutral-500">
            {spec.label}
          </dt>
          <dd className="mt-2 font-sans text-sm text-white">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
