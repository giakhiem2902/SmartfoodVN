const { User, Store, Food, Category } = require('../models');
const { generateToken } = require('../config/jwt');

// User authentication
const registerUser = async (username, email, password, role, phone) => {
  try {
    const user = await User.create({
      username,
      email,
      password,
      role,
      phone,
    });

    const token = generateToken(user.id, user.role);
    return { user: user.toJSON(), token };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

const loginUser = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('User not found');

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) throw new Error('Invalid password');

    const token = generateToken(user.id, user.role);
    return { user: user.toJSON(), token };
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

// Store management
const createStore = async (ownerId, name, address, phone, lat, lng, description, imageUrl) => {
  try {
    const store = await Store.create({
      owner_id: ownerId,
      name,
      address,
      phone,
      lat,
      lng,
      description,
      image_url: imageUrl,
      is_active: true,
    });

    return store;
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
};

const updateStore = async (storeId, updates) => {
  try {
    const store = await Store.findByPk(storeId);
    if (!store) throw new Error('Store not found');

    await store.update(updates);
    return store;
  } catch (error) {
    console.error('Error updating store:', error);
    throw error;
  }
};

const getStoreDetails = async (storeId) => {
  try {
    const store = await Store.findByPk(storeId, {
      include: [
        {
          model: Category,
          as: 'categories',
          include: [
            {
              model: Food,
              as: 'foods',
              where: { is_available: true }, // Chỉ lấy food sẵn bán
              required: false, // Vẫn lấy category ngay cả khi không có food sẵn bán
            },
          ],
        },
      ],
    });

    return store;
  } catch (error) {
    console.error('Error getting store details:', error);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  createStore,
  updateStore,
  getStoreDetails,
};
