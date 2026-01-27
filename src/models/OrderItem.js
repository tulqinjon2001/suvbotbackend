import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Order from './Order.js';
import Product from './Product.js';

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id',
    },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  price_at_purchase: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  tableName: 'order_items',
  timestamps: true,
  underscored: true,
});

OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'Order' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'OrderItems' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'Product' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'ProductOrderItems' });

export default OrderItem;
