import MarkdownDoc from '../components/MarkdownDoc';

export const metadata = {
  title: 'Alexandria — Memo',
  robots: { index: false, follow: false },
};

export default function MemoPage() {
  return (
    <MarkdownDoc
      src="/docs/Memo.md"
      header=""
      homeHref="/"
    />
  );
}
