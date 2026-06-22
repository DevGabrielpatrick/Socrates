const path = require('path');
const fs = require('fs');
const Usuario = require('../model/Usuario');

const MAIN_PATH = path.join(__dirname, '..', 'view', 'main.html');
let mainCache = null;


// Lê o HTML uma vez e mantém em memória (pequena otimização)
function getMainHtml() {
    if (!mainCache) {
        mainCache = fs.readFileSync(MAIN_PATH, 'utf8');
    }
    return mainCache;
}

function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// GET /home — renderiza a main com nome e foto do usuário logado
function mostrarMain(req, res) {
    const usuarioId = req.session.usuarioId;

    Usuario.findByPk(usuarioId)
        .then((usuario) => {
            if (!usuario) return res.redirect('/logout');

            const fotoUsuario = req.session.usuarioFoto || usuario.foto || './imagens/fotoPerfil.jpeg';
            const saudacao = gerarSaudacao();

            let html = getMainHtml()
                .replace(/{{\s*NOME\s*}}/g, esc(usuario.nome))
                .replace(/{{\s*FOTO\s*}}/g, esc(fotoUsuario))
                .replace(/{{\s*SAUDACAO\s*}}/g, esc(saudacao));

            res.send(html);
        })
        .catch((err) => {
            console.error('Erro ao carregar main:', err);
            res.status(500).send('Erro ao carregar a página inicial.');
        });
}

function gerarSaudacao() {
    const hora = new Date().getHours();

    if (hora >= 5 && hora < 12) {
        return 'Bom dia';
    } else if (hora >= 12 && hora < 18) {
        return 'Boa tarde';
    } else {
        return 'Boa noite';
    }
}

module.exports = {
    mostrarMain
};
