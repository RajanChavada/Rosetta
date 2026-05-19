import { codeToHtml, type BundledLanguage } from 'shiki';

export async function highlight(
  code: string,
  lang: BundledLanguage | 'plaintext' = 'bash',
): Promise<string> {
  return codeToHtml(code, {
    lang: lang as BundledLanguage,
    theme: 'github-dark-default',
    transformers: [
      {
        pre(node) {
          // Strip Shiki's default background — we control it via parent
          if (node.properties.style) {
            delete node.properties.style;
          }
        },
      },
    ],
  });
}
