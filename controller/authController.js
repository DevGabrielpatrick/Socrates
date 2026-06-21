const path = require('path');
const fs = require('fs');
const Usuario = require('../model/Usuario');
const bcrypt = require('bcrypt');

// Caracteres sem ambiguidade visual (sem I, l, 1, O, 0)
const CHARS_SENHA_TEMP = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function gerarSenhaTemporaria(tamanho = 8) {
    let s = '';
    for (let i = 0; i < tamanho; i++) {
        s += CHARS_SENHA_TEMP[Math.floor(Math.random() * CHARS_SENHA_TEMP.length)];
    }
    return s;
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function processarLogin(req, res) {

    const emailDigitado = req.body.email;
    const senhaDigitada = req.body.senha;


    Usuario.findOne({ where: { email: emailDigitado } })
        .then((usuarioEncontrado) => {

            if (!usuarioEncontrado) {
                console.log('Login falhou: E-mail não existe.');
                return res.redirect('/login?erro=usuario_nao_encontrado');
            }

            return bcrypt.compare(senhaDigitada, usuarioEncontrado.senha)
                .then((senhaValida) => {

                    if (!senhaValida) {
                        console.log('Login falhou: Senha incorreta.');
                        return res.redirect('/login?erro=senha_incorreta');
                    }

                    req.session.usuarioId = usuarioEncontrado.id;
                    req.session.usuarioNome = usuarioEncontrado.nome;

                    if (usuarioEncontrado.senhaTemporaria) {
                        console.log('Login com senha temporária por:', usuarioEncontrado.nome);
                        return req.session.save(() => {
                            res.redirect('/trocar_senha_obrigatoria');
                        });
                    }

                    console.log('Login realizado com sucesso por:', usuarioEncontrado.nome);
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

function processarEsqueciSenha(req, res) {
    const emailDigitado = (req.body.email || '').trim().toLowerCase();

    if (!emailDigitado) {
        return res.redirect('/esqueci_senha?erro=email_nao_encontrado');
    }

    Usuario.findOne({ where: { email: emailDigitado } })
        .then((usuario) => {
            if (!usuario) {
                // Não revela se o e-mail existe ou não
                return res.redirect('/esqueci_senha?erro=email_nao_encontrado');
            }

            const senhaTemp = gerarSenhaTemporaria(8);

            return bcrypt.hash(senhaTemp, 10)
                .then((hash) => {
                    usuario.senha = hash;
                    usuario.senhaTemporaria = true;
                    return usuario.save();
                })
                .then(() => {
                    console.log('Senha temporária gerada para:', usuario.email);
                    const params = new URLSearchParams({
                        email: usuario.email,
                        temp: senhaTemp
                    });
                    res.redirect('/esqueci_senha?' + params.toString());
                });
        })
        .catch((err) => {
            console.error('Erro ao gerar senha temporária:', err);
            res.redirect('/esqueci_senha?erro=erro_no_servidor');
        });
}

function mostrarTrocaSenhaObrigatoria(req, res) {
    const usuarioId = req.session.usuarioId;

    Usuario.findByPk(usuarioId)
        .then((usuario) => {
            if (!usuario) return res.redirect('/logout');

            const htmlPath = path.join(__dirname, '..', 'view', 'trocarSenhaObrigatoria.html');
            let html = fs.readFileSync(htmlPath, 'utf8');

            // Se o flag já estiver false, deixa ele passar direto
            if (!usuario.senhaTemporaria) {
                return res.redirect('/carregando?to=/home&msg=Bem-vindo%20de%20volta!');
            }

            html = html.replace('{{nome}}', escapeHtml(usuario.nome));
            res.send(html);
        })
        .catch((err) => {
            console.error('Erro ao carregar troca obrigatória:', err);
            res.redirect('/login?erro=erro_no_servidor');
        });
}

function processarTrocaObrigatoria(req, res) {
    const usuarioId = req.session.usuarioId;
    const novaSenha = req.body.novaSenha || '';
    const confirmarSenha = req.body.confirmarSenha || '';

    if (novaSenha.length < 6) {
        return res.redirect('/trocar_senha_obrigatoria?erro=senha_curta');
    }

    if (novaSenha !== confirmarSenha) {
        return res.redirect('/trocar_senha_obrigatoria?erro=senhas_diferentes_troca');
    }

    Usuario.findByPk(usuarioId)
        .then((usuario) => {
            if (!usuario) return res.redirect('/logout');

            return bcrypt.hash(novaSenha, 10).then((hash) => {
                usuario.senha = hash;
                usuario.senhaTemporaria = false;
                return usuario.save();
            });
        })
        .then(() => {
            console.log('Senha definitiva definida pelo usuário:', req.session.usuarioNome);
            res.redirect('/carregando?to=/home&msg=Senha%20definida%20com%20sucesso!');
        })
        .catch((err) => {
            console.error('Erro ao trocar senha:', err);
            res.redirect('/trocar_senha_obrigatoria?erro=erro_no_servidor');
        });
}

module.exports = {
    processarLogin,
    processarEsqueciSenha,
    mostrarTrocaSenhaObrigatoria,
    processarTrocaObrigatoria
};