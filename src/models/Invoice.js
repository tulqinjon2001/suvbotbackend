import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const Invoice = sequelize.define('Invoice', {
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
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
  }, {
    tableName: 'invoices',
    timestamps: true,
    underscored: true,
  });

  return Invoice;
}
