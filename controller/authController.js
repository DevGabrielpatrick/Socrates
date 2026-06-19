const Usuario = require('../model/Usuario'); // Puxa a tabela do banco
const bcrypt = require('bcrypt');

function processarLogin(req, res) {
    // Pega o que o usuário digitou na tela
    const emailDigitado = req.body.email;
    const senhaDigitada = req.body.senha;

    // Vai no banco de dados e procura alguém com esse e-mail
    Usuario.findOne({ where: { email: emailDigitado } })
        .then((usuarioEncontrado) => {

            if (!usuarioEncontrado) {
                console.log('Login falhou: E-mail não existe.');
                return res.redirect('/login?erro=usuario_nao_encontrado');
            }

            // Compara a senha digitada com o hash armazenado
            return bcrypt.compare(senhaDigitada, usuarioEncontrado.senha)
                .then((senhaValida) => {

                    if (!senhaValida) {
                        console.log('Login falhou: Senha incorreta.');
                        return res.redirect('/login?erro=senha_incorreta');
                    }

                    console.log('Login realizado com sucesso por:', usuarioEncontrado.nome);

                    req.session.usuarioId = usuarioEncontrado.id;
                    req.session.usuarioNome = usuarioEncontrado.nome;

                    req.session.save(() => {
                        res.redirect('/carregando?to=/home&msg=Bem-vindo%20de%20volta!');
                    });
                });
        })
        .catch((err) => {
            console.error('Erro ao tentar fazer login:', err);
            res.redirect('/login?erro=erro_no_servidor');
        });
}

module.exports = {
    processarLogin
};