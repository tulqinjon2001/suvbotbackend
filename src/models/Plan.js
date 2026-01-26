import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    duration_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    max_users: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '-1 means unlimited',
    },
    max_products: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '-1 means unlimited',
    },
    features: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'plans',
    timestamps: true,
    underscored: true,
  });

  return Plan;
}
