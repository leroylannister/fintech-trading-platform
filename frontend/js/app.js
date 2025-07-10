// frontend/js/app.js

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// State management
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Authentication Functions
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showDashboard();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        alert('Network error. Please try again.');
        console.error('Login error:', error);
    }
}

async function register(email, password, fullName) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, fullName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showDashboard();
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        alert('Network error. Please try again.');
        console.error('Registration error:', error);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showAuthSection();
}

// UI Navigation
function showDashboard() {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    
    // Update user info
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('user-balance').textContent = `$${parseFloat(currentUser.balance).toFixed(2)}`;
    
    // Load dashboard data
    loadMarketPrices();
    loadPortfolio();
    loadOrderHistory();
}

function showAuthSection() {
    authSection.style.display = 'block';
    dashboardSection.style.display = 'none';
}

// Trading Functions
async function loadMarketPrices() {
    try {
        const response = await fetch(`${API_BASE_URL}/market/prices`);
        const data = await response.json();
        
        const marketGrid = document.getElementById('market-prices');
        marketGrid.innerHTML = '';
        
        data.prices.forEach(stock => {
            const changePercent = ((stock.current_price - stock.previous_close) / stock.previous_close * 100).toFixed(2);
            const changeClass = changePercent >= 0 ? 'positive' : 'negative';
            const changeSymbol = changePercent >= 0 ? '+' : '';
            
            const stockCard = document.createElement('div');
            stockCard.className = 'stock-card';
            stockCard.innerHTML = `
                <div class="stock-symbol">${stock.symbol}</div>
                <div class="stock-name">${stock.company_name}</div>
                <div class="stock-price">$${parseFloat(stock.current_price).toFixed(2)}</div>
                <div class="price-change ${changeClass}">${changeSymbol}${changePercent}%</div>
            `;
            marketGrid.appendChild(stockCard);
        });
    } catch (error) {
        console.error('Error loading market prices:', error);
    }
}

async function placeOrder(symbol, orderType, quantity, price) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/place`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ symbol, orderType, quantity, price })
        });
        
        const data = await response.json();
        const messageEl = document.getElementById('order-message');
        
        if (response.ok) {
            messageEl.textContent = `Order executed successfully at $${data.order.executionPrice}`;
            messageEl.className = 'success';
            messageEl.style.display = 'block';
            
            // Reload data
            loadPortfolio();
            loadOrderHistory();
            
            // Update balance
            if (currentUser) {
                const balanceChange = orderType === 'BUY' 
                    ? -(quantity * data.order.executionPrice)
                    : (quantity * data.order.executionPrice);
                currentUser.balance = parseFloat(currentUser.balance) + balanceChange;
                document.getElementById('user-balance').textContent = `$${currentUser.balance.toFixed(2)}`;
            }
            
            // Clear form
            document.getElementById('order-form').reset();
        } else {
            messageEl.textContent = data.error || 'Order failed';
            messageEl.className = 'error';
            messageEl.style.display = 'block';
        }
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
        
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
    }
}

async function loadPortfolio() {
    try {
        const response = await fetch(`${API_BASE_URL}/portfolio`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        const portfolio = data.portfolio;
        
        // Update summary
        document.getElementById('cash-balance').textContent = `$${parseFloat(portfolio.cashBalance).toFixed(2)}`;
        document.getElementById('market-value').textContent = `$${parseFloat(portfolio.totalMarketValue).toFixed(2)}`;
        document.getElementById('total-value').textContent = `$${parseFloat(portfolio.totalPortfolioValue).toFixed(2)}`;
        
        // Update holdings table
        const holdingsBody = document.getElementById('holdings-body');
        holdingsBody.innerHTML = '';
        
        portfolio.holdings.forEach(holding => {
            const pnl = parseFloat(holding.unrealized_pnl);
            const pnlClass = pnl >= 0 ? 'positive' : 'negative';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${holding.symbol}</td>
                <td>${holding.quantity}</td>
                <td>$${parseFloat(holding.average_price).toFixed(2)}</td>
                <td>$${parseFloat(holding.current_price).toFixed(2)}</td>
                <td>$${parseFloat(holding.market_value).toFixed(2)}</td>
                <td class="${pnlClass}">$${pnl.toFixed(2)}</td>
            `;
            holdingsBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading portfolio:', error);
    }
}

async function loadOrderHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/history`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        const historyBody = document.getElementById('history-body');
        historyBody.innerHTML = '';
        
        data.orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleString();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td>${order.symbol}</td>
                <td>${order.order_type}</td>
                <td>${order.quantity}</td>
                <td>$${parseFloat(order.executed_price || order.price).toFixed(2)}</td>
                <td>${order.status}</td>
            `;
            historyBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading order history:', error);
    }
}

// Event Listeners
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    await login(email, password);
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const fullName = document.getElementById('register-name').value;
    await register(email, password, fullName);
});

document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
});

document.getElementById('logout-btn').addEventListener('click', logout);

document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const symbol = document.getElementById('order-symbol').value;
    const orderType = document.getElementById('order-type').value;
    const quantity = parseInt(document.getElementById('order-quantity').value);
    const price = parseFloat(document.getElementById('order-price').value);
    
    await placeOrder(symbol, orderType, quantity, price);
});

// Auto-refresh market prices every 30 seconds
setInterval(() => {
    if (dashboardSection.style.display !== 'none') {
        loadMarketPrices();
    }
}, 30000);

// Initialize app
if (authToken) {
    // Try to validate token and load dashboard
    showDashboard();
} else {
    showAuthSection();
}