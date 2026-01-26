import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const Account = sequelize.define('Account', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    business_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'admins',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('trial', 'active', 'suspended', 'cancelled'),
      allowNull: false,
      defaultValue: 'trial',
    },
    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'accounts',
    timestamps: true,
    underscored: true,
  });

  return Account;
}
