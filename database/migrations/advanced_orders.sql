-- Add to database/migrations/advanced_orders.sql

-- Update orders table for advanced order types
ALTER TABLE orders ADD COLUMN order_subtype VARCHAR(20) DEFAULT 'MARKET';
ALTER TABLE orders ADD COLUMN limit_price DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN stop_price DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN time_in_force VARCHAR(10) DEFAULT 'DAY';
ALTER TABLE orders ADD COLUMN expire_time TIMESTAMP;

-- Create order book table
CREATE TABLE order_book (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_book_symbol_side_price (symbol, side, price)
);

-- Create order matching history
CREATE TABLE order_matches (
    id SERIAL PRIMARY KEY,
    buy_order_id INTEGER REFERENCES orders(id),
    sell_order_id INTEGER REFERENCES orders(id),
    matched_price DECIMAL(10, 2) NOT NULL,
    matched_quantity INTEGER NOT NULL,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);