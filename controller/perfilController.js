const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Usuario = require('../model/Usuario');
const bcrypt = require('bcrypt');

const UPLOAD_DIR = path.join(__dirname, '..', 'view', 'imagens', 'perfis');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        // gera nome único: usuario-<id>-<timestamp>.<ext>
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `usuario-${req.session.usuarioId}-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype);
        cb(ok ? null : new Error('Tipo de arquivo não suportado'), ok);
    }
});

function mostrarPerfil(req, res) {
    const usuarioId = req.session.usuarioId;

    Usuario.findByPk(usuarioId)
        .then((usuario) => {
            if (!usuario) return res.redirect('/logout');

            const htmlPath = path.join(__dirname, '..', 'view', 'alterarPerfil.html');
            let html = fs.readFileSync(htmlPath, 'utf8');

            const perfil = (usuario.perfil || 'aluno').toLowerCase();
            const areaValor = esc(usuario.area || '');
            const cursoValor = esc(usuario.curso || '');

            html = html
                .replace('value="Josefina da Silva"', `value="${esc(usuario.nome)}"`)
                .replace('value="josefina57@gmail.com"', `value="${esc(usuario.email)}"`)
                .replace('value="123456"', `value=""`)
                .replace('src="https://i.pravatar.cc/250"', `src="${esc(usuario.foto || 'https://i.pravatar.cc/250')}"`)
                .replace('id="area" name="area" placeholder="Ex.: Ciências Exatas, Humanas, Biológicas..."',
                         `id="area" name="area" placeholder="Ex.: Ciências Exatas, Humanas, Biológicas..." value="${areaValor}"`)
                .replace('id="curso" name="curso" placeholder="Ex.: Engenharia de Computação"',
                         `id="curso" name="curso" placeholder="Ex.: Engenharia de Computação" value="${cursoValor}"`)
                .replace('<option value="aluno">Aluno</option>',
                         `<option value="aluno"${perfil === 'aluno' ? ' selected' : ''}>Aluno</option>`)
                .replace('<option value="professor">Professor</option>',
                         `<option value="professor"${perfil === 'professor' ? ' selected' : ''}>Professor</option>`);

            res.send(html);
        })
        .catch((err) => {
            console.error('Erro ao buscar perfil:', err);
            res.redirect('/home?erro=perfil_nao_carregado');
        });
}

function atualizarPerfil(req, res) {
    upload.single('foto')(req, res, (err) => {
        if (err) {
            console.error('Erro no upload:', err);
            return res.redirect('/alterar_perfil?erro=upload_falhou');
        }

        const usuarioId = req.session.usuarioId;
        const novoNome = (req.body.nome || '').trim();
        const novoEmail = (req.body.email || '').trim();
        const novoPerfil = (req.body.perfil || '').trim().toLowerCase();
        const novaArea = (req.body.area || '').trim();
        const novoCurso = novoPerfil === 'aluno' ? (req.body.curso || '').trim() : null;
        const novaSenha = req.body.senha || '';
        const confirmarSenha = req.body.confirmarSenha || '';

        if (!novoNome || !novoEmail || !novoPerfil) {
            return res.redirect('/alterar_perfil?erro=campos_obrigatorios');
        }

        if (!['aluno', 'professor'].includes(novoPerfil)) {
            return res.redirect('/alterar_perfil?erro=campos_obrigatorios');
        }

        if (novaSenha.length > 0 || confirmarSenha.length > 0) {
            if (novaSenha !== confirmarSenha) {
                return res.redirect('/alterar_perfil?erro=senhas_nao_conferem');
            }
            if (novaSenha.length < 6) {
                return res.redirect('/alterar_perfil?erro=senha_curta');
            }
        }

        Usuario.findByPk(usuarioId)
            .then((usuario) => {
                if (!usuario) return res.redirect('/logout');

                usuario.nome = novoNome;
                usuario.email = novoEmail;
                usuario.perfil = novoPerfil;
                usuario.area = novaArea || null;
                usuario.curso = novoCurso;

                if (req.file) {

                    if (usuario.foto && usuario.foto.startsWith('/imagens/perfis/')) {
                        const antigo = path.join(__dirname, '..', 'view', usuario.foto);
                        if (fs.existsSync(antigo)) {
                            try { fs.unlinkSync(antigo); } catch (_) {}
                        }
                    }
                    usuario.foto = `/imagens/perfis/${req.file.filename}`;
                }

                if (novaSenha.length > 0) {
                    return bcrypt.hash(novaSenha, 10).then((hash) => {
                        usuario.senha = hash;
                        return usuario.save();
                    });
                }

                return usuario.save();
            })
            .then(() => {
                req.session.usuarioNome = novoNome;
                if (req.file) {
                    req.session.usuarioFoto = `/imagens/perfis/${req.file.filename}`;
                }
                res.redirect('/carregando?to=/alterar_perfil%3Fsucesso%3D1&msg=Perfil%20atualizado!');
            })
            .catch((err) => {
                console.error('Erro ao atualizar perfil:', err);
                if (err.name === 'SequelizeUniqueConstraintError') {
                    return res.redirect('/alterar_perfil?erro=email_duplicado');
                }
                res.redirect('/alterar_perfil?erro=1');
            });
    });
}

function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

module.exports = {
    mostrarPerfil,
    atualizarPerfil
};
