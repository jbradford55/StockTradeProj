
import { cn } from '@/lib/utils';

interface TickerSymbolProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TickerSymbol = ({ symbol, size = 'md', className }: TickerSymbolProps) => {
  const sizeCls = {
    'sm': 'text-xs px-1.5 py-0.5',
    'md': 'text-sm px-2 py-1',
    'lg': 'text-base px-3 py-1.5'
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center font-semibold rounded',
        'bg-secondary/80 text-primary',
        'transition-all duration-300 ease-out',
        'border border-border/50',
        sizeCls[size],
        className
      )}
      aria-label={`Ticker symbol: ${symbol}`}
    >
      {symbol}
    </span>
  );
};

export default TickerSymbol;
