import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const UsageTracking = sequelize.define('UsageTracking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    metric_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'e.g., api_calls, orders, users, products',
    },
    metric_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    period_start: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    period_end: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'usage_tracking',
    timestamps: true,
    underscored: true,
  });

  return UsageTracking;
}
