const Usuario = require('../model/Usuario');
const bcrypt = require('bcrypt');

function processarCadastro(req, res) {

    let dados_usuario = {
        nome: req.body.nome,
        email: req.body.email,
        senha: req.body.senha,
        perfil: req.body.perfil,
        area: req.body.area,
        curso: req.body.curso
    };

    if (!dados_usuario.nome || !dados_usuario.email || !dados_usuario.senha || !dados_usuario.perfil) {
        return res.redirect('/cadastro?erro=campos_obrigatorios');
    }

    if (req.body.senha !== req.body.confirmarSenha) {
        return res.redirect('/cadastro?erro=senhas_diferentes');
    }

    bcrypt.hash(dados_usuario.senha, 10)
        .then((senhaHash) => {
            dados_usuario.senha = senhaHash;

            return Usuario.findOne({ where: { email: dados_usuario.email } });
        })
        .then((usuarioExistente) => {
            if (usuarioExistente) {
                return res.redirect('/cadastro?erro=email_duplicado');
            }

            return Usuario.create(dados_usuario)
                .then(() => {
                    res.redirect('/carregando?to=/login&msg=Cadastro%20realizado!');
                });
        })
        .catch((err) => {
            console.error('Erro nas operações do banco de dados:', err);
            res.redirect('/cadastro?erro=1');
        });
}

module.exports = {
    processarCadastro
};