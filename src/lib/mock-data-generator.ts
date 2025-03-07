
import tradingEngine from './trading-engine';
import { OrderType } from '@/types';

// List of 1024 ticker symbols (using a generator approach to avoid bloating the code)
function* generateTickerSymbols() {
  // Common real tickers
  const realTickers = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK.A', 'JPM', 'JNJ',
    'V', 'PG', 'UNH', 'HD', 'BAC', 'XOM', 'AVGO', 'CVX', 'MA', 'ABBV',
    'PEP', 'ORCL', 'KO', 'MRK', 'LLY', 'COST', 'TMO', 'CSCO', 'ABT', 'CRM'
  ];
  
  // Generate additional tickers to reach 1024
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  // First yield the real tickers
  for (const ticker of realTickers) {
    yield ticker;
  }
  
  // Then generate additional ones
  let count = realTickers.length;
  
  // Generate 2-letter tickers
  for (let i = 0; i < letters.length && count < 1024; i++) {
    for (let j = 0; j < letters.length && count < 1024; j++) {
      yield `${letters[i]}${letters[j]}`;
      count++;
    }
  }
  
  // If somehow we still need more, generate 3-letter tickers
  if (count < 1024) {
    for (let i = 0; i < letters.length && count < 1024; i++) {
      for (let j = 0; j < letters.length && count < 1024; j++) {
        for (let k = 0; k < letters.length && count < 1024; k++) {
          yield `${letters[i]}${letters[j]}${letters[k]}`;
          count++;
        }
      }
    }
  }
}

// Convert generator to array for random selection
const tickerSymbolsArray: string[] = [...generateTickerSymbols()];

// Random number within range (inclusive)
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random price
function randomPrice(): number {
  // Generate a price between $1 and $1000
  return parseFloat((Math.random() * 999 + 1).toFixed(2));
}

// Generate a random quantity
function randomQuantity(): number {
  // Generate a quantity between 1 and 100
  return randomInRange(1, 100);
}

// Pick a random ticker
function randomTicker(): string {
  return tickerSymbolsArray[randomInRange(0, Math.min(tickerSymbolsArray.length - 1, 99))];
}

// Generate a random order type
function randomOrderType(): OrderType {
  return Math.random() > 0.5 ? 'buy' : 'sell';
}

// Generate a random order that will succeed
export function generateRandomOrder() {
  try {
    // First try a random order
    const type = randomOrderType();
    const ticker = randomTicker();
    const quantity = randomQuantity();
    const price = randomPrice();
    
    // For sell orders, check if we have enough shares first
    if (type === 'sell') {
      const portfolio = tradingEngine.getPortfolio();
      const position = portfolio.positions[ticker];
      
      // If we don't have the position or not enough shares, generate a buy order instead
      if (!position || position.shares < quantity) {
        return tradingEngine.addOrder('buy', ticker, quantity, price);
      }
    }
    
    return tradingEngine.addOrder(type, ticker, quantity, price);
  } catch (error) {
    // If there's an error (e.g., not enough shares), fallback to a buy order
    const ticker = randomTicker();
    const quantity = randomQuantity();
    const price = randomPrice();
    
    return tradingEngine.addOrder('buy', ticker, quantity, price);
  }
}

// Generate multiple random orders
export function generateRandomOrders(count: number) {
  const orders = [];
  for (let i = 0; i < count; i++) {
    orders.push(generateRandomOrder());
  }
  return orders;
}

// Start automatic generation with specified interval
let autoGenerateInterval: number | null = null;

export function startAutoGeneration(ordersPerInterval: number, intervalMs: number) {
  if (autoGenerateInterval !== null) {
    stopAutoGeneration();
  }
  
  autoGenerateInterval = window.setInterval(() => {
    generateRandomOrders(ordersPerInterval);
  }, intervalMs);
  
  return () => stopAutoGeneration();
}

export function stopAutoGeneration() {
  if (autoGenerateInterval !== null) {
    clearInterval(autoGenerateInterval);
    autoGenerateInterval = null;
  }
}

// Get the list of ticker symbols
export function getTickerSymbols(limit: number = 30): string[] {
  return tickerSymbolsArray.slice(0, limit);
}
