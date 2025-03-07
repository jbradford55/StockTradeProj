
import { useState, useEffect } from 'react';
import { getTickerSymbols, startAutoGeneration, stopAutoGeneration } from '@/lib/mock-data-generator';
import OrderForm from '@/components/OrderForm';
import OrderBook from '@/components/OrderBook';
import TransactionHistory from '@/components/TransactionHistory';
import Portfolio from '@/components/Portfolio';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Index = () => {
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [autoGenRate, setAutoGenRate] = useState(5);
  const [isAutoGenEnabled, setIsAutoGenEnabled] = useState(false);
  
  // Handle auto-generation of orders
  useEffect(() => {
    if (isAutoGenEnabled) {
      // Generate orders at the specified rate (orders per second)
      const stopFn = startAutoGeneration(autoGenRate, 1000);
      toast.info(`Auto-generating ${autoGenRate} orders per second`);
      
      return () => {
        stopFn();
        toast.info('Auto-generation stopped');
      };
    }
  }, [isAutoGenEnabled, autoGenRate]);

  const toggleAutoGeneration = () => {
    setIsAutoGenEnabled(!isAutoGenEnabled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 text-foreground flex flex-col">
      <header className="glass-card border-b sticky top-0 z-10">
        <div className="container mx-auto py-1 px-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight animate-fade-in">TradeFlux</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <label 
                  htmlFor="auto-gen-toggle" 
                  className="text-sm font-medium cursor-pointer"
                  onClick={toggleAutoGeneration}
                >
                  Auto-generate:
                </label>
                <button 
                  className="relative inline-block h-5 w-10 flex-shrink-0 cursor-pointer"
                  onClick={toggleAutoGeneration}
                  aria-label="Toggle auto-generate orders"
                >
                  <input
                    type="checkbox"
                    id="auto-gen-toggle"
                    className="peer sr-only"
                    checked={isAutoGenEnabled}
                    readOnly
                  />
                  <span className={cn(
                    "absolute inset-0 rounded-full transition",
                    isAutoGenEnabled ? "bg-success" : "bg-muted-foreground/30"
                  )} />
                  <span className={cn(
                    "absolute inset-y-1 left-1 aspect-square rounded-full bg-white transition-all",
                    isAutoGenEnabled ? "translate-x-5" : ""
                  )} />
                </button>
              </div>
              {isAutoGenEnabled && (
                <div className="flex items-center space-x-1">
                  <label htmlFor="auto-gen-rate" className="text-xs font-medium">
                    Rate:
                  </label>
                  <select
                    id="auto-gen-rate"
                    className="glass-input px-1.5 py-0.5 rounded text-xs"
                    value={autoGenRate}
                    onChange={(e) => setAutoGenRate(Number(e.target.value))}
                  >
                    <option value="1">1/s</option>
                    <option value="2">2/s</option>
                    <option value="5">5/s</option>
                    <option value="10">10/s</option>
                    <option value="20">20/s</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-2 px-3 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1">
          {/* Left column: Order Form */}
          <div className="lg:col-span-1 animate-scale-in">
            <OrderForm />
          </div>

          {/* Middle/Right columns: Order Book & Portfolio */}
          <div className="lg:col-span-2 flex flex-col space-y-2 h-full">
            {/* Portfolio - only rendered when there are positions */}
            <div className="animate-scale-in flex-shrink-0">
              <Portfolio />
            </div>

            {/* OrderBook with ticker selection - expanded to fill available space */}
            <div className="animate-scale-in flex-1" style={{ animationDelay: '100ms', minHeight: '350px' }}>
              <OrderBook 
                tickerSymbol={selectedTicker} 
                onTickerChange={setSelectedTicker}
                className="h-full"
              />
            </div>
          </div>
        </div>

        {/* Transaction History - full width at the bottom */}
        <div className="mt-2 animate-scale-in" style={{ animationDelay: '200ms' }}>
          <TransactionHistory limit={10} />
        </div>
      </main>

      <footer className="border-t mt-1">
        <div className="container mx-auto py-1 px-3">
          <p className="text-center text-xs text-muted-foreground">
            TradeFlux Stock Matching Engine
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
