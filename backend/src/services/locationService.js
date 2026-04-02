const sequelize = require('../config/database');
const { Store } = require('../models');

// Find nearby stores using MySQL spatial functions
const findNearbyStores = async (userLat, userLng, radiusKm = 20) => {
  try {
    const stores = await sequelize.query(`
      SELECT 
        id,
        owner_id,
        name,
        address,
        lat,
        lng,
        image_url,
        is_active,
        (ST_Distance_Sphere(POINT(lng, lat), POINT(?, ?)) / 1000) AS distance_km
      FROM stores
      WHERE is_active = TRUE
      AND ST_Distance_Sphere(POINT(lng, lat), POINT(?, ?)) / 1000 <= ?
      ORDER BY distance_km ASC
    `, {
      replacements: [userLng, userLat, userLng, userLat, radiusKm],
      type: sequelize.QueryTypes.SELECT,
    });

    return stores;
  } catch (error) {
    console.error('Error finding nearby stores:', error);
    throw error;
  }
};

// Find available drivers near store
const findAvailableDrivers = async (storeLat, storeLng, maxDistanceKm = 10) => {
  try {
    const drivers = await sequelize.query(`
      SELECT 
        u.id,
        u.username,
        u.phone,
        u.lat,
        u.lng,
        (ST_Distance_Sphere(POINT(u.lng, u.lat), POINT(?, ?)) / 1000) AS distance_km
      FROM users u
      WHERE u.role = 'driver'
      AND u.is_online = TRUE
      AND ST_Distance_Sphere(POINT(u.lng, u.lat), POINT(?, ?)) / 1000 <= ?
      ORDER BY distance_km ASC
    `, {
      replacements: [storeLng, storeLat, storeLng, storeLat, maxDistanceKm],
      type: sequelize.QueryTypes.SELECT,
    });

    return drivers;
  } catch (error) {
    console.error('Error finding available drivers:', error);
    throw error;
  }
};

module.exports = {
  findNearbyStores,
  findAvailableDrivers,
};
