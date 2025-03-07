
import { cn } from '@/lib/utils';

interface PriceTagProps {
  price: number;
  change?: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  className?: string;
}

const PriceTag = ({ 
  price, 
  change = 0, 
  size = 'md', 
  showChange = false,
  className 
}: PriceTagProps) => {
  const sizeCls = {
    'sm': 'text-xs',
    'md': 'text-sm',
    'lg': 'text-base'
  };

  // Format the price with 2 decimal places and commas
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  // Determine the change color
  const changeColor = change > 0 
    ? 'text-success' 
    : change < 0 
      ? 'text-destructive' 
      : 'text-muted-foreground';

  // Format the change with plus/minus sign
  const formattedChange = change > 0 
    ? `+${change.toFixed(2)}` 
    : change.toFixed(2);

  return (
    <span 
      className={cn(
        'inline-flex items-center font-mono tracking-tight',
        sizeCls[size],
        className
      )}
    >
      <span className="font-semibold">{formattedPrice}</span>
      {showChange && (
        <span className={cn('ml-1.5', changeColor)}>
          ({formattedChange})
        </span>
      )}
    </span>
  );
};

export default PriceTag;
