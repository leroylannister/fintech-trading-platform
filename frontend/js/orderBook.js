// frontend/js/orderBook.js
class OrderBookDisplay {
  constructor() {
    this.container = document.getElementById('order-book');
  }

  update(orderBookData) {
    const { bids, asks } = orderBookData;
    
    const html = `
      <div class="order-book">
        <div class="asks">
          <h4>Asks</h4>
          ${asks.map(ask => `
            <div class="order-row sell">
              <span class="price">$${ask.price}</span>
              <span class="quantity">${ask.quantity}</span>
            </div>
          `).join('')}
        </div>
        <div class="spread">
          Spread: $${(asks[0].price - bids[0].price).toFixed(2)}
        </div>
        <div class="bids">
          <h4>Bids</h4>
          ${bids.map(bid => `
            <div class="order-row buy">
              <span class="price">$${bid.price}</span>
              <span class="quantity">${bid.quantity}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
  }
}