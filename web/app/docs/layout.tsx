import { Sidebar } from '@/components/docs/sidebar';
import { Toc } from '@/components/docs/toc';
import { TopNav } from '@/components/nav/top-nav';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_200px] gap-10 pt-10 pb-24">
          <aside className="hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
            <Sidebar />
          </aside>
          <article className="min-w-0">{children}</article>
          <aside className="hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pl-2">
            <Toc />
          </aside>
        </div>
      </div>
    </>
  );
}
