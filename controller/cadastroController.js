const Usuario = require('../model/Usuario');

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
        return res.redirect('/cadastrar_usuario?erro=campos_obrigatorios');
    }

    if (req.body.senha !== req.body.confirmarSenha) {
        return res.redirect('/cadastrar_usuario?erro=senhas_diferentes');
    }

    Usuario.findOne({ where: { email: dados_usuario.email } })
        .then((usuarioExistente) => {
            if (usuarioExistente) {
                return res.redirect('/cadastrar_usuario?erro=email_duplicado');
            }

            return Usuario.create(dados_usuario)
                .then(() => {
                    res.redirect('/login');
                });
        })
        .catch((err) => {
            console.error('Erro nas operações do banco de dados:', err);
            res.redirect('/cadastrar_usuario?erro=1');
        });
}

module.exports = {
    processarCadastro
};