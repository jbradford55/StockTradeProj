
import { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import tradingEngine from '@/lib/trading-engine';
import { cn } from '@/lib/utils';
import TickerSymbol from './TickerSymbol';

interface TransactionHistoryProps {
  className?: string;
  limit?: number;
}

const TransactionHistory = ({ className, limit = 10 }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTransactionIds, setNewTransactionIds] = useState<Set<string>>(new Set());

  // Reset highlighted transactions after 2 seconds
  useEffect(() => {
    if (newTransactionIds.size > 0) {
      const timeout = setTimeout(() => {
        setNewTransactionIds(new Set());
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [newTransactionIds]);

  // Update transactions when new ones come in
  useEffect(() => {
    console.log("Loading transaction history...");
    
    // Initial load
    const initialTransactions = tradingEngine.getRecentTransactions(limit);
    console.log("Initial transactions:", initialTransactions);
    setTransactions(initialTransactions);
    
    // Listen for new transactions
    const handleNewTransactions = (newTxs: Transaction[]) => {
      console.log("New transactions received:", newTxs);
      
      setTransactions(prevTxs => {
        // Combine new transactions with existing ones
        const combined = [...newTxs, ...prevTxs];
        
        // Sort by timestamp (newest first)
        combined.sort((a, b) => b.timestamp - a.timestamp);
        
        // Limit to specified number
        const limited = combined.slice(0, limit);
        
        // Mark new transaction IDs for highlighting
        setNewTransactionIds(new Set(newTxs.map(tx => tx.id)));
        
        return limited;
      });
    };
    
    tradingEngine.addTransactionListener(handleNewTransactions);
    
    return () => {
      tradingEngine.removeTransactionListener(handleNewTransactions);
    };
  }, [limit]);

  // Format timestamp to PST with AM/PM
  const formatTime = (timestamp: number) => {
    // Create a date from the timestamp
    const date = new Date(timestamp);
    
    // Format to PST time with AM/PM
    // Options for Pacific Time (Los Angeles represents PST/PDT)
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    }).format(date);
  };

  // Format date to display in header
  const formatCurrentDate = () => {
    const today = new Date();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    }).format(today);
  };

  // Format transaction type
  const getTransactionTypeLabel = (tx: Transaction) => {
    // Find the buy and sell orders to determine if we were the buyer or seller
    const buyerOrder = tradingEngine.findOrderById(tx.buyOrderId);
    const sellerOrder = tradingEngine.findOrderById(tx.sellOrderId);
    
    console.log(`Transaction ${tx.id}: buyerOrder=${!!buyerOrder}, sellerOrder=${!!sellerOrder}`);
    
    // If we have both orders, we're both buyer and seller (unlikely in real system)
    if (buyerOrder && sellerOrder) {
      return 'Internal';
    }
    
    // If we have the buy order, we're the buyer
    if (buyerOrder) {
      return 'Buy';
    }
    
    // If we have the sell order, we're the seller
    if (sellerOrder) {
      return 'Sell';
    }
    
    // Fallback to using the trading engine's method
    return tradingEngine.isBuyTransaction(tx) ? 'Buy' : 'Sell';
  };

  return (
    <div className={cn('glass-card rounded-xl', className)}>
      <div className="flex justify-between items-center p-3 border-b">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <span className="text-xs text-muted-foreground">{formatCurrentDate()}</span>
      </div>
      
      <div className="p-3">
        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-6 bg-muted/50 py-1.5 px-3 text-xs font-medium text-muted-foreground">
            <div className="col-span-1">Time</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-1">Symbol</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-1">Quantity</div>
            <div className="col-span-1">Total</div>
          </div>
          
          <div className="max-h-[250px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No transactions yet
              </div>
            ) : (
              <div>
                {transactions.map(tx => {
                  const isNew = newTransactionIds.has(tx.id);
                  const typeLabel = getTransactionTypeLabel(tx);
                  const isBuy = typeLabel.includes('Buy');
                  
                  return (
                    <div 
                      key={tx.id}
                      className={cn(
                        "grid grid-cols-6 py-1.5 px-3 text-xs border-t",
                        isNew ? 'bg-primary/10 animate-pulse-once' : '',
                      )}
                    >
                      <div className="col-span-1 font-mono text-xs">
                        {formatTime(tx.timestamp)}
                      </div>
                      <div className={cn(
                        "col-span-1 text-xs font-medium",
                        isBuy ? "text-buy" : "text-sell"
                      )}>
                        {typeLabel}
                      </div>
                      <div className="col-span-1">
                        <TickerSymbol symbol={tx.tickerSymbol} size="sm" />
                      </div>
                      <div className="col-span-1 font-medium">
                        ${tx.price.toFixed(2)}
                      </div>
                      <div className="col-span-1">
                        {tx.quantity.toLocaleString()}
                      </div>
                      <div className="col-span-1 text-muted-foreground">
                        ${(tx.price * tx.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
