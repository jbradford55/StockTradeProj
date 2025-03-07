
import { useState, useEffect } from 'react';
import type { Portfolio as PortfolioType, PortfolioPosition } from '@/types';
import tradingEngine from '@/lib/trading-engine';
import { cn } from '@/lib/utils';
import TickerSymbol from './TickerSymbol';
import PriceTag from './PriceTag';

interface PortfolioProps {
  className?: string;
}

const Portfolio = ({ className }: PortfolioProps) => {
  const [portfolio, setPortfolio] = useState<PortfolioType | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Refresh the portfolio every 2 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  // Update portfolio when the refresh happens
  useEffect(() => {
    const updatedPortfolio = tradingEngine.getPortfolio();
    setPortfolio(updatedPortfolio);
  }, [refreshCounter]);

  // If portfolio is empty or null, return null (don't render anything)
  if (!portfolio || Object.keys(portfolio.positions).length === 0) {
    return null;
  }

  return (
    <div className={cn('glass-card rounded-xl', className)}>
      <div className="flex justify-between items-center p-2 border-b">
        <h2 className="text-lg font-semibold">Your Portfolio</h2>
        <div className="text-sm font-medium">
          Your Total Value: <span className="text-primary">${portfolio.totalValue.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="p-2">
        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-5 bg-muted/50 py-1 px-2 text-xs font-medium text-muted-foreground">
            <div>Symbol</div>
            <div>Shares</div>
            <div>Current Stock Price</div>
            <div>Your Total Value</div>
            <div>Avg. Price</div>
          </div>
          
          <div className="max-h-[150px] overflow-y-auto">
            {Object.values(portfolio.positions).map((position) => (
              <div 
                key={position.symbol}
                className="grid grid-cols-5 py-1 px-2 text-xs border-t"
              >
                <div>
                  <TickerSymbol symbol={position.symbol} size="sm" />
                </div>
                <div className="font-medium">
                  {position.shares.toLocaleString()}
                </div>
                <div>
                  <PriceTag price={position.currentValue} />
                </div>
                <div className="text-muted-foreground">
                  ${(position.shares * position.currentValue).toFixed(2)}
                </div>
                <div>
                  ${position.averageBuyPrice.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
