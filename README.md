
# TradeFlux Matcher - Stock Trading Engine

A real-time stock trading engine for matching buy and sell orders, supporting up to 1,024 ticker symbols.

## Project info


## How to run this project locally

Follow these steps to run the project on your local machine:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/your-username/tradeflux-matcher.git

# Step 2: Navigate to the project directory.
cd tradeflux-matcher

# Step 3: Install the necessary dependencies.
npm install
# or if you prefer using yarn:
# yarn install
# or if you prefer using pnpm:
# pnpm install
# or if you prefer using bun:
# bun install

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
# or
# yarn dev
# or
# pnpm dev
# or
# bun dev
```

After running these commands, the application should be available at http://localhost:8080 in your web browser.

## Features

- Real-time order matching with O(n) time complexity
- Support for 1,024 ticker symbols
- Order book visualization
- Transaction history tracking
- Mock data generation for testing

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

