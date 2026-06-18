const express = require('express');
const path = require('path');
const sequelize = require('./DB');
const cadastroController = require('./controller/cadastroController');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'view')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'cadastrousuario.html'));
});

app.post('/cadastrar_usuario', cadastroController.processarCadastro);

sequelize.sync({ alter: true })
    .then(() => {
        console.log('Base de dados conectada e pronta!');
        app.listen(PORT, () => {
            console.log(`Servidor rodando com sucesso!`);
            console.log(`Acesse a: http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Erro ao conectar à base de dados:', err);
    });