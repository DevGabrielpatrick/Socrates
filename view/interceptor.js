// interceptor.js
// Intercepta cliques em links da aplicação para mostrar a tela de carregamento
// antes de ir pra próxima página, evitando o "corte seco".

(function () {
    // Rotas internas que devem passar pelo loading
    const ROTAS_INTERNAS = ['/home', '/alterar_perfil', '/cadastro', '/login', '/logout'];

    function deveInterceptar(href) {
        if (!href) return false;
        // Ignora âncoras vazias, links externos, mailto, tel, e javascript:
        if (href.startsWith('#')) return false;
        if (href.startsWith('mailto:')) return false;
        if (href.startsWith('tel:')) return false;
        if (href.startsWith('javascript:')) return false;
        if (href.startsWith('http://') || href.startsWith('https://')) return false;
        // Só intercepta se for uma das rotas conhecidas
        const path = href.split('?')[0];
        return ROTAS_INTERNAS.includes(path);
    }

    function montarLoading(href) {
        const sep = href.includes('?') ? '&' : '?';
        return '/carregando?to=' + encodeURIComponent(href) + sep + 'msg=Carregando...';
    }

    // Cria o overlay de loading (sem precisar navegar pra /carregando)
    function mostrarOverlay() {
        if (document.getElementById('appLoadingOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'appLoadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, #6f52ff, #7558ff, #8267ff);
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.25s ease;
        `;
        overlay.innerHTML = `
            <div style="position:relative; width:140px; height:140px; display:flex; align-items:center; justify-content:center;">
                <i class="fa-solid fa-graduation-cap" style="color:white; font-size:90px; z-index:4; animation:appFlutuar 2s ease-in-out infinite;"></i>
                <div class="app-pulse" style="position:absolute; top:50%; left:50%; width:140px; height:140px; border-radius:50%; border:3px solid rgba(255,255,255,0.5); transform:translate(-50%,-50%); animation:appPulse 2s infinite;"></div>
                <div class="app-pulse" style="position:absolute; top:50%; left:50%; width:140px; height:140px; border-radius:50%; border:3px solid rgba(255,255,255,0.5); transform:translate(-50%,-50%); animation:appPulse 2s infinite 0.6s;"></div>
                <div class="app-pulse" style="position:absolute; top:50%; left:50%; width:140px; height:140px; border-radius:50%; border:3px solid rgba(255,255,255,0.5); transform:translate(-50%,-50%); animation:appPulse 2s infinite 1.2s;"></div>
            </div>
            <h2 style="margin-top:50px; color:white; font-size:22px; letter-spacing:2px; font-weight:400; animation:appPiscar 1.2s infinite;">Carregando...</h2>
        `;

        // Injeta as animações (caso o CSS global não tenha)
        if (!document.getElementById('appLoadingStyles')) {
            const style = document.createElement('style');
            style.id = 'appLoadingStyles';
            style.textContent = `
                @keyframes appPulse {
                    0%   { opacity: 0.9; transform: translate(-50%,-50%) scale(1); }
                    100% { opacity: 0;   transform: translate(-50%,-50%) scale(2.2); }
                }
                @keyframes appFlutuar {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-15px); }
                }
                @keyframes appPiscar {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.4; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
        // força reflow antes de animar a opacidade
        void overlay.offsetWidth;
        overlay.style.opacity = '1';
    }

    // Intercepta cliques em qualquer <a>
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a');
        if (!link) return;
        if (link.target === '_blank') return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        const href = link.getAttribute('href');
        if (!deveInterceptar(href)) return;

        e.preventDefault();
        mostrarOverlay();
        // pequeno delay pra o overlay aparecer antes de trocar de página
        setTimeout(function () {
            window.location.href = montarLoading(href);
        }, 200);
    });

    // Intercepta o submit de forms (login, cadastro, atualizar perfil)
    document.addEventListener('submit', function (e) {
        const form = e.target;
        if (form.tagName !== 'FORM') return;
        mostrarOverlay();
    });

    // Ao voltar/avançar a página (cache do navegador), mostra loading também
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) {
            mostrarOverlay();
        }
    });
})();
