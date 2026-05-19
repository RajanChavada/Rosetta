export type Option = {
  flag: string;
  description: string;
  default?: string;
};

export function OptionTable({ options }: { options: Option[] }) {
  if (options.length === 0) return null;
  return (
    <div className="my-6">
      <div className="space-y-3 sm:hidden">
        {options.map((o) => (
          <div
            key={o.flag}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <code className="break-all font-mono text-sm text-[var(--color-fg)]">
                {o.flag}
              </code>
              <span className="rounded border border-[var(--color-border)] bg-[var(--color-bg-inline)] px-2 py-1 font-mono text-xs text-[var(--color-fg-faint)]">
                {o.default ?? 'none'}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {o.description}
            </p>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-[var(--color-border)] sm:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-[var(--color-bg-elev)]">
            <tr className="text-left text-[var(--color-fg-faint)]">
              <th className="px-4 py-2 font-mono font-normal">Flag</th>
              <th className="px-4 py-2 font-mono font-normal">Description</th>
              <th className="px-4 py-2 font-mono font-normal">Default</th>
            </tr>
          </thead>
          <tbody>
            {options.map((o) => (
              <tr
                key={o.flag}
                className="border-t border-[var(--color-border)] align-top"
              >
                <td className="px-4 py-3 font-mono text-[var(--color-fg)] whitespace-nowrap">
                  {o.flag}
                </td>
                <td className="px-4 py-3 text-[var(--color-fg-muted)]">
                  {o.description}
                </td>
                <td className="px-4 py-3 font-mono text-[var(--color-fg-faint)] whitespace-nowrap">
                  {o.default ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
