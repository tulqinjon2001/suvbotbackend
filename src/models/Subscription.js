import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const Subscription = sequelize.define('Subscription', {
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
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'plans',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'expired'),
      allowNull: false,
      defaultValue: 'active',
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    underscored: true,
  });

  return Subscription;
}
