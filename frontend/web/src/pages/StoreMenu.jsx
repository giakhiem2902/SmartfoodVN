import React, { useState, useEffect } from 'react';
import {
  Button, Spin, Empty, Typography, Drawer, InputNumber, Badge, Tooltip, message,
} from 'antd';
import { ShoppingCartOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import './StoreMenu.css';

const { Title, Text } = Typography;

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

const StoreMenu = ({ token }) => {
  const navigate = useNavigate();
  const { storeId } = useParams();

  const [store, setStore] = useState(null);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);

  // Fetch store info và menu
  useEffect(() => {
    const fetchStoreMenu = async () => {
      try {
        setLoading(true);
        // API lấy thông tin store
        const storeRes = await apiClient.getStore(storeId);
        setStore(storeRes);

        // API lấy danh sách danh mục
        const categoriesRes = await apiClient.getStoreCategories(storeId);
        setCategories(Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes.categories || []));

        // API lấy danh sách món ăn của store
        const foodRes = await apiClient.getStoreFoods(storeId);
        setFoods(Array.isArray(foodRes) ? foodRes : (foodRes.foods || []));
        
        // Set category mặc định
        if (Array.isArray(categoriesRes) && categoriesRes.length > 0) {
          setSelectedCategory(null); // All categories
        }
      } catch (err) {
        console.error('Fetch menu error:', err);
        message.error('Không thể tải thực đơn');
      } finally {
        setLoading(false);
      }
    };
    fetchStoreMenu();
  }, [storeId]);

  const openFoodDetail = (food) => {
    setSelectedFood(food);
    setQuantity(1);
    setDrawerOpen(true);
  };

  const addToCart = () => {
    if (!selectedFood) return;
    const newItem = {
      id: selectedFood.id,
      name: selectedFood.name,
      price: selectedFood.price,
      quantity,
      image_url: selectedFood.image_url,
      storeId,
    };
    setCart([...cart, newItem]);
    message.success(`Thêm ${selectedFood.name} x${quantity} vào giỏ hàng`);
    setDrawerOpen(false);
  };

  // Filter foods by selected category
  const filteredFoods = selectedCategory 
    ? foods.filter(f => f.category_id === selectedCategory)
    : foods;

  if (loading) {
    return (
      <div className="store-menu-loading">
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>Đang tải thực đơn...</Text>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="store-menu-empty">
        <Empty description="Không tìm thấy quán ăn" />
        <Button 
          type="primary" 
          onClick={() => navigate('/stores')} 
          style={{ marginTop: 20, background: '#ff6b35' }}
        >
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="store-menu-container">
      {/* HEADER */}
      <div className="store-menu-header">
        <div className="store-menu-header-content">
          <div className="store-menu-header-left">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={() => navigate('/stores')}
              className="store-menu-back-btn"
            />
            <div className="store-menu-info">
              <Title level={2} style={{ margin: 0, color: '#fff' }}>
                {store.name}
              </Title>
              <Text className="store-menu-address">
                <i className="bi bi-geo-alt-fill"></i>
                {store.address}
              </Text>
            </div>
          </div>
          <Tooltip title={`Giỏ hàng (${cart.length} món)`}>
            <Badge count={cart.length} showZero>
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                size="large"
                className="store-menu-cart-btn"
                onClick={() => message.info(`Giỏ hàng: ${cart.length} món`)}
              >
                Giỏ hàng
              </Button>
            </Badge>
          </Tooltip>
        </div>
      </div>

      <div className="store-menu-wrapper">
        {/* STORE INFO CARD */}
        <div className="store-menu-card">
          <div className="store-info-grid">
            {store.image_url && (
              <div className="store-info-image">
                <img
                  src={getImageSrc(store.image_url)}
                  alt={store.name}
                />
              </div>
            )}
            <div className="store-info-details">
              <div className="store-status">
                <span className="badge-open">
                  <i className="bi bi-check-circle-fill"></i>
                  Đang mở cửa
                </span>
                <span className="badge-time">
                  <i className="bi bi-clock"></i>
                  {store.opening_time} - {store.closing_time}
                </span>
              </div>

              {store.description && (
                <div className="store-description">
                  <Text className="label">Giới thiệu:</Text>
                  <p className="description-text">
                    {store.description}
                  </p>
                </div>
              )}

              {categories.length > 0 && (
                <div className="store-categories">
                  <Text className="label">Danh mục:</Text>
                  <div className="category-tags">
                    {categories.slice(0, 3).map(cat => (
                      <span key={cat.id} className="category-tag">
                        <i className="bi bi-bookmark-fill"></i>
                        {cat.name}
                      </span>
                    ))}
                    {categories.length > 3 && (
                      <span className="category-tag more">
                        +{categories.length - 3} khác
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MENU SECTION */}
        <div className="menu-section">
          <div className="menu-header">
            <Title level={3} style={{ margin: 0 }}>
              <i className="bi bi-cup-hot" style={{ marginRight: 8 }}></i>
              Thực đơn ({filteredFoods.length} món)
            </Title>
          </div>

          {/* CATEGORY FILTER */}
          {categories.length > 0 && (
            <div className="category-filter">
              <Button
                className={`filter-btn ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                <i className="bi bi-grid-3x3-gap"></i>
                Tất cả <Badge count={foods.length} style={{ backgroundColor: '#ff6b35' }} />
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <i className="bi bi-tag"></i>
                  {cat.name} <Badge count={foods.filter(f => f.category_id === cat.id).length} style={{ backgroundColor: '#ff6b35' }} />
                </Button>
              ))}
            </div>
          )}

          {/* FOODS GRID */}
          {filteredFoods.length === 0 ? (
            <Empty 
              description={selectedCategory ? "Không có món ăn trong danh mục này" : "Không có món ăn nào"}
              style={{ marginTop: 40 }}
            />
          ) : (
            <div className="foods-grid">
              {filteredFoods.map(food => (
                <div 
                  key={food.id}
                  className="food-card"
                  onClick={() => openFoodDetail(food)}
                >
                  {/* Food Image */}
                  <div className="food-image-container">
                    {food.image_url ? (
                      <img
                        src={getImageSrc(food.image_url)}
                        alt={food.name}
                        className="food-image"
                      />
                    ) : (
                      <div className="food-image-placeholder">
                        <i className="bi bi-cup"></i>
                      </div>
                    )}
                    
                    {/* Hot Badge */}
                    {food.is_hot && (
                      <div className="food-hot-badge">
                        <i className="bi bi-fire"></i>
                      </div>
                    )}

                    {/* Featured Badge */}
                    {food.is_featured && (
                      <div className="food-featured-badge">
                        <i className="bi bi-star-fill"></i>
                      </div>
                    )}
                  </div>

                  {/* Food Details */}
                  <div className="food-details">
                    <h4 className="food-name">{food.name}</h4>
                    {food.description && (
                      <p className="food-description">
                        {food.description}
                      </p>
                    )}
                    
                    <div className="food-footer">
                      <div className="food-price">
                        {food.price?.toLocaleString('vi-VN')}₫
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        icon={<ShoppingCartOutlined />}
                        className="add-to-cart-btn"
                      >
                        Thêm
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOD DETAIL DRAWER */}
      <Drawer
        title={
          <div className="drawer-title">
            <i className="bi bi-cup-hot"></i>
            {selectedFood?.name}
          </div>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={420}
        styles={{ body: { padding: 0 } }}
        footer={
          <div className="drawer-footer">
            <Button onClick={() => setDrawerOpen(false)} block className="btn-close">
              Đóng
            </Button>
            <Button
              type="primary"
              block
              icon={<ShoppingCartOutlined />}
              onClick={addToCart}
              className="btn-add-cart"
            >
              Thêm vào giỏ ({quantity})
            </Button>
          </div>
        }
      >
        {selectedFood && (
          <div className="drawer-content">
            {/* Food Image */}
            {selectedFood.image_url && (
              <img
                src={getImageSrc(selectedFood.image_url)}
                alt={selectedFood.name}
                className="drawer-food-image"
              />
            )}

            {/* Food Info */}
            <div className="drawer-info-section">
              <h2 className="drawer-food-name">{selectedFood.name}</h2>
              <div className="drawer-food-price">
                {selectedFood.price?.toLocaleString('vi-VN')}₫
              </div>
            </div>

            {/* Description */}
            {selectedFood.description && (
              <div className="drawer-section">
                <h4>Mô tả:</h4>
                <p className="drawer-description">{selectedFood.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="drawer-section">
              <h4>Số lượng:</h4>
              <InputNumber
                min={1}
                max={99}
                value={quantity}
                onChange={setQuantity}
                className="quantity-input"
              />
            </div>

            {/* Total */}
            <div className="drawer-total">
              <div className="total-row">
                <span>Giá tiền:</span>
                <span>{(selectedFood.price || 0)?.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="total-row">
                <span>Số lượng:</span>
                <span>{quantity}</span>
              </div>
              <div className="total-row total-final">
                <span>Tổng cộng:</span>
                <span>
                  {((selectedFood.price || 0) * quantity)?.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default StoreMenu;
