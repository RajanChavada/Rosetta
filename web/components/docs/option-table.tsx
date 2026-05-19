export type Option = {
  flag: string;
  description: string;
  default?: string;
};

export function OptionTable({ options }: { options: Option[] }) {
  if (options.length === 0) return null;
  return (
    <div className="my-6 overflow-hidden rounded-lg border border-[var(--color-border)]">
      <table className="w-full text-sm">
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
  );
}
