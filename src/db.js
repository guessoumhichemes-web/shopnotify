// src/db.js
// SQLite persistence for ShopNotify orders using sql.js (pure JavaScript)
// Replaces in-memory Map storage

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'shopnotify.db');
let db = null;
let SQL = null;

async function initDb() {
  SQL = await initSqlJs();

  // Load existing database or create new
  let data;
  try {
    data = fs.readFileSync(dbPath);
  } catch (err) {
    data = null;
  }

  db = new SQL.Database(data);

  // Create orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      shopifyId INTEGER,
      shopifyNumericId INTEGER,
      customerName TEXT,
      email TEXT,
      phone TEXT,
      total TEXT,
      currency TEXT,
      shippingAddress TEXT,
      items TEXT,
      status TEXT,
      lang TEXT,
      raw TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  console.log(`✅ Database initialized at ${dbPath}`);
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function insertOrder(order) {
  db.run(
    `INSERT INTO orders (id, shopifyId, shopifyNumericId, customerName, email, phone, total, currency, shippingAddress, items, status, lang, raw, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.id,
      order.shopifyId,
      order.shopifyNumericId,
      order.customerName,
      order.email,
      order.phone,
      order.total,
      order.currency,
      order.shippingAddress,
      JSON.stringify(order.items || []),
      order.status,
      order.lang,
      JSON.stringify(order.raw || {}),
      order.createdAt,
      order.updatedAt || null
    ]
  );
  saveDb();
}

function getOrderById(id) {
  const stmt = db.prepare('SELECT * FROM orders WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return rowToOrder(row);
  }
  stmt.free();
  return null;
}

function getOrderByPhone(phone) {
  // Replicate flexible phone matching from store.js
  const allOrders = getAllOrders();
  const cleanPhone = (phone || '').replace(/\D/g, '');

  for (const order of allOrders) {
    const orderPhone = (order.phone || '').replace(/\D/g, '');
    if (orderPhone === cleanPhone || orderPhone.endsWith(cleanPhone) || cleanPhone.endsWith(orderPhone)) {
      return order;
    }
  }
  return null;
}

function getAllOrders() {
  const stmt = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC');
  const result = [];
  while (stmt.step()) {
    result.push(rowToOrder(stmt.getAsObject()));
  }
  stmt.free();
  return result;
}

function getOrdersByStatus(statuses) {
  const placeholders = statuses.map(() => '?').join(',');
  const stmt = db.prepare(`SELECT * FROM orders WHERE status IN (${placeholders})`);
  stmt.bind(statuses);
  const result = [];
  while (stmt.step()) {
    result.push(rowToOrder(stmt.getAsObject()));
  }
  stmt.free();
  return result;
}

function updateOrder(id, updates) {
  const order = getOrderById(id);
  if (!order) return false;

  const updatedAt = new Date().toISOString();
  const status = updates.status || order.status;
  const lang = updates.lang || order.lang;

  db.run(
    `UPDATE orders SET status = ?, updatedAt = ?, lang = ? WHERE id = ?`,
    [status, updatedAt, lang, id]
  );

  saveDb();
  return true;
}

function deleteOrder(id) {
  db.run('DELETE FROM orders WHERE id = ?', [id]);
  saveDb();
}

function getStats() {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
      SUM(CASE WHEN status = 'reminded' THEN 1 ELSE 0 END) as reminded_count,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
    FROM orders
  `);

  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();

  const sent = row.sent_count || 0;
  const confirmed = row.confirmed_count || 0;
  const cancelled = row.cancelled_count || 0;

  return {
    totalOrders: row.total || 0,
    pending: (row.pending_count || 0) + (row.sent_count || 0) + (row.reminded_count || 0),
    sent: sent,
    confirmed: confirmed,
    cancelled: cancelled,
    failed: row.failed_count || 0,
    responseRate: sent > 0 ? Math.round(((confirmed + cancelled) / sent) * 100) : 0
  };
}

function rowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    shopifyId: row.shopifyId,
    shopifyNumericId: row.shopifyNumericId,
    customerName: row.customerName,
    email: row.email,
    phone: row.phone,
    total: row.total,
    currency: row.currency,
    shippingAddress: row.shippingAddress,
    items: JSON.parse(row.items || '[]'),
    status: row.status,
    lang: row.lang,
    raw: JSON.parse(row.raw || '{}'),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

module.exports = {
  initDb,
  insertOrder,
  getOrderById,
  getOrderByPhone,
  getAllOrders,
  getOrdersByStatus,
  updateOrder,
  deleteOrder,
  getStats
};
