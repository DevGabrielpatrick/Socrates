const Sequelize = require('sequelize');
const DB = require('../DB');
const Usuario = DB.define('Usuario', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    nome : {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    senha: {
        type: Sequelize.STRING,
        allowNull: false
    },
    perfil: {
        type: Sequelize.STRING,
        allowNull: false
    },
    area: {
        type: Sequelize.STRING,
        allowNull: true
    },
    curso: {
        type: Sequelize.STRING,
        allowNull: true
    }
}, {
    tableName: "usuario",
    timestamps: true
});

module.exports = Usuario;