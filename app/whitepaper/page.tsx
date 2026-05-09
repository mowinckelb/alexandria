import MarkdownDoc from '../components/MarkdownDoc';

export default function WhitepaperPage() {
  return (
    <MarkdownDoc
      src="/docs/Whitepaper.md"
      header=""
      homeHref="/"
      numbered
    />
  );
}
