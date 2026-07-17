// Recarrega a página (uma vez) quando um chunk dinâmico falha ao carregar.
//
// Cenário: deploy skew — a aba foi aberta antes de um novo deploy e o runtime
// ainda referencia assets com hash antigo, que retornam 404 no deploy atual
// ("Failed to fetch dynamically imported module"). O Vite emite o evento
// `vite:preloadError` nesses casos; recarregar busca o HTML novo com os
// hashes atuais e a navegação continua.
//
// A guarda em sessionStorage evita loop de reload quando o asset está
// realmente ausente (bug de build, não skew).
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    const KEY = 'nds:chunk-reload-at';
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < 30_000) return; // recarregou há <30s — não loopar
    sessionStorage.setItem(KEY, String(Date.now()));
    event.preventDefault();
    window.location.reload();
  });
}

export {};
