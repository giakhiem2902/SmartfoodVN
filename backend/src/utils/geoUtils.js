const { getDistance } = require('geolib');

// Calculate distance in kilometers using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const distance = getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 }
  );
  return distance / 1000; // Convert meters to kilometers
};

// Calculate shipping fee based on distance
const calculateShippingFee = (distanceKm) => {
  const feePerKm = parseInt(process.env.SHIPPING_FEE_PER_KM) || 15000;
  return Math.round(distanceKm) * feePerKm;
};

module.exports = {
  calculateDistance,
  calculateShippingFee,
};
