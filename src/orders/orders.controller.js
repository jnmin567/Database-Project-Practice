const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  const { id } = req.query;
  res.locals.orderData = { id };
  res.json({
    data: orders.filter(id ? (order) => order.id === id : () => true),
  });
}

function create(req, res) {
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  if (!deliverTo) {
    res.status(400).json({ error: "deliverTo" });
  }
  if (!mobileNumber) {
    res.status(400).json({ error: "mobileNumber" });
  }
  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    res.status(400).json({ error: "dishes" });
  }
  for (const dish of dishes) {
    if (!dish.quantity || typeof dish.quantity !== 'number' || dish.quantity <= 0) {
      return res.status(400).json({ error: " quantity 0 , 1, 2" });
    }
  }

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: 'Pending',
    dishes,
  };
  orders.push(newOrder);
  res.locals.orderData = { id, deliverTo, mobileNumber, status, dishes };
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.orderData = foundOrder;
    res.json({ data: foundOrder });
  } else {
    next({ status: 404, message: "Order not found" });
  }
}

function update(req, res) {
  const orderId = req.params.orderId;
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (!foundOrder) {
    return res.status(404).json({ error: "Order not found." });
  }
  
  if (id && id !== orderId) {
    return res.status(400).json({ error: `Order id ${id} does not match route id ${orderId}.` });
  }

  if (deliverTo) foundOrder.deliverTo = deliverTo;
  if (mobileNumber) foundOrder.mobileNumber = mobileNumber;
  if (status) foundOrder.status = status;
  if (dishes) foundOrder.dishes = dishes;
  
  res.locals.orderData = { id, deliverTo, mobileNumber, status, dishes };
  res.json({ data: foundOrder });
}

function hasData(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const errors = [];

  if (!deliverTo) {
    errors.push("Order must include a deliverTo");
  }
  if (!mobileNumber) {
    errors.push("Order must include a mobileNumber");
  }
  if (!status) {
    errors.push("Order must include a status");
  }
  if (!dishes) {
    errors.push("Order must include dishes");
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    errors.push("Variable 'dishes' must be an array and cannot be empty");
  }

  if (errors.length > 0) {
    return next({ status: 400, message: errors.join(", ") });
  }

  res.locals.orderData = { deliverTo, mobileNumber, status, dishes };
  return next();
}

function validDish(req, res, next) {
  const orderId = req.params.orderId;
  const { data: { dishes } = {} } = req.body;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (!Array.isArray(dishes) || !dishes.every(dish => dish && dish.quantity && Number.isInteger(dish.quantity) && dish.quantity > 0)) {
    return next({ status: 400, message: "Invalid 'dishes' property. Each dish requires a positive integer quantity. 0, 1, 2." });
  }
res.locals.orderData = { dishes };
return next();
}

function validStatus(req, res, next) {
  const orderId = req.params.orderId;
  const { data: { status } = {} } = req.body;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (status === "invalid") {
    return res.status(400).json({ error: "Order status provided is invalid." });
  }
  if (foundOrder && foundOrder.status === 'delivered') {
    return res.status(400).json({ error: "A delivered order cannot be changed." });
  }
  res.locals.orderData = { status };
  return next();
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.orderData = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  });
}

function destroy(req, res, next) {
  const orderId = req.params.orderId;
  const index = orders.findIndex((order) => order.id === orderId);

  if (index === -1) {
    return next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
  }
  const order = orders[index];
  if (order.status !== 'pending') {
    res.locals.orderData = index;
    return res.status(400).json({
      error: "An order cannot be deleted unless it is pending."
    });
  }
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create,
  list,
  read,
  update: [orderExists, hasData, validStatus , validDish ,update],
  delete: [destroy],
};