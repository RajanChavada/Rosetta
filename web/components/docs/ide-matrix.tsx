import type { IdeSpec } from '@/lib/content/ides';

export function IdeMatrix({ ides }: { ides: IdeSpec[] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-[var(--color-bg-elev)]">
          <tr className="text-left text-[var(--color-fg-faint)]">
            <th className="px-4 py-2 font-normal">IDE</th>
            <th className="px-4 py-2 font-normal font-mono">Config path</th>
            <th className="px-4 py-2 font-normal font-mono">Skills dir</th>
            <th className="px-4 py-2 font-normal">Invoke with</th>
          </tr>
        </thead>
        <tbody>
          {ides.map((ide) => (
            <tr key={ide.id} className="border-t border-[var(--color-border)] align-top">
              <td className="px-4 py-3 text-[var(--color-fg)] font-medium whitespace-nowrap">
                {ide.name}
              </td>
              <td className="px-4 py-3 font-mono text-[var(--color-fg-muted)]">
                {ide.configPath}
              </td>
              <td className="px-4 py-3 font-mono text-[var(--color-fg-muted)]">
                {ide.skillsDir}
              </td>
              <td className="px-4 py-3 font-mono text-[var(--color-fg-muted)] whitespace-nowrap">
                {ide.invoke ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
