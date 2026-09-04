/**
 * Console de eventos do `track()`, ligado por `?debugAnalytics=1`.
 *
 * Existe porque inspecionar evento aqui tem três armadilhas, e todas custam
 * tempo antes de alguém entender o que está vendo:
 *
 * 1. As docs pages rodam no IFRAME, e o `track()` encaminha para
 *    `window.top.gtag`. Quem abre o console no contexto do
 *    `storybook-preview-iframe` olha para um `dataLayer` vazio e conclui que o
 *    componente não dispara nada.
 * 2. Sem GA4 configurado, o `gtag` pode não existir e o evento some sem
 *    vestígio — indistinguível de "o componente não disparou".
 * 3. Boa parte do analytics não é ouvinte de DOM: no tooltip, por exemplo, o
 *    evento sai de um callback `onShow` chamado de dentro do componente. O
 *    painel Event Listeners do DevTools não mostra nada disso, e com razão —
 *    não há ouvinte para mostrar.
 *
 * O log diz o nome do evento, o payload e SE o gtag recebeu, que é o que separa
 * "não disparou" de "disparou e não havia para onde mandar".
 *
 * Por que persistir em `localStorage` e não ler só a URL: o Storybook reescreve
 * a URL do manager a cada navegação e leva o parâmetro embora. Sem persistir, o
 * modo morreria no primeiro clique na barra lateral — que é exatamente quando
 * se quer observar. `?debugAnalytics=0` desliga.
 */

const CHAVE = 'nds-debug-analytics';
const PARAM = 'debugAnalytics';

/** A janela do manager, ou a própria quando não há iframe. */
function janelaDeCima(): Window | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.self !== window.top && window.top ? window.top : window;
  } catch {
    // Cross-origin: o `top` existe mas é inacessível. A própria serve.
    return window;
  }
}

function lerArmazenado(): boolean {
  try {
    return localStorage.getItem(CHAVE) === '1';
  } catch {
    // Janela anônima, cookies bloqueados, contexto de captura de thumbnail.
    return false;
  }
}

function armazenar(ligado: boolean): void {
  try {
    if (ligado) localStorage.setItem(CHAVE, '1');
    else localStorage.removeItem(CHAVE);
  } catch {
    // Sem armazenamento o modo ainda funciona enquanto o parâmetro estiver na
    // URL — só não sobrevive à navegação.
  }
}

/**
 * O modo está ligado?
 *
 * Lê a URL do MANAGER a cada chamada, porque é lá que a pessoa digita o
 * parâmetro, e sincroniza o `localStorage` para sobreviver à navegação.
 */
export function debugDeAnalyticsLigado(): boolean {
  const janela = janelaDeCima();
  if (!janela) return false;

  let daUrl: string | null = null;
  try {
    daUrl = new URL(janela.location.href).searchParams.get(PARAM);
  } catch {
    daUrl = null;
  }

  if (daUrl === '1') {
    armazenar(true);
    return true;
  }
  if (daUrl === '0') {
    armazenar(false);
    return false;
  }
  return lerArmazenado();
}

/**
 * Escreve um evento no console, no formato que se lê de relance.
 *
 * `entregueAoGtag` não é detalhe: sem ele, um evento que dispara com GA4
 * desconfigurado é indistinguível de um evento que não dispara.
 */
export function logarEvento(
  evento: string,
  params: Record<string, unknown>,
  entregueAoGtag: boolean,
): void {
  if (!debugDeAnalyticsLigado()) return;
  const destino = entregueAoGtag ? 'gtag ✓' : 'gtag ✗ (não configurado)';
  // eslint-disable-next-line no-console
  console.log('%c[nds analytics]%c ' + evento + ' — ' + destino,
    'color:#3c6972;font-weight:bold', 'color:inherit', params);
}
