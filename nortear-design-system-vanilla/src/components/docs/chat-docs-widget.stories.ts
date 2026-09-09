/**
 * ─── O widget do chat da documentação ────────────────────────────────────────
 *
 * POR QUE ESTA STORY EXISTE
 *
 * O widget tinha ZERO teste. Os dois defeitos que ele acumulou — o botão de
 * "ir para o fim" cobrindo a última linha, e o aviso de demonstração vazando
 * 24px da caixa — foram achados a olho e medidos com sonda descartável, que
 * some junto com a sessão. O terceiro seria achado do mesmo jeito.
 *
 * POR QUE EM NAVEGADOR, E NÃO EM NODE
 *
 * Uma das provas é de LAYOUT: o aviso cabe dentro do painel. Isso não existe
 * sem caixa medida, e jsdom não mede caixa — devolveria zero para tudo e o
 * teste passaria sempre, que é a definição de portão sem dentes. O foco também
 * é real aqui: `document.activeElement` em jsdom não prova ordem de tabulação.
 *
 * POR QUE UMA STORY SÓ, COM A PLAY EM SEQUÊNCIA
 *
 * `mountChatDocs()` é idempotente por uma variável de MÓDULO (`mounted`), de
 * propósito: o manager reavalia o módulo em recarga a quente e duas instâncias
 * dariam dois botões com o mesmo nome acessível. O preço é que só há uma
 * montagem por carga de página, então dividir em várias stories criaria
 * dependência de ordem. A remoção no fim é o que impede o botão fixo de sobrar
 * na página e atrapalhar as stories vizinhas.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent } from 'storybook/test';
import { mountChatDocs } from '../../../../docs/shared/chat-docs';

const meta: Meta = {
  title: 'QA/Chat da documentação',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    // Não é especificação visual: é o widget do manager montado no preview só
    // para poder ser medido. Instantâneo daqui só geraria ruído de revisão.
    chromatic: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/** Dois quadros, que é o que o painel usa para separar os estados da transição. */
function proximoQuadro(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Espera por RELÓGIO, e nunca `waitFor`.
 *
 * Regra medida do repositório: `waitFor` reagenda por observador de mutação, e
 * uma condição que toca o DOM provoca a própria tentativa seguinte — o prazo
 * nunca chega, o navegador crava um núcleo e a aba morre sem falha nenhuma,
 * levando o arquivo junto. Aqui as condições leem caixa
 * (`getBoundingClientRect` força layout), então o laço de relógio é
 * obrigatório, não preferência.
 */
async function ate(condicao: () => boolean, prazoMs = 4000): Promise<void> {
  const limite = performance.now() + prazoMs;
  while (performance.now() < limite) {
    if (condicao()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('a condição não assentou dentro do prazo');
}

export const Widget: Story = {
  // O widget se pendura no `document.body`, não no canvas — é assim que ele
  // vive no manager, sobreposto ao Storybook inteiro. O canvas existe só porque
  // o renderer HTML exige um elemento para montar a story.
  render: () => document.createElement('div'),
  play: async () => {
    const fetchOriginal = window.fetch;
    try {
      mountChatDocs();

      const root = document.querySelector<HTMLElement>('.chat-docs-root');
      // Se isto falhar numa reexecução, é o singleton de módulo: a story roda
      // uma vez por carga de página, por desenho. Falhar alto é melhor que
      // passar medindo nada.
      expect(root, 'o widget montou').toBeTruthy();

      const lancador = root!.querySelector<HTMLButtonElement>('.chat-docs-launcher')!;
      const painel = root!.querySelector<HTMLElement>('.chat-docs-panel')!;

      /* ── Fechado, o painel não existe para ninguém ──────────────────────── */

      expect(lancador.getAttribute('aria-expanded')).toBe('false');
      expect(painel.hidden).toBe(true);
      // O `aria-controls` só vale se apontar para o elemento que de fato abre.
      expect(lancador.getAttribute('aria-controls')).toBe(painel.id);
      expect(lancador.textContent?.trim().length ?? 0).toBeGreaterThan(0);

      /* ── Aberto ─────────────────────────────────────────────────────────── */

      await userEvent.click(lancador);
      await ate(() => !painel.hidden);
      await proximoQuadro();

      expect(lancador.getAttribute('aria-expanded')).toBe('true');
      expect(painel.getAttribute('role')).toBe('dialog');
      // `aria-modal="true"` seria mentira: o Storybook atrás continua operável,
      // e a promessa falsa esconderia o resto da aplicação de quem lê a tela.
      expect(painel.getAttribute('aria-modal')).toBe('false');
      expect(painel.getAttribute('aria-label')?.length ?? 0).toBeGreaterThan(0);

      /* ── O aviso de demonstração ────────────────────────────────────────── */

      const demo = painel.querySelector<HTMLElement>('.chat-docs-demo')!;
      expect(demo, 'o aviso de demonstração está na tela').toBeTruthy();
      // NÃO é `role="alert"`, e isto é decisão: o aviso já está na tela quando o
      // painel abre. Região viva anuncia por INTERRUPÇÃO, e interromper para ler
      // um texto que a pessoa vai encontrar sozinha, na ordem, é ruído.
      expect(demo.getAttribute('role')).toBeNull();

      /* ── A regressão de layout que motivou este arquivo ─────────────────── */

      // O `.nds-alert` é `width: 100%`. Somando margem lateral, a caixa ficava
      // 24px MAIS LARGA que o painel e vazava na horizontal. `width: auto`
      // devolve o item ao esticamento do flex, que já desconta a margem.
      const cxPainel = painel.getBoundingClientRect();
      const cxDemo = demo.getBoundingClientRect();
      expect(cxDemo.right, 'o aviso não vaza à direita').toBeLessThanOrEqual(cxPainel.right);
      expect(cxDemo.left, 'o aviso não vaza à esquerda').toBeGreaterThanOrEqual(cxPainel.left);
      // Mede o PAINEL, e não o documento: quem recorta é ele. O guarda anterior
      // de rolagem horizontal media a raiz, que não transborda — e ficou verde
      // com a barra visível na tela.
      expect(painel.scrollWidth, 'o painel não rola na horizontal').toBeLessThanOrEqual(
        painel.clientWidth + 1,
      );

      /* ── Falha de configuração vira aviso, não mensagem na conversa ─────── */

      // O servidor não existe nesta página. Em vez de esperar o 404 do preview,
      // o `fetch` é trocado por uma resposta determinística — o que se está
      // provando é o CAMINHO do erro, não a rede.
      window.fetch = (async (entrada: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof entrada === 'string' ? entrada : entrada.toString();
        if (!url.includes('/api/perguntar')) return fetchOriginal(entrada, init);
        return new Response(JSON.stringify({ code: 'sem_chave' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        });
      }) as typeof window.fetch;

      const campo = painel.querySelector<HTMLTextAreaElement>('textarea')!;
      await userEvent.click(campo);
      await userEvent.type(campo, 'o que é o Button?');
      await userEvent.keyboard('{Enter}');

      // `querySelector` é leitura pura — não muta e não força layout.
      await ate(() => painel.querySelector('.chat-docs-notice') !== null);
      const aviso = painel.querySelector<HTMLElement>('.chat-docs-notice')!;
      // Este SIM é `role="alert"`: apareceu por causa de uma falha, depois de um
      // pedido da pessoa, e ela precisa saber sem ir procurar.
      expect(aviso.getAttribute('role')).toBe('alert');
      expect(aviso.textContent?.trim().length ?? 0).toBeGreaterThan(0);

      // O aviso de falha carregava o MESMO defeito de largura do de demonstração.
      await proximoQuadro();
      const cxAviso = aviso.getBoundingClientRect();
      expect(cxAviso.right).toBeLessThanOrEqual(painel.getBoundingClientRect().right);
      expect(cxAviso.left).toBeGreaterThanOrEqual(painel.getBoundingClientRect().left);

      /* ── Escape fecha e DEVOLVE o foco ──────────────────────────────────── */

      // Sem devolver, o foco cai no `<body>` e a tabulação recomeça no topo do
      // Storybook — é a metade que costuma faltar em painel que fecha.
      await userEvent.keyboard('{Escape}');
      await ate(() => painel.hidden === true);

      expect(lancador.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement, 'o foco voltou para o botão').toBe(lancador);
    } finally {
      window.fetch = fetchOriginal;
      document.querySelector('.chat-docs-root')?.remove();
    }
  },
};
