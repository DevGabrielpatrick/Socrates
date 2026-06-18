const Usuario = require('../model/Usuario'); // Puxa a tabela do banco

function processarLogin(req, res) {
    // Pega o que o usuário digitou na tela
    const emailDigitado = req.body.email;
    const senhaDigitada = req.body.senha;

    // Vai no banco de dados e procura alguém com esse e-mail
    Usuario.findOne({ where: { email: emailDigitado } })
        .then((usuarioEncontrado) => {
            
            
            if (!usuarioEncontrado) {
                console.log('Login falhou: E-mail não existe.');
                return res.redirect('/?erro=usuario_nao_encontrado');
            }

         
            if (usuarioEncontrado.senha !== senhaDigitada) {
                console.log('Login falhou: Senha incorreta.');
                return res.redirect('/?erro=senha_incorreta');
            }

            console.log('Login realizado com sucesso por:', usuarioEncontrado.nome);

            req.session.usuarioId = usuarioEncontrado.id;
            req.session.usuarioNome = usuarioEncontrado.nome;

            req.session.save(() => {
                res.redirect('/home');
            });
        })
        .catch((err) => {
            console.error('Erro ao tentar fazer login:', err);
            res.redirect('/?erro=erro_no_servidor');
        });
}

module.exports = {
    processarLogin
};