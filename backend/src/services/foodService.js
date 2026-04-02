const { User, Store, Food, Category } = require('../models');

// Create category
const createCategory = async (storeId, name, description, imageUrl, displayOrder) => {
  try {
    const category = await Category.create({
      store_id: storeId,
      name,
      description,
      image_url: imageUrl,
      display_order: displayOrder || 0,
    });

    return category;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Create food
const createFood = async (categoryId, storeId, name, description, price, imageUrl, preparationTime) => {
  try {
    const food = await Food.create({
      category_id: categoryId,
      store_id: storeId,
      name,
      description,
      price,
      image_url: imageUrl,
      preparation_time: preparationTime || 15,
      is_available: true,
    });

    return food;
  } catch (error) {
    console.error('Error creating food:', error);
    throw error;
  }
};

// Update food availability
const updateFoodAvailability = async (foodId, isAvailable) => {
  try {
    const food = await Food.findByPk(foodId);
    if (!food) throw new Error('Food not found');

    food.is_available = isAvailable;
    await food.save();
    return food;
  } catch (error) {
    console.error('Error updating food availability:', error);
    throw error;
  }
};

// Update food details
const updateFood = async (foodId, updates) => {
  try {
    const food = await Food.findByPk(foodId);
    if (!food) throw new Error('Food not found');

    await food.update(updates);
    return food;
  } catch (error) {
    console.error('Error updating food:', error);
    throw error;
  }
};

// Delete food
const deleteFood = async (foodId) => {
  try {
    const food = await Food.findByPk(foodId);
    if (!food) throw new Error('Food not found');

    await food.destroy();
    return { message: 'Food deleted successfully' };
  } catch (error) {
    console.error('Error deleting food:', error);
    throw error;
  }
};

module.exports = {
  createCategory,
  createFood,
  updateFoodAvailability,
  updateFood,
  deleteFood,
};
