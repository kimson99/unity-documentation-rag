import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const markdownComponents = {
  code({ children, className, node: _node, ...rest }: React.ComponentPropsWithoutRef<'code'> & { node?: unknown }) {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      <SyntaxHighlighter
        language={match[1]}
        style={oneDark}
        PreTag="div"
        className="rounded-lg! text-xs! my-2!"
        customStyle={{ overflowX: 'auto', maxWidth: '100%' }}
        codeTagProps={{ style: { display: 'block' } }}
      >
        {String(children)}
      </SyntaxHighlighter>
    ) : (
      <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...rest}>
        {children}
      </code>
    );
  },
};
