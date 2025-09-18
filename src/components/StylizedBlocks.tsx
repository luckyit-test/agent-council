import { AlertTriangle, Info, CheckCircle, XCircle, Lightbulb, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockquoteProps {
  children: React.ReactNode;
  className?: string;
}

export const Blockquote = ({ children, className }: BlockquoteProps) => {
  const content = typeof children === 'string' ? children : '';
  
  // Определяем тип блока по ключевым словам
  const getBlockType = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('warning') || lower.includes('предупреждение') || lower.includes('внимание')) {
      return 'warning';
    }
    if (lower.includes('info') || lower.includes('информация') || lower.includes('заметка')) {
      return 'info';
    }
    if (lower.includes('success') || lower.includes('успешно') || lower.includes('готово')) {
      return 'success';
    }
    if (lower.includes('error') || lower.includes('ошибка') || lower.includes('проблема')) {
      return 'error';
    }
    if (lower.includes('tip') || lower.includes('совет') || lower.includes('подсказка')) {
      return 'tip';
    }
    return 'quote';
  };

  const blockType = getBlockType(content);

  const blockStyles = {
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-l-yellow-500',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-l-blue-500',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-l-green-500',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-l-red-500',
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400'
    },
    tip: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      border: 'border-l-purple-500',
      icon: Lightbulb,
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    quote: {
      bg: 'bg-muted/50',
      border: 'border-l-muted-foreground',
      icon: Quote,
      iconColor: 'text-muted-foreground'
    }
  };

  const style = blockStyles[blockType];
  const Icon = style.icon;

  return (
    <div className={cn(
      "rounded-lg border-l-4 p-4 my-4",
      style.bg,
      style.border,
      className
    )}>
      <div className="flex gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", style.iconColor)} />
        <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
};

export const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium text-foreground">
    {children}
  </code>
);