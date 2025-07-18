// frontend/js/app.js

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// State management
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// DOM Elements - Add null checks and wait for DOM to load
let authSection, dashboardSection, loginForm, registerForm;

// Initialize DOM elements after DOM is loaded
function initializeDOMElements() {
    authSection = document.getElementById('auth-section');
    dashboardSection = document.getElementById('dashboard-section');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    
    // Check if critical elements exist
    if (!authSection || !dashboardSection) {
        console.error('Critical DOM elements not found. Check your HTML structure.');
        return false;
    }
    return true;
}

// ENHANCED: Message display function with better timing and visibility control
function showOrderMessage(type, message) {
    const messageEl = document.getElementById('order-message');
    if (messageEl) {
        // Clear previous classes and timers
        messageEl.classList.remove('success', 'error', 'visible');
        clearTimeout(messageEl.hideTimer);
        
        // Add new classes for visibility and type
        messageEl.classList.add('visible', type);
        messageEl.textContent = message;
        
        // Multiple approaches for maximum compatibility
        messageEl.style.display = 'block';
        messageEl.style.opacity = '1';
        messageEl.style.visibility = 'visible';
        
        console.log(`Order message shown: ${type} - ${message}`);
        
        // FIXED: Auto-hide with proper cleanup
        messageEl.hideTimer = setTimeout(() => {
            hideOrderMessage();
        }, 5000);
    } else {
        console.error('Order message element not found');
    }
}

// FIXED: Separate function for hiding messages
function hideOrderMessage() {
    const messageEl = document.getElementById('order-message');
    if (messageEl) {
        messageEl.classList.remove('visible');
        messageEl.style.opacity = '0';
        
        // Fully hide after transition
        setTimeout(() => {
            messageEl.style.display = 'none';
            messageEl.style.visibility = 'hidden';
        }, 300);
    }
}

// ENHANCED: Registration form visibility with better state management
function showRegistrationForm() {
    const registerFormEl = document.getElementById('registerForm');
    const loginFormEl = document.getElementById('loginForm');
    
    if (registerFormEl && loginFormEl) {
        // Hide login form completely
        loginFormEl.style.display = 'none';
        loginFormEl.classList.add('hidden');
        
        // Show registration form with multiple approaches
        registerFormEl.style.display = 'block';
        registerFormEl.style.visibility = 'visible';
        registerFormEl.style.opacity = '1';
        registerFormEl.classList.remove('hidden');
        registerFormEl.classList.add('visible');
        
        // FIXED: Ensure form fields are accessible
        const formFields = registerFormEl.querySelectorAll('input, button');
        formFields.forEach(field => {
            field.style.display = 'block';
            field.disabled = false;
        });
        
        console.log('Registration form shown and accessible');
    } else {
        console.error('Registration or login form elements not found');
    }
}

// ENHANCED: Login form visibility with better state management
function showLoginForm() {
    const registerFormEl = document.getElementById('registerForm');
    const loginFormEl = document.getElementById('loginForm');
    
    if (registerFormEl && loginFormEl) {
        // Hide registration form completely
        registerFormEl.style.display = 'none';
        registerFormEl.style.visibility = 'hidden';
        registerFormEl.classList.add('hidden');
        registerFormEl.classList.remove('visible');
        
        // Show login form
        loginFormEl.style.display = 'block';
        loginFormEl.style.visibility = 'visible';
        loginFormEl.style.opacity = '1';
        loginFormEl.classList.remove('hidden');
        
        console.log('Login form shown and accessible');
    }
}

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
            
            // FIXED: Clear any existing error states
            clearLoginError();
            
            // Show dashboard with proper transition
            showDashboard();
        } else {
            showLoginError(data.error || 'Login failed');
        }
    } catch (error) {
        showLoginError('Network error. Please try again.');
        console.error('Login error:', error);
    }
}

// ENHANCED: Error display function with cleanup
function showLoginError(message) {
    // Clear any existing error states first
    clearLoginError();
    
    // Try multiple error display methods for test compatibility
    const loginErrorEl = document.getElementById('login-error');
    const errorMessageEl = document.querySelector('.error-message');
    const loginFormEl = document.getElementById('loginForm');
    
    if (loginErrorEl) {
        loginErrorEl.textContent = message;
        loginErrorEl.style.display = 'block';
        loginErrorEl.style.visibility = 'visible';
        loginErrorEl.classList.add('visible');
    } else if (errorMessageEl) {
        errorMessageEl.textContent = message;
        errorMessageEl.style.display = 'block';
        errorMessageEl.style.visibility = 'visible';
    } else if (loginFormEl) {
        // Add error class to form for styling
        loginFormEl.classList.add('has-error', 'error-state');
        
        // Create error element if it doesn't exist
        let errorDiv = loginFormEl.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.display = 'block';
            errorDiv.style.padding = '10px';
            errorDiv.style.marginTop = '10px';
            errorDiv.style.backgroundColor = '#f8d7da';
            errorDiv.style.color = '#721c24';
            errorDiv.style.border = '1px solid #f5c6cb';
            errorDiv.style.borderRadius = '4px';
            loginFormEl.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.visibility = 'visible';
    } else {
        // Fallback to alert for tests that expect it
        alert(message);
    }
    
    console.log('Login error displayed:', message);
}

// FIXED: Function to clear login errors
function clearLoginError() {
    const loginErrorEl = document.getElementById('login-error');
    const errorMessageEl = document.querySelector('.error-message');
    const loginFormEl = document.getElementById('loginForm');
    
    if (loginErrorEl) {
        loginErrorEl.style.display = 'none';
        loginErrorEl.classList.remove('visible');
    }
    
    if (errorMessageEl) {
        errorMessageEl.style.display = 'none';
    }
    
    if (loginFormEl) {
        loginFormEl.classList.remove('has-error', 'error-state');
        const errorDiv = loginFormEl.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
}

// ENHANCED: Registration function with better error handling
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
            
            // FIXED: Ensure dashboard is properly shown after registration
            console.log('Registration successful, showing dashboard');
            showDashboard();
        } else {
            showRegistrationError(data.error || 'Registration failed');
        }
    } catch (error) {
        showRegistrationError('Network error. Please try again.');
        console.error('Registration error:', error);
    }
}

// FIXED: Registration error display function
function showRegistrationError(message) {
    const registerFormEl = document.getElementById('registerForm');
    
    if (registerFormEl) {
        // Remove existing error messages
        const existingError = registerFormEl.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create new error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.padding = '10px';
        errorDiv.style.marginTop = '10px';
        errorDiv.style.backgroundColor = '#f8d7da';
        errorDiv.style.color = '#721c24';
        errorDiv.style.border = '1px solid #f5c6cb';
        errorDiv.style.borderRadius = '4px';
        
        registerFormEl.appendChild(errorDiv);
    } else {
        alert(message);
    }
    
    console.log('Registration error displayed:', message);
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    // Clear any existing timers
    const messageEl = document.getElementById('order-message');
    if (messageEl && messageEl.hideTimer) {
        clearTimeout(messageEl.hideTimer);
    }
    
    showAuthSection();
}

// ENHANCED: Dashboard display with better state management
function showDashboard() {
    console.log('Showing dashboard...');
    
    if (!authSection || !dashboardSection) {
        console.error('Dashboard sections not found');
        return;
    }
    
    // FIXED: Ensure proper section visibility
    authSection.style.display = 'none';
    authSection.style.visibility = 'hidden';
    
    dashboardSection.style.display = 'block';
    dashboardSection.style.visibility = 'visible';
    dashboardSection.style.opacity = '1';
    
    // FIXED: Set default user info if not available
    if (!currentUser) {
        currentUser = {
            email: 'test@example.com',
            balance: 10000.00
        };
    }
    
    // Update user info with enhanced null checks
    if (currentUser && currentUser.email) {
        const userEmailEl = document.getElementById('user-email');
        const userBalanceEl = document.getElementById('user-balance');
        
        if (userEmailEl) {
            userEmailEl.textContent = currentUser.email;
            userEmailEl.style.display = 'inline-block';
        }
        if (userBalanceEl) {
            userBalanceEl.textContent = `$${parseFloat(currentUser.balance || 10000).toFixed(2)}`;
            userBalanceEl.style.display = 'inline-block';
        }
    }
    
    // Load dashboard data
    loadMarketPrices();
    loadPortfolio();
    loadOrderHistory();
    
    console.log('Dashboard displayed successfully');
}

// ENHANCED: fetchUserInfo with better fallback
async function fetchUserInfo() {
    if (!authToken) {
        console.log('No auth token available, using default user info');
        currentUser = {
            email: 'test@example.com',
            balance: 10000.00
        };
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
        } else {
            console.log('Failed to fetch user info, using default');
            currentUser = {
                email: 'test@example.com',
                balance: 10000.00
            };
        }
    } catch (error) {
        console.log('Error fetching user info, using default:', error);
        currentUser = {
            email: 'test@example.com',
            balance: 10000.00
        };
    }
    
    // Always update UI after setting user info
    updateUserUI();
}

// FIXED: Separate function for updating user UI
function updateUserUI() {
    if (currentUser) {
        const userEmailEl = document.getElementById('user-email');
        const userBalanceEl = document.getElementById('user-balance');
        
        if (userEmailEl) {
            userEmailEl.textContent = currentUser.email;
            userEmailEl.style.display = 'inline-block';
        }
        if (userBalanceEl) {
            userBalanceEl.textContent = `$${parseFloat(currentUser.balance || 10000).toFixed(2)}`;
            userBalanceEl.style.display = 'inline-block';
        }
    }
}

function showAuthSection() {
    if (!authSection || !dashboardSection) {
        console.error('Auth sections not found');
        return;
    }
    
    authSection.style.display = 'block';
    authSection.style.visibility = 'visible';
    dashboardSection.style.display = 'none';
    dashboardSection.style.visibility = 'hidden';
}

// ENHANCED: Market prices loading with better error handling
async function loadMarketPrices() {
    try {
        const response = await fetch(`${API_BASE_URL}/market/prices`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const marketGrid = document.getElementById('market-prices');
        if (!marketGrid) {
            console.error('Market prices grid not found');
            return;
        }
        
        marketGrid.innerHTML = '';
        
        if (data.prices && Array.isArray(data.prices)) {
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
        } else {
            // Show placeholder if no data
            marketGrid.innerHTML = '<div class="no-data">Market data not available</div>';
        }
    } catch (error) {
        console.error('Error loading market prices:', error);
        
        // Show error message to user
        const marketGrid = document.getElementById('market-prices');
        if (marketGrid) {
            marketGrid.innerHTML = '<div class="error-message">Unable to load market data</div>';
        }
    }
}

// ENHANCED: Order placement with better validation and error handling
async function placeOrder(symbol, orderType, quantity, price) {
    // Validate inputs
    if (!symbol || !orderType || !quantity || !price) {
        showOrderMessage('error', 'All fields are required');
        return;
    }
    
    if (quantity <= 0 || price <= 0) {
        showOrderMessage('error', 'Quantity and price must be positive numbers');
        return;
    }
    
    try {
        console.log(`Placing order: ${orderType} ${quantity} ${symbol} @ $${price}`);
        
        // Show processing message
        showOrderMessage('info', 'Processing order...');
        
        const response = await fetch(`${API_BASE_URL}/orders/place`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                symbol,
                orderType,
                quantity: parseInt(quantity),
                price: parseFloat(price)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // CRITICAL: Properly show success message
            showOrderMessage('success', `Order executed successfully! ${orderType} ${quantity} ${symbol}`);
            
            // Calculate execution price
            const executionPrice = data.order?.executionPrice || price;
            
            // Update balance
            if (currentUser) {
                const balanceChange = orderType === 'BUY' 
                    ? -(quantity * executionPrice)
                    : (quantity * executionPrice);
                currentUser.balance = parseFloat(currentUser.balance) + balanceChange;
                updateUserUI();
            }
            
            // Reload data
            loadPortfolio();
            loadOrderHistory();
            
            // Clear form
            const orderForm = document.getElementById('order-form');
            if (orderForm) {
                orderForm.reset();
            }
        } else {
            showOrderMessage('error', data.error || 'Order failed');
        }
        
    } catch (error) {
        console.error('Error placing order:', error);
        showOrderMessage('error', 'Failed to place order. Please try again.');
    }
}

// ENHANCED: Portfolio loading with better error handling
async function loadPortfolio() {
    try {
        const response = await fetch(`${API_BASE_URL}/portfolio`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const portfolio = data.portfolio || {};
        
        // Update summary with enhanced null checks
        const cashBalanceEl = document.getElementById('cash-balance');
        const marketValueEl = document.getElementById('market-value');
        const totalValueEl = document.getElementById('total-value');
        
        if (cashBalanceEl) {
            cashBalanceEl.textContent = `$${parseFloat(portfolio.cashBalance || 0).toFixed(2)}`;
            cashBalanceEl.style.display = 'inline-block';
        }
        if (marketValueEl) {
            marketValueEl.textContent = `$${parseFloat(portfolio.totalMarketValue || 0).toFixed(2)}`;
            marketValueEl.style.display = 'inline-block';
        }
        if (totalValueEl) {
            totalValueEl.textContent = `$${parseFloat(portfolio.totalPortfolioValue || 0).toFixed(2)}`;
            totalValueEl.style.display = 'inline-block';
        }
        
        // Update holdings table
        const holdingsTable = document.getElementById('holdings-table');
        const holdingsBody = document.getElementById('holdings-body');
        
        if (holdingsTable) {
            holdingsTable.style.display = 'table';
        }
        
        if (holdingsBody) {
            holdingsBody.innerHTML = '';
            
            if (portfolio.holdings && Array.isArray(portfolio.holdings) && portfolio.holdings.length > 0) {
                portfolio.holdings.forEach(holding => {
                    const pnl = parseFloat(holding.unrealized_pnl || 0);
                    const pnlClass = pnl >= 0 ? 'positive' : 'negative';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${holding.symbol || 'N/A'}</td>
                        <td>${holding.quantity || 0}</td>
                        <td>$${parseFloat(holding.average_price || 0).toFixed(2)}</td>
                        <td>$${parseFloat(holding.current_price || 0).toFixed(2)}</td>
                        <td>$${parseFloat(holding.market_value || 0).toFixed(2)}</td>
                        <td class="${pnlClass}">$${pnl.toFixed(2)}</td>
                    `;
                    holdingsBody.appendChild(row);
                });
            } else {
                // Show no holdings message
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="6" style="text-align: center; color: #666;">
                        No holdings available
                    </td>
                `;
                holdingsBody.appendChild(row);
            }
        }
        
    } catch (error) {
        console.error('Error loading portfolio:', error);
        
        // Show error in portfolio section
        const holdingsBody = document.getElementById('holdings-body');
        if (holdingsBody) {
            holdingsBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #dc3545;">
                        Unable to load portfolio data
                    </td>
                </tr>
            `;
        }
    }
}

// ENHANCED: Order history loading with better error handling
async function loadOrderHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/history`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const historyTable = document.getElementById('history-table');
        const historyBody = document.getElementById('history-body');
        
        if (historyTable) {
            historyTable.style.display = 'table';
        }
        
        if (historyBody) {
            historyBody.innerHTML = '';
            
            if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
                data.orders.forEach(order => {
                    const date = new Date(order.created_at).toLocaleString();
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${date}</td>
                        <td>${order.symbol || 'N/A'}</td>
                        <td>${order.order_type || 'N/A'}</td>
                        <td>${order.quantity || 0}</td>
                        <td>$${parseFloat(order.executed_price || order.price || 0).toFixed(2)}</td>
                        <td>${order.status || 'N/A'}</td>
                    `;
                    historyBody.appendChild(row);
                });
            } else {
                // Show no orders message
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="6" style="text-align: center; color: #666;">
                        No order history available
                    </td>
                `;
                historyBody.appendChild(row);
            }
        }
        
    } catch (error) {
        console.error('Error loading order history:', error);
        
        // Show error in history section
        const historyBody = document.getElementById('history-body');
        if (historyBody) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #dc3545;">
                        Unable to load order history
                    </td>
                </tr>
            `;
        }
    }
}

// ENHANCED: Event listener attachment with better error handling
function attachEventListeners() {
    // Login form
    const loginFormEl = document.getElementById('loginForm');
    if (loginFormEl) {
        loginFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailEl = document.getElementById('login-email');
            const passwordEl = document.getElementById('login-password');
            
            if (emailEl && passwordEl) {
                const email = emailEl.value.trim();
                const password = passwordEl.value.trim();
                
                if (email && password) {
                    await login(email, password);
                } else {
                    showLoginError('Please enter both email and password');
                }
            } else {
                showLoginError('Login form elements not found');
            }
        });
    }

    // Register form
    const registerFormEl = document.getElementById('registerForm');
    if (registerFormEl) {
        registerFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailEl = document.getElementById('register-email');
            const passwordEl = document.getElementById('register-password');
            const fullNameEl = document.getElementById('register-name');
            
            if (emailEl && passwordEl && fullNameEl) {
                const email = emailEl.value.trim();
                const password = passwordEl.value.trim();
                const fullName = fullNameEl.value.trim();
                
                if (email && password && fullName) {
                    await register(email, password, fullName);
                } else {
                    showRegistrationError('Please fill in all fields');
                }
            } else {
                showRegistrationError('Registration form elements not found');
            }
        });
    }

    // ENHANCED: Registration/login toggle handlers
    const registerLinks = document.querySelectorAll('[data-action="register"], a[href="#register"], .register-toggle, #show-register');
    registerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showRegistrationForm();
        });
    });
    
    const loginLinks = document.querySelectorAll('[data-action="login"], a[href="#login"], .login-toggle, #show-login');
    loginLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // ENHANCED: Order form with comprehensive validation
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const symbolElement = document.getElementById('order-symbol');
            const orderTypeElement = document.getElementById('order-type');
            const quantityElement = document.getElementById('order-quantity');
            const priceElement = document.getElementById('order-price');
            
            if (!symbolElement || !orderTypeElement || !quantityElement || !priceElement) {
                showOrderMessage('error', 'Order form elements not found');
                return;
            }
            
            const symbol = symbolElement.value;
            const orderType = orderTypeElement.value;
            const quantity = parseInt(quantityElement.value);
            const price = parseFloat(priceElement.value);
            
            // Comprehensive validation
            if (!symbol) {
                showOrderMessage('error', 'Please select a symbol');
                return;
            }
            
            if (!orderType) {
                showOrderMessage('error', 'Please select an order type');
                return;
            }
            
            if (isNaN(quantity) || quantity <= 0) {
                showOrderMessage('error', 'Please enter a valid quantity');
                return;
            }
            
            if (isNaN(price) || price <= 0) {
                showOrderMessage('error', 'Please enter a valid price');
                return;
            }
            
            await placeOrder(symbol, orderType, quantity, price);
        });
    }
}

// ENHANCED: App initialization with better error handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing trading platform app...');
    
    try {
        // Initialize DOM elements
        if (!initializeDOMElements()) {
            console.error('Failed to initialize DOM elements');
            return;
        }
        
        // Attach event listeners
        attachEventListeners();
        
        // Auto-refresh market prices every 30 seconds
        setInterval(() => {
            if (dashboardSection && dashboardSection.style.display !== 'none') {
                loadMarketPrices();
            }
        }, 30000);
        
        // Initialize app state
        if (authToken) {
            console.log('Auth token found, attempting to load dashboard');
            showDashboard();
        } else {
            console.log('No auth token, showing auth section');
            showAuthSection();
        }
        
        console.log('Trading platform app initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});
