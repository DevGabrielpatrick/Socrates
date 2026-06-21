const Projeto = require('../model/Projeto');
const Usuario = require('../model/Usuario');

function enviarProjeto(req, res) {
    const usuarioId = req.session.usuarioId;
    if (!usuarioId) {
        return res.redirect('/login');
    }
    const { titulo, tipo, dificuldade, descricao } = req.body;
    
    let capaUrl = '';
    if (req.file) {
        capaUrl = '/uploads/' + req.file.filename; 
    }

    Projeto.create({
        titulo: titulo,
        tipo: tipo,
        dificuldade: dificuldade,
        descricao: descricao,
        capaUrl: capaUrl,
        usuarioId: usuarioId
    })
    .then(() => {
        console.log('✅ Projeto salvo com sucesso no banco de dados!');
        res.redirect('/materiais?sucesso=projeto_enviado');
    })
    .catch((err) => {
        console.error('❌ Erro ao salvar o projeto:', err);
        res.redirect('/upload?erro=1');
    });
}

function listarMeusProjetos(req, res) {
    const usuarioId = req.session.usuarioId;
    
    Projeto.findAll({ 
        where: { usuarioId: usuarioId },
        include: [{
            model: Usuario,
            required: true
        }]
    })
    .then((projetos) => {
        res.json(projetos);
    })
    .catch((err) => {
        console.error('Erro ao procurar projetos:', err);
        res.status(500).json({ erro: 'Falha ao buscar materiais' });
    });
}

function listarTodosProjetos(req, res) {
    Projeto.findAll({
        order: [['createdAt', 'DESC']],
        include: [{ model: Usuario, required: true }]
    })
    .then((projetos) => {
        res.json(projetos);
    })
    .catch((err) => {
        console.error('Erro ao buscar o catálogo de projetos:', err);
        res.status(500).json({ erro: 'Falha ao buscar catálogo' });
    });
}

module.exports = {
    enviarProjeto,
    listarMeusProjetos,
    listarTodosProjetos
};


