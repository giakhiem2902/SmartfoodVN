const { Store, Category, Food, StoreRegistration, User } = require('../models');
const { createStore, updateStore, getStoreDetails } = require('../services/authService');
const { createCategory, createFood, updateFood, updateFoodAvailability, deleteFood } = require('../services/foodService');
const { findNearbyStores } = require('../services/locationService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const canManageStore = async (storeId, user) => {
  const store = await Store.findByPk(storeId);
  if (!store) return null;
  if (user.role === 'admin' || Number(store.owner_id) === Number(user.id)) {
    return store;
  }
  return false;
};

const canManageFood = async (foodId, user) => {
  const food = await Food.findByPk(foodId);
  if (!food) return null;

  const store = await Store.findByPk(food.store_id);
  if (!store) return null;

  if (user.role === 'admin' || Number(store.owner_id) === Number(user.id)) {
    return { food, store };
  }

  return false;
};

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

// Submit store registration for admin approval
const submitRegistration = async (req, res, next) => {
  try {
    if (req.user.role === 'store') {
      return sendError(res, 'You are already a store owner', 400);
    }

    const { storeName, businessType, address, phone, lat, lng } = req.body;
    if (!storeName || !businessType || !address) {
      return sendError(res, 'Store name, business type, and address are required', 400);
    }

    const finalLat = Number(lat ?? req.user.lat ?? 10.8506);
    const finalLng = Number(lng ?? req.user.lng ?? 106.7742);
    const imageUrl = req.file ? `/uploads/stores/${req.file.filename}` : null;

    let registration = await StoreRegistration.findOne({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    const payload = {
      user_id: req.user.id,
      store_name: storeName,
      store_address: address,
      store_phone: phone || req.user.phone || null,
      lat: Number.isFinite(finalLat) ? finalLat : 10.8506,
      lng: Number.isFinite(finalLng) ? finalLng : 106.7742,
      business_type: businessType,
      store_image_url: imageUrl || registration?.store_image_url || null,
      status: 'PENDING',
      rejection_reason: null,
    };

    if (registration) {
      await registration.update(payload);
    } else {
      registration = await StoreRegistration.create(payload);
    }

    sendSuccess(res, registration, 'Store registration submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get current user's latest registration
const getMyRegistration = async (req, res, next) => {
  try {
    const registration = await StoreRegistration.findOne({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    sendSuccess(res, registration);
  } catch (error) {
    next(error);
  }
};

// Admin: list store registrations
const listRegistrations = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const registrations = await StoreRegistration.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'phone', 'role'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    sendSuccess(res, registrations);
  } catch (error) {
    next(error);
  }
};

// Admin: approve/reject a store registration
const reviewRegistration = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return sendError(res, 'Status must be APPROVED or REJECTED', 400);
    }

    const registration = await StoreRegistration.findByPk(registrationId);
    if (!registration) {
      return sendError(res, 'Registration not found', 404);
    }

    const user = await User.findByPk(registration.user_id);
    if (!user) {
      return sendError(res, 'Applicant user not found', 404);
    }

    let store = null;

    if (status === 'APPROVED') {
      store = await Store.findOne({ where: { owner_id: user.id } });
      const storePayload = {
        owner_id: user.id,
        name: registration.store_name,
        address: registration.store_address,
        phone: registration.store_phone || user.phone,
        lat: registration.lat,
        lng: registration.lng,
        description: registration.business_type,
        image_url: registration.store_image_url,
        is_active: true,
      };

      if (store) {
        await store.update(storePayload);
      } else {
        store = await Store.create(storePayload);
      }

      if (user.role !== 'store') {
        user.role = 'store';
        await user.save();
      }
    }

    await registration.update({
      status,
      rejection_reason: status === 'REJECTED' ? (rejectionReason || 'Yêu cầu cần bổ sung thêm thông tin') : null,
    });

    sendSuccess(res, { registration, store }, `Registration ${status.toLowerCase()} successfully`);
  } catch (error) {
    next(error);
  }
};

// Get current store owned by logged-in store user
const getMyStore = async (req, res, next) => {
  try {
    const store = await Store.findOne({
      where: { owner_id: req.user.id },
      include: [
        {
          model: Category,
          as: 'categories',
          include: [{ model: Food, as: 'foods' }],
        },
      ],
      order: [[{ model: Category, as: 'categories' }, 'display_order', 'ASC']],
    });

    if (!store) {
      return sendError(res, 'Store not found for this account', 404);
    }

    sendSuccess(res, store);
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

// Get foods by store
const getFoodsByStore = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { all } = req.query; // Query param để lấy tất cả foods hoặc chỉ foods sẵn bán

    const store = await Store.findByPk(storeId);
    if (!store) {
      return sendError(res, 'Store not found', 404);
    }

    const where = { store_id: storeId };
    
    // Nếu all=true, lấy tất cả foods (cho store owner quản lý)
    // Nếu all=false hoặc không có, chỉ lấy foods sẵn bán (cho user xem menu)
    if (all !== 'true') {
      where.is_available = true;
    }

    const foods = await Food.findAll({
      where,
      include: ['category'],
      order: [['created_at', 'DESC']],
    });

    sendSuccess(res, foods, 'Foods retrieved');
  } catch (error) {
    next(error);
  }
};

// Get categories by store
const getCategoriesByStore = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findByPk(storeId);
    if (!store) {
      return sendError(res, 'Store not found', 404);
    }

    const categories = await Category.findAll({
      where: { store_id: storeId },
      order: [['created_at', 'ASC']],
    });

    sendSuccess(res, categories, 'Categories retrieved');
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

    const store = await canManageStore(storeId, req.user);
    if (store === null) {
      return sendError(res, 'Store not found', 404);
    }
    if (store === false) {
      return sendError(res, 'Unauthorized to manage this store', 403);
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

    const store = await canManageStore(storeId, req.user);
    if (store === null) {
      return sendError(res, 'Store not found', 404);
    }
    if (store === false) {
      return sendError(res, 'Unauthorized to manage this store', 403);
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

    const canManage = await canManageFood(foodId, req.user);
    if (canManage === null) {
      return sendError(res, 'Food not found', 404);
    }
    if (canManage === false) {
      return sendError(res, 'Unauthorized to manage this food', 403);
    }

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

    const canManage = await canManageFood(foodId, req.user);
    if (canManage === null) {
      return sendError(res, 'Food not found', 404);
    }
    if (canManage === false) {
      return sendError(res, 'Unauthorized to manage this food', 403);
    }

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

    const canManage = await canManageFood(foodId, req.user);
    if (canManage === null) {
      return sendError(res, 'Food not found', 404);
    }
    if (canManage === false) {
      return sendError(res, 'Unauthorized to manage this food', 403);
    }

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
  submitRegistration,
  getMyRegistration,
  listRegistrations,
  reviewRegistration,
  getMyStore,
  create,
  getDetails,
  getFoodsByStore,
  getCategoriesByStore,
  update,
  addCategory,
  addFood,
  updateFoodItem,
  toggleFoodAvailability,
  deleteItem,
};
