const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.json({ data: foundDish });
  } else {
    next({ status: 404, message: "Dish not found" });
  }
}

function update(req, res) {
  const dishId = req.params.dishId;
  const { data: { id, name, description, image_url, price } = {} } = req.body;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (!foundDish) {
    return res.status(404).json({ error: "Dish not found." });
  }
  
  if (id && id !== dishId) {
    return res.status(400).json({ error: `Dish id ${id} does not match route id ${dishId}.`})
  }

  if (name) foundDish.name = name;
  if (description) foundDish.description = description;
  if (image_url) foundDish.image_url = image_url;
  if (price) foundDish.price = price;
  
  res.json({ data: foundDish });
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish= dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    return next()
  }
  next ({
    status: 404,
    message: `Dish id not found: ${req.params.dishId}`,
  });
}

function hasData(req, res, next) {
  const { data: { name, description, image_url, price } = {} } = req.body;
  if (name && description && image_url && price) {
    return next();
  }
  next ({status: 400, message: "A 'name, description, image_url, price' property is required." });
}

function validPrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (typeof price === 'number' && price >= 0 ){
    return next();
  }
  next ({status: 400, message: "Invalid 'price' property." });
}

function create(req, res) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  if (!name) {
    res.status(400).json({ error: "name" });
  }
  if (!description) {
    res.status(400).json({ error: "description" });
  }
  if (!price || price < 0) {
    res.status(400).json({ error: "price" });
  }
  if (!image_url) {
    res.status(400).json({ error: "image_url" });
  }
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function destroy(req, res, next) {
  const { id } = req.params;
  const index = dishes.findIndex((dish) => dish.id === Number(id));
  if (index > -1 ) {
    dishes.splice(index, 1);
    res.sendStatus(204);
  } else {
    next ({
      status: 405,
      message: 'delete',
    });
  }
}

module.exports = {
  create,
  list,
  read,
  update:[dishExists, hasData, validPrice, update],
  delete: [destroy],
};