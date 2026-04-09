// Script to create admin user
require('dotenv').config();
const sequelize = require('./src/config/database');
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // Sync database
    await sequelize.sync();

    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await User.findOne({
      where: { email: 'admin@smartfood.vn' }
    });

    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      console.log('Email: admin@smartfood.vn');
      console.log('Password: admin123456');
      process.exit(0);
    }

    // Tạo admin user
    const hashedPassword = await bcrypt.hash('admin123456', 10);
    
    const admin = await User.create({
      username: `Admin_${Date.now()}`,
      email: 'admin@smartfood.vn',
      password: hashedPassword,
      role: 'admin',
      phone: '0987654321',
      is_online: true,
    });

    console.log('✓ Admin user created successfully:');
    console.log('  Email: admin@smartfood.vn');
    console.log('  Password: admin123456');
    console.log('  ID:', admin.id);
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
