const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const sequelize = require('./DB');
const cadastroController = require('./controller/cadastroController');
const authController = require('./controller/authController');
const perfilController = require('./controller/perfilController');
const mainController = require('./controller/mainController');
const projetoController = require('./controller/projetoController');
const Projeto = require('./model/Projeto'); // Necessário para o Sequelize criar a tabela
const Usuario = require('./model/Usuario'); // Adicione esta linha no topo

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.use(express.static(path.join(__dirname, 'view')));

app.use(session({
    secret: 'socrates-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
}));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'view', 'uploads');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

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

app.get('/carregando', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'telaCarregamento.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'cadastrousuario.html'));
});

app.get('/esqueci_senha', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'esqueciSenha.html'));
});

app.get('/trocar_senha_obrigatoria', requerLogin, authController.mostrarTrocaSenhaObrigatoria);

app.get('/alterar_perfil', requerLogin, perfilController.mostrarPerfil)

app.get('/home', requerLogin, mainController.mostrarMain);

app.get('/materiais', requerLogin, (req, res) => {
    Usuario.findByPk(req.session.usuarioId).then(usuario => {
        let html = fs.readFileSync(path.join(__dirname, 'view', 'materiais.html'), 'utf8');
        
        // A MÁGICA AQUI: O código tenta todas as variações possíveis de nome que o seu banco possa ter!
        let foto = usuario ? (usuario.fotoPerfil || usuario.fotoperfil || usuario.foto_perfil || usuario.foto || './imagens/imagem8.jpg') : './imagens/imagem8.jpg';
        let nome = usuario ? (usuario.Nome || usuario.nome || 'Usuário') : 'Usuário';

        html = html.replace(/{{FOTO}}/g, foto).replace(/{{NOME}}/g, nome).replace(/{{SAUDACAO}}/g, 'Meus Materiais');
        
        res.send(html);
    }).catch(err => {
        console.error(err);
        res.sendFile(path.join(__dirname, 'view', 'materiais.html'));
    });
});

app.get('/upload', requerLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'upload.html'));
});

app.get('/pesquisa', requerLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'pesquisa.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/carregando?to=/login&msg=Até%20logo!');
    });
});
app.get('/api/meus_projetos', requerLogin, projetoController.listarMeusProjetos);
app.get('/api/todos_projetos', requerLogin, projetoController.listarTodosProjetos);
app.post('/cadastrar_usuario', cadastroController.processarCadastro);
app.post('/login', authController.processarLogin);
app.post('/esqueci_senha', authController.processarEsqueciSenha);
app.post('/trocar_senha_obrigatoria', requerLogin, authController.processarTrocaObrigatoria);
app.post('/atualizar_perfil', (req, res, next) => {
    console.log('[POST /atualizar_perfil] body:', req.body, 'file:', req.file);
    next();
}, requerLogin, perfilController.atualizarPerfil);
app.post('/enviar_projeto', requerLogin, (req, res, next) => {
    upload.fields([{ name: 'capa', maxCount: 1 }, { name: 'material', maxCount: 1 }])(req, res, function (err) {
        if (err) {
            console.error('[upload] erro do multer:', err.message);
            if (err.code === 'LIMIT_FILE_SIZE') return res.redirect('/upload?erro=upload_falhou');
            if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.redirect('/upload?erro=campo_nao_suportado');
            return res.redirect('/upload?erro=upload_falhou');
        }
        next();
    });
}, projetoController.enviarProjeto);
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