-- tests/database/test-queries.sql

-- Test 1: Verify user balance after orders
WITH user_trades AS (
    SELECT 
        u.id,
        u.email,
        u.balance,
        COALESCE(SUM(
            CASE 
                WHEN o.order_type = 'BUY' THEN -t.executed_price * t.executed_quantity
                WHEN o.order_type = 'SELL' THEN t.executed_price * t.executed_quantity
            END
        ), 0) as total_trade_value
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    LEFT JOIN trades t ON o.id = t.order_id
    WHERE o.status = 'FILLED'
    GROUP BY u.id, u.email, u.balance
)
SELECT 
    email,
    balance as current_balance,
    10000 + total_trade_value as expected_balance,
    CASE 
        WHEN balance = 10000 + total_trade_value THEN 'PASS'
        ELSE 'FAIL'
    END as test_result
FROM user_trades;

-- Test 2: Verify portfolio quantities
WITH portfolio_check AS (
    SELECT 
        p.user_id,
        p.symbol,
        p.quantity as portfolio_quantity,
        COALESCE(SUM(
            CASE 
                WHEN o.order_type = 'BUY' THEN t.executed_quantity
                WHEN o.order_type = 'SELL' THEN -t.executed_quantity
            END
        ), 0) as calculated_quantity
    FROM portfolio p
    JOIN orders o ON p.user_id = o.user_id AND p.symbol = o.symbol
    JOIN trades t ON o.id = t.order_id
    WHERE o.status = 'FILLED'
    GROUP BY p.user_id, p.symbol, p.quantity
)
SELECT 
    user_id,
    symbol,
    portfolio_quantity,
    calculated_quantity,
    CASE 
        WHEN portfolio_quantity = calculated_quantity THEN 'PASS'
        ELSE 'FAIL'
    END as test_result
FROM portfolio_check;

-- Test 3: Check for orphaned trades
SELECT 
    'Orphaned Trades Test' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as test_result
FROM trades t
LEFT JOIN orders o ON t.order_id = o.id
WHERE o.id IS NULL;

-- Test 4: Verify all filled orders have trades
SELECT 
    'Filled Orders Have Trades' as test_name,
    COUNT(*) as orders_without_trades,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as test_result
FROM orders o
LEFT JOIN trades t ON o.id = t.order_id
WHERE o.status = 'FILLED' AND t.id IS NULL;

-- Test 5: Check for negative balances
SELECT 
    'Negative Balance Check' as test_name,
    COUNT(*) as negative_balance_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as test_result
FROM users
WHERE balance < 0;

-- Test 6: Verify market data integrity
SELECT 
    'Market Data Integrity' as test_name,
    COUNT(*) as invalid_prices,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as test_result
FROM market_data
WHERE current_price <= 0 OR previous_close <= 0;