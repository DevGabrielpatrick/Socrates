const path = require('path');
const fs = require('fs');
const Usuario = require('../model/Usuario');

const HOME_PATH = path.join(__dirname, '..', 'view', 'home.html');
let homeCache = null;

function getHomeHtml() {
    if (!homeCache) {
        homeCache = fs.readFileSync(HOME_PATH, 'utf8');
    }
    return homeCache;
}

function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function mostrarHome(req, res) {
    const usuarioId = req.session.usuarioId;

    Usuario.findByPk(usuarioId)
        .then((usuario) => {
            if (!usuario) return res.redirect('/logout');

            const fotoUsuario = req.session.usuarioFoto || usuario.foto || 'https://i.pravatar.cc/80';
            const saudacao = gerarSaudacao();

            let html = getHomeHtml()
                .replace(/{{\s*NOME\s*}}/g, esc(usuario.nome))
                .replace(/{{\s*FOTO\s*}}/g, esc(fotoUsuario))
                .replace(/{{\s*SAUDACAO\s*}}/g, esc(saudacao));

            res.send(html);
        })
        .catch((err) => {
            console.error('Erro ao carregar home:', err);
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
    mostrarHome
};
