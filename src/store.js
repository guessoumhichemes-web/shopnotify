const db = require('./db');

function addOrder(order) {
  db.insertOrder(order);
}

function getOrder(criteria) {
  // Handle both {id: '...'} and {phone: '...'} queries
  if (criteria.id) {
    return db.getOrderById(criteria.id);
  }
  if (criteria.phone) {
    return db.getOrderByPhone(criteria.phone);
  }

  // Fallback: search all orders (inefficient but maintains API compatibility)
  const orders = db.getAllOrders();
  for (const order of orders) {
    const matches = Object.entries(criteria).every(([key, val]) => {
      if (key === 'phone') {
        const a = (order.phone || '').replace(/\D/g, '');
        const b = (val || '').replace(/\D/g, '');
        return a === b || a.endsWith(b) || b.endsWith(a);
      }
      return order[key] === val;
    });
    if (matches) return order;
  }
  return null;
}

function updateOrderStatus(id, status, extra = {}) {
  db.updateOrder(id, { status, ...extra });
}

function getOrders() {
  return db.getAllOrders();
}

function getPendingOrders() {
  return db.getAllOrders().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function getStats() {
  return db.getStats();
}

module.exports = { addOrder, getOrder, updateOrderStatus, getPendingOrders, getStats, getOrders };
