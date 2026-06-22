const Sequelize = require('sequelize');
const DB = require('../DB');
const Usuario = require('./Usuario');

const Projeto = DB.define('Projeto', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    titulo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    tipo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    dificuldade: {
        type: Sequelize.STRING,
        allowNull: false
    },
    descricao: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    capaUrl: {
        type: Sequelize.STRING,
        allowNull: true
    },
    materialUrl: {
        type: Sequelize.STRING,
        allowNull: true
    }
}, {
    tableName: "projetos",
    timestamps: true
});

Usuario.hasMany(Projeto, { foreignKey: 'usuarioId' });
Projeto.belongsTo(Usuario, { foreignKey: 'usuarioId' });

module.exports = Projeto;