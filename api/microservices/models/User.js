const { DataTypes } = require("sequelize");
const crypto = require("crypto");

module.exports = (sequelize) => {
  sequelize.define(
    "user",
    {
      email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          notEmpty: true,
          isEmail: true,
        },
      },
      role: {
        type: DataTypes.ENUM,
        values: ["admin", "client"],
        defaultValue: "client",
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value) {
          const rSalt = this.randomSalt();
          this.setDataValue("salt", rSalt);
          this.setDataValue(
            "password",
            crypto.createHmac("sha1", this.salt).update(value).digest("hex")
          );
        },
      },
      passcode: {
        type: DataTypes.INTEGER,
      },
      salt: {
        type: DataTypes.STRING,
      },
      docType: {
        type: DataTypes.ENUM,
        values: ["dni", "passport"],
      },
      docNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      surname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      birth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      phone: {
        type: DataTypes.INTEGER,
      },
      street: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      street_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      locality: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      paranoid: true,
    }
  );
};