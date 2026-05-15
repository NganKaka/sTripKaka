import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';

const ReactMarkdownLazy = lazy(async () => {
  const [{ default: ReactMarkdown }, { default: remarkGfm }] = await Promise.all([
    import('react-markdown'),
    import('remark-gfm'),
  ]);
  const Wrapped: ComponentType<{ children: string; components?: Record<string, ComponentType<any>> }> = ({ children, components }) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>
  );
  return { default: Wrapped };
});

type Props = {
  children: string;
  components?: Record<string, ComponentType<any>>;
  fallback?: ReactNode;
};

export default function LazyMarkdown({ children, components, fallback = null }: Props) {
  return (
    <Suspense fallback={fallback}>
      <ReactMarkdownLazy components={components}>{children}</ReactMarkdownLazy>
    </Suspense>
  );
}
