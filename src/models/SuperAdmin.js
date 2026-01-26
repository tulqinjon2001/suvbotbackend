import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const SuperAdmin = sequelize.define('SuperAdmin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'super_admins',
    timestamps: true,
    underscored: true,
  });

  return SuperAdmin;
}
