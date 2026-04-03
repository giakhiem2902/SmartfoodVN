import React from 'react';

/**
 * Bootstrap Icon component wrapper
 * Usage: <BootstrapIcon icon="shop" size={24} color="#ff6b35" />
 */
const BootstrapIcon = ({ icon, size = 16, color = 'currentColor', style = {} }) => {
  return (
    <i
      className={`bi bi-${icon}`}
      style={{
        fontSize: typeof size === 'number' ? `${size}px` : size,
        color,
        display: 'inline-block',
        ...style,
      }}
    />
  );
};

export default BootstrapIcon;
