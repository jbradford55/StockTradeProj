
import { useState, FormEvent, useEffect } from 'react';
import { OrderType } from '@/types';
import tradingEngine from '@/lib/trading-engine';
import { getTickerSymbols } from '@/lib/mock-data-generator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Search, X } from 'lucide-react';

interface OrderFormProps {
  className?: string;
}

const OrderForm = ({ className }: OrderFormProps) => {
  const [type, setType] = useState<OrderType>('buy');
  const [ticker, setTicker] = useState('AAPL');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('100.00');
  const [basePrice, setBasePrice] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickerSearch, setTickerSearch] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  
  const availableTickers = getTickerSymbols(1024);
  const filteredTickers = tickerSearch
    ? availableTickers.filter(t => t.toLowerCase().includes(tickerSearch.toLowerCase()))
    : availableTickers.slice(0, 30);

  // Update price when quantity changes
  useEffect(() => {
    const parsedQuantity = parseFloat(quantity) || 1;
    // Calculate new price based on quantity - strictly increasing with quantity
    // Remove the random factor to ensure consistency
    const newPrice = (basePrice * parsedQuantity).toFixed(2);
    setPrice(newPrice);
  }, [quantity, basePrice]);

  // When ticker changes, update the base price
  useEffect(() => {
    // Each ticker gets a different base price in the range of 50-500
    const tickerHash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const newBasePrice = 50 + (tickerHash % 450);
    setBasePrice(newBasePrice);
    
    // Update price immediately with the new base price
    const parsedQuantity = parseFloat(quantity) || 1;
    const newPrice = (newBasePrice * parsedQuantity).toFixed(2);
    setPrice(newPrice);
  }, [ticker]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const parsedQuantity = parseFloat(quantity);
      const parsedPrice = parseFloat(price);
      
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        throw new Error('Quantity must be a positive number');
      }
      
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new Error('Price must be a positive number');
      }
      
      const order = tradingEngine.addOrder(type, ticker, parsedQuantity, parsedPrice);
      
      toast.success(`${type.toUpperCase()} order placed`, {
        description: `${parsedQuantity} ${ticker} at $${parsedPrice}`,
      });
      
    } catch (error) {
      toast.error('Order Error', {
        description: error instanceof Error ? error.message : 'Failed to place order',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle quantity change with validation
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow positive numbers with up to 2 decimal places
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setQuantity(value);
    }
  };

  return (
    <div className={cn('glass-card p-6 rounded-xl', className)}>
      <h2 className="text-xl font-semibold mb-4">Place Order</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="order-type" className="block text-sm font-medium text-muted-foreground">
            Order Type
          </label>
          <div className="flex rounded-md overflow-hidden border">
            <button
              type="button"
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                'focus:outline-none',
                type === 'buy' 
                  ? 'bg-buy text-buy-foreground'
                  : 'bg-background hover:bg-muted'
              )}
              onClick={() => setType('buy')}
            >
              Buy
            </button>
            <button
              type="button"
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                'focus:outline-none',
                type === 'sell' 
                  ? 'bg-sell text-sell-foreground'
                  : 'bg-background hover:bg-muted'
              )}
              onClick={() => setType('sell')}
            >
              Sell
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="ticker" className="block text-sm font-medium text-muted-foreground">
            Ticker Symbol
          </label>
          <div className="relative">
            <div className="flex items-center rounded-md overflow-hidden border">
              <input
                type="text"
                value={ticker}
                className="glass-input w-full px-3 py-2 rounded-md border-none"
                readOnly
                onClick={() => setIsSelectOpen(!isSelectOpen)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                onClick={() => setIsSelectOpen(!isSelectOpen)}
              >
                {isSelectOpen ? '▲' : '▼'}
              </button>
            </div>
            
            {isSelectOpen && (
              <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="sticky top-0 bg-background p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={tickerSearch}
                      onChange={(e) => setTickerSearch(e.target.value)}
                      placeholder="Search ticker symbol..."
                      className="w-full pl-8 pr-8 py-1 rounded-md glass-input text-sm"
                      autoFocus
                    />
                    {tickerSearch && (
                      <button
                        type="button"
                        onClick={() => setTickerSearch('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-1">
                  {filteredTickers.length > 0 ? (
                    filteredTickers.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-sm rounded-md",
                          ticker === t ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                        )}
                        onClick={() => {
                          setTicker(t);
                          setIsSelectOpen(false);
                          setTickerSearch('');
                        }}
                      >
                        {t}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-center py-2 text-muted-foreground">No results found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="quantity" className="block text-sm font-medium text-muted-foreground">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min="0.01"
            step="0.01"
            className="glass-input w-full px-3 py-2 rounded-md"
            value={quantity}
            onChange={handleQuantityChange}
            required
          />
          <p className="text-xs text-muted-foreground">
            Price scales directly with quantity
          </p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm font-medium text-muted-foreground">
            Price ($)
          </label>
          <input
            id="price"
            type="number"
            min="0.01"
            step="0.01"
            className="glass-input w-full px-3 py-2 rounded-md bg-muted/30"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            readOnly
            required
          />
          <p className="text-xs text-muted-foreground">
            Auto-calculated based on quantity
          </p>
        </div>
        
        <button
          type="submit"
          className={cn(
            'w-full py-2 mt-2 rounded-md font-medium transition-all duration-200',
            'shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-primary/50',
            'disabled:opacity-70 disabled:cursor-not-allowed',
            type === 'buy' 
              ? 'bg-buy text-buy-foreground hover:bg-buy/90'
              : 'bg-sell text-sell-foreground hover:bg-sell/90'
          )}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : `Place ${type.toUpperCase()} Order`}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
