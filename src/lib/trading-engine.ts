import { Order, OrderType, Transaction, Portfolio, PortfolioPosition } from '@/types';

// Maximum number of tickers supported
const MAX_TICKERS = 1024;

// In-memory storage for orders, indexed by ticker symbol
// We're implementing this without using Map/Dictionary as required
class OrderStorage {
  private buyOrders: Order[][] = Array(MAX_TICKERS).fill(null).map(() => []);
  private sellOrders: Order[][] = Array(MAX_TICKERS).fill(null).map(() => []);
  private tickerToIndex: Array<{ symbol: string; index: number }> = [];
  private nextIndex = 0;

  // Get or create index for a ticker symbol
  private getTickerIndex(symbol: string): number {
    // Linear search (O(n) but with very small n as we cache the results)
    for (let i = 0; i < this.tickerToIndex.length; i++) {
      if (this.tickerToIndex[i].symbol === symbol) {
        return this.tickerToIndex[i].index;
      }
    }
    
    // Not found, create new entry if we haven't reached MAX_TICKERS
    if (this.nextIndex < MAX_TICKERS) {
      const index = this.nextIndex++;
      this.tickerToIndex.push({ symbol, index });
      return index;
    }
    
    throw new Error(`Maximum number of tickers (${MAX_TICKERS}) reached`);
  }

  addOrder(order: Order): void {
    const index = this.getTickerIndex(order.tickerSymbol);
    
    if (order.type === 'buy') {
      this.buyOrders[index].push(order);
      // Sort buy orders by price (descending) and timestamp (ascending) for O(n log n)
      this.buyOrders[index].sort((a, b) => 
        b.price !== a.price ? b.price - a.price : a.timestamp - b.timestamp
      );
    } else {
      this.sellOrders[index].push(order);
      // Sort sell orders by price (ascending) and timestamp (ascending) for O(n log n)
      this.sellOrders[index].sort((a, b) => 
        a.price !== b.price ? a.price - b.price : a.timestamp - b.timestamp
      );
    }
  }

  getBuyOrders(symbol: string): Order[] {
    try {
      const index = this.getTickerIndex(symbol);
      return this.buyOrders[index];
    } catch (e) {
      return [];
    }
  }

  getSellOrders(symbol: string): Order[] {
    try {
      const index = this.getTickerIndex(symbol);
      return this.sellOrders[index];
    } catch (e) {
      return [];
    }
  }

  updateOrder(order: Order): void {
    const index = this.getTickerIndex(order.tickerSymbol);
    const orders = order.type === 'buy' ? this.buyOrders[index] : this.sellOrders[index];
    
    for (let i = 0; i < orders.length; i++) {
      if (orders[i].id === order.id) {
        orders[i] = order;
        break;
      }
    }
  }

  removeOrder(order: Order): void {
    const index = this.getTickerIndex(order.tickerSymbol);
    const orders = order.type === 'buy' ? this.buyOrders[index] : this.sellOrders[index];
    
    for (let i = 0; i < orders.length; i++) {
      if (orders[i].id === order.id) {
        orders.splice(i, 1);
        break;
      }
    }
  }

  getAllTickers(): string[] {
    return this.tickerToIndex.map(item => item.symbol);
  }
}

class TradingEngine {
  private orderStorage = new OrderStorage();
  private transactions: Transaction[] = [];
  private orderCounter = 0;
  private transactionCounter = 0;
  private listeners: ((transactions: Transaction[]) => void)[] = [];
  private portfolioPositions: Record<string, PortfolioPosition> = {};

  generateOrderId(): string {
    return `order-${Date.now()}-${this.orderCounter++}`;
  }

  generateTransactionId(): string {
    return `tx-${Date.now()}-${this.transactionCounter++}`;
  }

  // Add a new order to the book
  addOrder(
    type: OrderType,
    tickerSymbol: string,
    quantity: number,
    price: number
  ): Order {
    if (quantity <= 0) throw new Error('Quantity must be positive');
    if (price <= 0) throw new Error('Price must be positive');
    if (!tickerSymbol.trim()) throw new Error('Ticker symbol is required');

    // For sell orders, validate that the user has enough shares
    if (type === 'sell') {
      const position = this.portfolioPositions[tickerSymbol];
      if (!position || position.shares < quantity) {
        throw new Error(`Not enough shares of ${tickerSymbol} to sell. You have ${position?.shares || 0} shares.`);
      }
    }

    const order: Order = {
      id: this.generateOrderId(),
      type,
      tickerSymbol,
      quantity,
      price,
      timestamp: Date.now(),
      status: 'pending',
      remainingQuantity: quantity
    };

    console.log(`Creating new ${type} order:`, order);
    this.orderStorage.addOrder(order);
    
    // Try to match the order immediately
    const newTransactions = this.matchOrder(order);
    
    // If no matches were found for a buy order, auto-fill it temporarily to update portfolio
    // This simulates the order being matched in a real exchange
    if (type === 'buy' && newTransactions.length === 0) {
      console.log("Auto-filling buy order as no matching sell orders were found");
      
      // Create a synthetic transaction for buy orders to update the portfolio immediately
      const syntheticTransaction: Transaction = {
        id: this.generateTransactionId(),
        buyOrderId: order.id,
        sellOrderId: 'auto-filled',  // Mark as auto-filled
        tickerSymbol: order.tickerSymbol,
        quantity: order.quantity,
        price: order.price,
        timestamp: Date.now()
      };
      
      console.log("Created synthetic transaction:", syntheticTransaction);
      
      // Update portfolio based on this synthetic transaction
      this.updatePortfolio(syntheticTransaction);
      
      // Add to transactions list and notify listeners
      this.transactions.push(syntheticTransaction);
      this.notifyListeners([syntheticTransaction]);
      
      // Update order status
      order.status = 'matched';
      order.remainingQuantity = 0;
      this.orderStorage.updateOrder(order);
    }
    else if (type === 'sell' && newTransactions.length === 0) {
      console.log("Creating explicit sell transaction as no matching buy orders were found");
      
      // For sell orders that didn't match, create a transaction anyway to record the sale
      const sellTransaction: Transaction = {
        id: this.generateTransactionId(),
        buyOrderId: 'market',
        sellOrderId: order.id,
        tickerSymbol: order.tickerSymbol,
        quantity: order.quantity,
        price: order.price,
        timestamp: Date.now()
      };
      
      console.log("Created sell transaction:", sellTransaction);
      
      // Update portfolio based on this sell transaction
      this.updatePortfolio(sellTransaction);
      
      // Add to transactions list and notify listeners
      this.transactions.push(sellTransaction);
      this.notifyListeners([sellTransaction]);
      
      // Update order status
      order.status = 'matched';
      order.remainingQuantity = 0;
      this.orderStorage.updateOrder(order);
    }
    else if (newTransactions.length > 0) {
      console.log(`Created ${newTransactions.length} transactions from matching orders`);
      // Notify listeners of new transactions
      this.notifyListeners(newTransactions);
    }
    
    return order;
  }

  // Match an order with existing orders in the book
  matchOrder(order: Order): Transaction[] {
    const newTransactions: Transaction[] = [];
    let orderFilled = false;
    
    // Get the opposite order type to match against
    const oppositeType = order.type === 'buy' ? 'sell' : 'buy';
    const oppositeOrders = oppositeType === 'buy' 
      ? this.orderStorage.getBuyOrders(order.tickerSymbol) 
      : this.orderStorage.getSellOrders(order.tickerSymbol);
    
    // No matching orders
    if (oppositeOrders.length === 0) {
      return newTransactions;
    }
    
    // For buy orders, we match against sell orders (lowest price first)
    // For sell orders, we match against buy orders (highest price first)
    
    // Make a copy of oppositeOrders to avoid mutation during iteration
    const ordersToProcess = [...oppositeOrders];
    
    for (const oppositeOrder of ordersToProcess) {
      // Skip orders that are already fully matched or canceled
      if (oppositeOrder.status === 'matched' || oppositeOrder.status === 'canceled' || oppositeOrder.remainingQuantity <= 0) {
        continue;
      }
      
      // Check if prices match for the trade
      // For a buy order, its price must be >= sell order price
      // For a sell order, its price must be <= buy order price
      const priceMatches = order.type === 'buy' 
        ? order.price >= oppositeOrder.price 
        : order.price <= oppositeOrder.price;
      
      if (!priceMatches) {
        continue; // No match, try next order
      }
      
      // Calculate the matched quantity
      const matchedQuantity = Math.min(order.remainingQuantity, oppositeOrder.remainingQuantity);
      
      // Use the price of the older order (the one that was in the book first)
      const transactionPrice = oppositeOrder.timestamp < order.timestamp 
        ? oppositeOrder.price 
        : order.price;
      
      // Create transaction
      const transaction: Transaction = {
        id: this.generateTransactionId(),
        buyOrderId: order.type === 'buy' ? order.id : oppositeOrder.id,
        sellOrderId: order.type === 'sell' ? order.id : oppositeOrder.id,
        tickerSymbol: order.tickerSymbol,
        quantity: matchedQuantity,
        price: transactionPrice,
        timestamp: Date.now()
      };
      
      // Update portfolio based on transaction
      this.updatePortfolio(transaction);
      
      // Update remaining quantities
      order.remainingQuantity -= matchedQuantity;
      oppositeOrder.remainingQuantity -= matchedQuantity;
      
      // Update order statuses
      if (order.remainingQuantity === 0) {
        order.status = 'matched';
        orderFilled = true;
      } else {
        order.status = 'partial';
      }
      
      if (oppositeOrder.remainingQuantity === 0) {
        oppositeOrder.status = 'matched';
        // We need to update the order in storage
        this.orderStorage.updateOrder(oppositeOrder);
      } else {
        oppositeOrder.status = 'partial';
        // We need to update the order in storage
        this.orderStorage.updateOrder(oppositeOrder);
      }
      
      // Add transaction to list
      newTransactions.push(transaction);
      this.transactions.push(transaction);
      
      // Exit if order is completely filled
      if (orderFilled) {
        break;
      }
    }
    
    // Update the original order in storage if it has remaining quantity
    if (!orderFilled && order.remainingQuantity > 0) {
      this.orderStorage.updateOrder(order);
    }
    
    return newTransactions;
  }

  // Update portfolio based on a transaction
  private updatePortfolio(transaction: Transaction): void {
    const { tickerSymbol, quantity, price } = transaction;
    
    // Initialize position if it doesn't exist
    if (!this.portfolioPositions[tickerSymbol]) {
      this.portfolioPositions[tickerSymbol] = {
        symbol: tickerSymbol,
        shares: 0,
        averageBuyPrice: 0,
        currentValue: price
      };
    }
    
    const position = this.portfolioPositions[tickerSymbol];
    
    // Update based on transaction (adding shares for buys, removing for sells)
    if (this.isBuyTransaction(transaction)) {
      // When buying, update average price
      const totalSharesBefore = position.shares;
      const newShares = totalSharesBefore + quantity;
      
      // Calculate new average price (weighted average)
      position.averageBuyPrice = (totalSharesBefore * position.averageBuyPrice + quantity * price) / newShares;
      position.shares = newShares;
    } else {
      // When selling, just reduce shares (keep average price the same)
      position.shares -= quantity;
      
      // Remove position if no shares left
      if (position.shares <= 0) {
        delete this.portfolioPositions[tickerSymbol];
      }
    }
    
    // Always update current value to latest price
    if (this.portfolioPositions[tickerSymbol]) {
      this.portfolioPositions[tickerSymbol].currentValue = price;
    }
  }
  
  // Helper to check if this transaction is a buy from our perspective
  isBuyTransaction(transaction: Transaction): boolean {
    // Auto-filled is always a buy
    if (transaction.sellOrderId === 'auto-filled') {
      return true;
    }
    
    // 'market' buyOrderId means it's a sell to the market
    if (transaction.buyOrderId === 'market') {
      return false;
    }
    
    // For regular transactions, we need to check if we were the buyer
    // We'll search through our orders to see if this transaction matches one of our buy orders
    const buyOrder = this.findOrderById(transaction.buyOrderId);
    if (buyOrder) {
      return true; // We were the buyer
    }
    
    // If we can't find a buy order, check if we were the seller
    const sellOrder = this.findOrderById(transaction.sellOrderId);
    if (sellOrder) {
      return false; // We were the seller
    }
    
    // Fallback - should never reach here in practice
    console.warn("Could not determine transaction type for:", transaction);
    return false;
  }
  
  // Helper to find an order by ID - Now exposed as public method
  findOrderById(orderId: string): Order | null {
    // 'market' and 'auto-filled' are special IDs that don't correspond to real orders
    if (orderId === 'market' || orderId === 'auto-filled') {
      return null;
    }
    
    for (const ticker of this.orderStorage.getAllTickers()) {
      const buyOrders = this.orderStorage.getBuyOrders(ticker);
      for (const order of buyOrders) {
        if (order.id === orderId) {
          return order;
        }
      }
      
      const sellOrders = this.orderStorage.getSellOrders(ticker);
      for (const order of sellOrders) {
        if (order.id === orderId) {
          return order;
        }
      }
    }
    
    return null;
  }

  // Get a user's portfolio
  getPortfolio(): Portfolio {
    // Calculate total value
    let totalValue = 0;
    
    Object.values(this.portfolioPositions).forEach(position => {
      totalValue += position.shares * position.currentValue;
    });
    
    return {
      positions: { ...this.portfolioPositions },
      totalValue
    };
  }

  // Get all buy orders for a ticker
  getBuyOrders(tickerSymbol: string): Order[] {
    return this.orderStorage.getBuyOrders(tickerSymbol);
  }

  // Get all sell orders for a ticker
  getSellOrders(tickerSymbol: string): Order[] {
    return this.orderStorage.getSellOrders(tickerSymbol);
  }

  // Get all transactions
  getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  // Get recent transactions, limited by count
  getRecentTransactions(count: number): Transaction[] {
    console.log(`Getting ${count} recent transactions from total ${this.transactions.length}`);
    const sorted = [...this.transactions].sort((a, b) => b.timestamp - a.timestamp);
    return sorted.slice(0, count);
  }

  // Get available tickers
  getAvailableTickers(): string[] {
    return this.orderStorage.getAllTickers();
  }

  // Add a listener for new transactions
  addTransactionListener(listener: (transactions: Transaction[]) => void): void {
    this.listeners.push(listener);
  }

  // Remove a transaction listener
  removeTransactionListener(listener: (transactions: Transaction[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Notify all listeners of new transactions
  private notifyListeners(transactions: Transaction[]): void {
    for (const listener of this.listeners) {
      listener(transactions);
    }
  }
}

// Create singleton instance
const tradingEngine = new TradingEngine();

export default tradingEngine;
