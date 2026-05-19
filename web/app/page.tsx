import { TopNav } from '@/components/nav/top-nav';
import { Hero } from '@/components/home/hero';
import { FeatureStrip } from '@/components/home/feature-strip';
import { QuickStart } from '@/components/home/quick-start';
import { IdeGrid } from '@/components/home/ide-grid';
import { SkillPreview } from '@/components/home/skill-preview';
import { Footer } from '@/components/home/footer';

export default function Home() {
  return (
    <>
      <TopNav />
      <main>
        <Hero />
        <FeatureStrip />
        <QuickStart />
        <IdeGrid />
        <SkillPreview />
      </main>
      <Footer />
    </>
  );
}
