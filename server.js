const express = require('express');
const path = require('path');
const session = require('express-session');
const sequelize = require('./DB');
const cadastroController = require('./controller/cadastroController');
const authController = require('./controller/authController');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'view')));

app.use(session({
    secret: 'socrates-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
}));

function requerLogin(req, res, next) {
    if (!req.session.usuarioId) {
        return res.redirect('/login');
    }
    next();
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'cadastrousuario.html'));
});

app.get('/home', requerLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'home.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.post('/cadastrar_usuario', cadastroController.processarCadastro);
app.post('/login', authController.processarLogin);

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