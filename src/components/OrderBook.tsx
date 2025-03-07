
import { useState, useEffect } from 'react';
import { Order } from '@/types';
import tradingEngine from '@/lib/trading-engine';
import { cn } from '@/lib/utils';
import TickerSymbol from './TickerSymbol';
import PriceTag from './PriceTag';
import { getTickerSymbols } from '@/lib/mock-data-generator';
import { Search, X } from 'lucide-react';

interface OrderBookProps {
  tickerSymbol: string;
  onTickerChange: (ticker: string) => void;
  className?: string;
}

const OrderBook = ({ tickerSymbol, onTickerChange, className }: OrderBookProps) => {
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const availableTickers = getTickerSymbols(1024);
  
  // Filter tickers based on search
  const filteredTickers = searchQuery
    ? availableTickers.filter(ticker => 
        ticker.toLowerCase().includes(searchQuery.toLowerCase()))
    : availableTickers.slice(0, 30); // Show first 30 by default when no search

  // Refresh the order book every 1 second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Update the orders when ticker changes or refresh happens
  useEffect(() => {
    setBuyOrders(tradingEngine.getBuyOrders(tickerSymbol));
    setSellOrders(tradingEngine.getSellOrders(tickerSymbol));
  }, [tickerSymbol, refreshCounter]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={cn('glass-card rounded-xl', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b">
        <h2 className="text-lg font-semibold">Order Book</h2>
        <TickerSymbol symbol={tickerSymbol} size="lg" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-2">
        {/* Ticker selection section */}
        <div className="md:col-span-2">
          {/* Search input */}
          <div className="relative mb-1">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <Search className="h-3 w-3 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search ticker symbols..."
              className="glass-input w-full pl-7 pr-7 py-1 rounded-md text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          
          {/* Results count */}
          <p className="text-xs text-muted-foreground mb-1">
            {searchQuery 
              ? `Found ${filteredTickers.length} ticker${filteredTickers.length !== 1 ? 's' : ''}`
              : `Popular tickers (${filteredTickers.length} of ${availableTickers.length})`}
          </p>
          
          {/* Ticker grid - making it more compact */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 max-h-[335px] overflow-y-auto pr-1">
            {filteredTickers.length > 0 ? (
              filteredTickers.map((ticker) => (
                <button
                  key={ticker}
                  onClick={() => onTickerChange(ticker)}
                  className={cn(
                    "px-1 py-0.5 rounded-md text-xs font-medium transition-all duration-200",
                    tickerSymbol === ticker
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary hover:bg-secondary/80 text-foreground"
                  )}
                >
                  {ticker}
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground col-span-full">No matching tickers found</p>
            )}
          </div>
        </div>
        
        {/* Order books section */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Buy Orders */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Buy Orders</h3>
            <div className="border rounded-md overflow-hidden h-full">
              <div className="grid grid-cols-3 bg-muted/50 py-0.5 px-1 text-xs font-medium text-muted-foreground">
                <div>Price</div>
                <div>Quantity</div>
                <div>Total</div>
              </div>
              
              <div className="max-h-[335px] overflow-y-auto">
                {buyOrders.length === 0 ? (
                  <div className="py-3 text-center text-xs text-muted-foreground">
                    No buy orders
                  </div>
                ) : (
                  <div>
                    {buyOrders.map(order => (
                      <div 
                        key={order.id}
                        className={cn(
                          "grid grid-cols-3 py-0.5 px-1 text-xs border-t",
                          order.status === 'matched' ? 'bg-buy/10' : 
                          order.status === 'partial' ? 'bg-buy/5' : ''
                        )}
                      >
                        <div className="font-medium text-buy">
                          ${order.price.toFixed(2)}
                        </div>
                        <div>
                          {order.quantity.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">
                          ${(order.price * order.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Sell Orders */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Sell Orders</h3>
            <div className="border rounded-md overflow-hidden h-full">
              <div className="grid grid-cols-3 bg-muted/50 py-0.5 px-1 text-xs font-medium text-muted-foreground">
                <div>Price</div>
                <div>Quantity</div>
                <div>Total</div>
              </div>
              
              <div className="max-h-[335px] overflow-y-auto">
                {sellOrders.length === 0 ? (
                  <div className="py-3 text-center text-xs text-muted-foreground">
                    No sell orders
                  </div>
                ) : (
                  <div>
                    {sellOrders.map(order => (
                      <div 
                        key={order.id}
                        className={cn(
                          "grid grid-cols-3 py-0.5 px-1 text-xs border-t",
                          order.status === 'matched' ? 'bg-sell/10' : 
                          order.status === 'partial' ? 'bg-sell/5' : ''
                        )}
                      >
                        <div className="font-medium text-sell">
                          ${order.price.toFixed(2)}
                        </div>
                        <div>
                          {order.quantity.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">
                          ${(order.price * order.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
