-- database/init.sql

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    balance DECIMAL(10, 2) DEFAULT 10000.00, -- Start with $10,000
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create market_data table
CREATE TABLE IF NOT EXISTS market_data (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(255),
    current_price DECIMAL(10, 2) NOT NULL,
    previous_close DECIMAL(10, 2),
    day_change_percent DECIMAL(5, 2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(10) NOT NULL,
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    executed_price DECIMAL(10, 2) NOT NULL,
    executed_quantity INTEGER NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create portfolio table (calculated view)
CREATE TABLE IF NOT EXISTS portfolio (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    average_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol)
);

-- Insert sample market data
INSERT INTO market_data (symbol, company_name, current_price, previous_close) VALUES
('AAPL', 'Apple Inc.', 150.00, 148.50),
('GOOGL', 'Alphabet Inc.', 2500.00, 2480.00),
('MSFT', 'Microsoft Corp.', 300.00, 298.00),
('AMZN', 'Amazon.com Inc.', 3200.00, 3150.00),
('TSLA', 'Tesla Inc.', 800.00, 785.00);

-- Create indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_trades_order_id ON trades(order_id);
CREATE INDEX idx_portfolio_user_id ON portfolio(user_id);