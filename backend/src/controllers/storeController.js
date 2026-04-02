const { Store, Category, Food } = require('../models');
const { createStore, updateStore, getStoreDetails } = require('../services/authService');
const { createCategory, createFood, updateFood, updateFoodAvailability, deleteFood } = require('../services/foodService');
const { findNearbyStores } = require('../services/locationService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Get nearby stores
const getNearbyStores = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    if (lat === undefined || lng === undefined) {
      return sendError(res, 'Latitude and longitude are required', 400);
    }

    const radiusKm = radius || 20;
    const stores = await findNearbyStores(lat, lng, radiusKm);

    sendSuccess(res, stores, 'Nearby stores found');
  } catch (error) {
    next(error);
  }
};

// Create store
const create = async (req, res, next) => {
  try {
    const { name, address, phone, lat, lng, description } = req.body;
    const imageUrl = req.file ? `/uploads/stores/${req.file.filename}` : null;

    if (!name || lat === undefined || lng === undefined) {
      return sendError(res, 'Name, latitude, and longitude are required', 400);
    }

    const store = await createStore(
      req.user.id,
      name,
      address,
      phone,
      lat,
      lng,
      description,
      imageUrl
    );

    sendSuccess(res, store, 'Store created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get store details
const getDetails = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    const store = await getStoreDetails(storeId);
    if (!store) {
      return sendError(res, 'Store not found', 404);
    }

    sendSuccess(res, store);
  } catch (error) {
    next(error);
  }
};

// Update store
const update = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const updates = req.body;

    const store = await Store.findByPk(storeId);
    if (!store) {
      return sendError(res, 'Store not found', 404);
    }

    if (store.owner_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Unauthorized to update this store', 403);
    }

    if (req.file) {
      updates.image_url = `/uploads/stores/${req.file.filename}`;
    }

    const updatedStore = await updateStore(storeId, updates);
    sendSuccess(res, updatedStore, 'Store updated');
  } catch (error) {
    next(error);
  }
};

// Add category
const addCategory = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { name, description } = req.body;
    const imageUrl = req.file ? `/uploads/categories/${req.file.filename}` : null;

    if (!name) {
      return sendError(res, 'Category name is required', 400);
    }

    const store = await Store.findByPk(storeId);
    if (!store) {
      return sendError(res, 'Store not found', 404);
    }

    const category = await createCategory(storeId, name, description, imageUrl);
    sendSuccess(res, category, 'Category created', 201);
  } catch (error) {
    next(error);
  }
};

// Add food
const addFood = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { categoryId, name, description, price, preparationTime } = req.body;
    const imageUrl = req.file ? `/uploads/foods/${req.file.filename}` : null;

    if (!categoryId || !name || !price) {
      return sendError(res, 'Category ID, name, and price are required', 400);
    }

    const food = await createFood(
      categoryId,
      storeId,
      name,
      description,
      price,
      imageUrl,
      preparationTime
    );

    sendSuccess(res, food, 'Food created', 201);
  } catch (error) {
    next(error);
  }
};

// Update food
const updateFoodItem = async (req, res, next) => {
  try {
    const { foodId } = req.params;
    const updates = req.body;

    if (req.file) {
      updates.image_url = `/uploads/foods/${req.file.filename}`;
    }

    const food = await updateFood(foodId, updates);
    sendSuccess(res, food, 'Food updated');
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

// Toggle food availability
const toggleFoodAvailability = async (req, res, next) => {
  try {
    const { foodId } = req.params;
    const { is_available } = req.body;

    const food = await updateFoodAvailability(foodId, is_available);
    sendSuccess(res, food, 'Food availability updated');
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

// Delete food
const deleteItem = async (req, res, next) => {
  try {
    const { foodId } = req.params;

    const result = await deleteFood(foodId);
    sendSuccess(res, result, 'Food deleted');
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

module.exports = {
  getNearbyStores,
  create,
  getDetails,
  update,
  addCategory,
  addFood,
  updateFoodItem,
  toggleFoodAvailability,
  deleteItem,
};
