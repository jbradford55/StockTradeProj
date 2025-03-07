
export type OrderType = 'buy' | 'sell';

export type OrderStatus = 'pending' | 'matched' | 'partial' | 'canceled';

export interface Order {
  id: string;
  type: OrderType;
  tickerSymbol: string;
  quantity: number;
  price: number;
  timestamp: number;
  status: OrderStatus;
  remainingQuantity: number;
}

export interface Transaction {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  tickerSymbol: string;
  quantity: number;
  price: number;
  timestamp: number;
}

export interface OrderBook {
  buyOrders: Order[];
  sellOrders: Order[];
}

export interface TickerData {
  symbol: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface PortfolioPosition {
  symbol: string;
  shares: number;
  averageBuyPrice: number;
  currentValue: number;
}

export interface Portfolio {
  positions: Record<string, PortfolioPosition>;
  totalValue: number;
}
