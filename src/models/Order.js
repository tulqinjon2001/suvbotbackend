import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const ORDER_STATUSES = ['new', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  courier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM(...ORDER_STATUSES),
    allowNull: false,
    defaultValue: 'new',
  },
  payment_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  paid_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  location_long: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
});

Order.belongsTo(User, { as: 'customer', foreignKey: 'customer_id' });
Order.belongsTo(User, { as: 'courier', foreignKey: 'courier_id' });
User.hasMany(Order, { foreignKey: 'customer_id' });
User.hasMany(Order, { as: 'courierOrders', foreignKey: 'courier_id' });

export { ORDER_STATUSES };
export default Order;
