import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const USER_ROLES = ['admin', 'operator', 'picker', 'courier', 'customer'];

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  telegram_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    unique: true,
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.ENUM(...USER_ROLES),
    allowNull: false,
    defaultValue: 'customer',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

export { USER_ROLES };
export default User;
