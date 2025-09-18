import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTheme } from 'next-themes';

interface CodeBlockProps {
  children: string;
  className?: string;
}

export const CodeBlock = ({ children, className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  
  const language = className?.replace('language-', '') || 'text';
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border bg-card">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
      
      {/* Code content */}
      <SyntaxHighlighter
        language={language}
        style={theme === 'dark' ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: '16px',
          background: 'transparent',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
        showLineNumbers={children.split('\n').length > 5}
        lineNumberStyle={{
          minWidth: '2em',
          paddingRight: '1em',
          color: 'hsl(var(--muted-foreground))',
          fontSize: '12px',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};