import { cn } from '@/lib/utils';
import type { ChatToolCall, ToolCallState } from '@shared/primitives/chat-protocol';
import {
  summarizeToolCalls,
  toolCallBadgeClass,
} from '@shared/primitives/tool-group-summary';

/**
 * O que o agente fez para responder, reunido num bloco só.
 *
 * Desenho em `nds/agent-run.css`, no bloco "Grupo de chamadas de ferramenta",
 * que também guarda as cinco decisões de acessibilidade. O vocabulário —
 * `ChatToolCall`, `ToolCallState` — vem de `@shared/primitives/chat-protocol`;
 * o que o resumo diz sai de `@shared/primitives/tool-group-summary`.
 *
 * AS DECISÕES QUE GOVERNAM A PEÇA
 *
 * 1. É UM `<details>` DE VERDADE, e não uma caixa imitada com `aria-expanded`.
 *    O navegador já dá o botão, o estado de expansão e o teclado — e dá tudo
 *    isso de graça, sem uma linha de ARIA escrita à mão que possa envelhecer
 *    errado.
 * 2. NASCE RECOLHIDO, e o resumo diz em palavra o que há dentro, inclusive que
 *    algo falhou. Um grupo fechado que esconde uma falha é uma falha que
 *    ninguém vê. A saída NÃO é forçar a abertura: isso brigaria com quem
 *    acabou de fechar, e ninguém fecha uma caixa duas vezes de bom humor.
 * 3. NÃO É REGIÃO VIVA. As chamadas chegam enquanto a resposta é gerada logo
 *    abaixo, e anunciar cada uma corta a leitura do que importa.
 * 4. O ESTADO É PALAVRA, em `.nds-badge`, nunca só cor ou ícone (WCAG 1.4.1).
 *    A cor da etiqueta é reforço, e some para quem não a percebe.
 * 5. A CHAMADA QUE ESPERA UMA PESSOA NÃO FICA AQUI DENTRO. Pedir autorização
 *    dentro de uma caixa fechada é pedir sem mostrar. Quem separa é quem
 *    consome — `splitWaitingCalls` faz a conta —, e não este componente: um
 *    componente que filtrasse sozinho apagaria da tela um dado que recebeu.
 *
 * `tool-error` DO CATÁLOGO É UM ESTADO DAQUI, e não outra peça: `ToolCallState`
 * já separa `failed`, e a chamada que falhou desenha diferente sem virar outro
 * componente.
 *
 * O QUE O COMPONENTE NÃO FAZ: executar ferramenta, repetir chamada, decidir o
 * que uma falha significa ou tirar alguém da lista. Ele desenha as chamadas que
 * recebe e avisa quando alguém abre ou fecha.
 */

export interface ToolGroupLabels {
  /**
   * O título do resumo, a partir da contagem.
   *
   * FUNÇÃO, e não texto pronto: plural é decisão de idioma, e o componente que
   * escolhesse entre singular e plural escolheria por cinco idiomas de uma vez.
   * É a mesma razão pela qual o relógio do estado da execução chega já escrito.
   */
  title: (count: number) => string;
  /**
   * A palavra que o RESUMO mostra sobre o conjunto.
   *
   * `Record` completo de propósito — estado novo no vocabulário compartilhado
   * reprova a compilação aqui, em vez de desenhar uma etiqueta em branco que
   * ninguém repara.
   */
  summary: Record<ToolCallState, string>;
  /** A palavra de cada chamada na lista. Mesmas quatro chaves, outra escala. */
  call: Record<ToolCallState, string>;
}

export interface ToolGroupOptions {
  /** As chamadas que o grupo desenha, na ordem em que aconteceram. */
  calls: ChatToolCall[];
  labels: ToolGroupLabels;
  /**
   * A caixa começa aberta.
   *
   * O padrão é fechada (decisão 2): são detalhes de execução, e não a resposta.
   */
  open?: boolean;
  /** Alguém abriu ou fechou a caixa, e o novo estado vem junto. */
  onOpenChange?: (open: boolean) => void;
  class?: string;
}

/**
 * A seta que gira com o estado da caixa.
 *
 * Ela existe porque o `display: flex` do resumo tira o marcador que o navegador
 * daria — e tira em engine, não em todas. O ícone do sistema entra no lugar,
 * `aria-hidden` porque repete em desenho o que o próprio controle já anuncia.
 * Mesma seta e mesma rotação da chamada de ferramenta dentro da conversa.
 */
function createChevron(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'nds-icon nds-tool-group-icon');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'm9 18 6-6-6-6');
  svg.appendChild(path);
  return svg;
}

/** Uma etiqueta de estado: a palavra na frente, a cor atrás. */
function createStateBadge(state: ToolCallState, label: string, slot: string): HTMLElement {
  const badge = document.createElement('span');
  badge.className = toolCallBadgeClass(state);
  badge.dataset.slot = slot;
  badge.textContent = label;
  return badge;
}

/** Uma linha da lista: o nome da ferramenta, o estado dela e o detalhe. */
function createToolCall(call: ChatToolCall, labels: ToolGroupLabels): HTMLLIElement {
  const item = document.createElement('li');
  item.className = 'nds-tool-call';
  item.dataset.slot = 'tool-call';
  item.dataset.state = call.state;
  // O endereço vai para o DOM quando existe: é por ele que quem atualiza uma
  // chamada em andamento acha a linha certa quando duas têm o mesmo nome.
  if (call.id) item.dataset.callId = call.id;

  const name = document.createElement('span');
  name.className = 'nds-tool-call-name';
  name.dataset.slot = 'tool-call-name';
  name.textContent = call.name;
  item.appendChild(name);

  item.appendChild(createStateBadge(call.state, labels.call[call.state], 'tool-call-state'));

  // Sem detalhe não há parágrafo: um `<p>` vazio ocuparia a linha inteira da
  // grade e abriria um vão que parece defeito de espaçamento.
  if (call.detail) {
    const detail = document.createElement('p');
    detail.className = 'nds-tool-call-detail';
    detail.dataset.slot = 'tool-call-detail';
    detail.textContent = call.detail;
    item.appendChild(detail);
  }

  return item;
}

export function createToolGroup(options: ToolGroupOptions): HTMLDetailsElement {
  const { calls, labels, open = false, onOpenChange } = options;

  // `<details>` (decisão 1). Nenhum papel ARIA e nenhuma região viva
  // (decisão 3) — quem quiser anunciar põe a região por fora.
  const root = document.createElement('details');
  root.className = cn('nds-tool-group', options.class);
  root.dataset.slot = 'tool-group';
  // Antes do ouvinte, de propósito: o estado inicial não é alguém abrindo, e
  // avisar sobre ele faria o primeiro quadro parecer uma interação.
  root.open = open;

  const summary = document.createElement('summary');
  summary.className = 'nds-tool-group-summary';
  summary.dataset.slot = 'tool-group-summary';
  summary.appendChild(createChevron());

  const title = document.createElement('span');
  title.className = 'nds-tool-group-title';
  title.dataset.slot = 'tool-group-title';
  title.textContent = labels.title(calls.length);
  summary.appendChild(title);

  // O RESUMO DIZ O QUE HÁ DENTRO (decisão 2), e quem decide o quê é o primitivo
  // compartilhado: se a escolha morasse aqui, as cinco stacks escreveriam cinco
  // versões dela, e uma discordaria justamente no caso em que a resposta é
  // menos óbvia — uma falha ao lado de algo que ainda corre.
  const state = summarizeToolCalls(calls).state;
  const summaryBadge = createStateBadge(state, labels.summary[state], 'tool-group-state');
  // A classe é o que a folha estiliza; o `data-slot` continua sendo o contrato
  // de markup que as cinco stacks compartilham. Somam-se, não se substituem.
  summaryBadge.classList.add('nds-tool-group-state');
  summary.appendChild(summaryBadge);

  root.appendChild(summary);

  const list = document.createElement('ol');
  list.className = 'nds-tool-group-list';
  list.dataset.slot = 'tool-group-list';
  for (const call of calls) list.appendChild(createToolCall(call, labels));
  root.appendChild(list);

  // O evento do próprio elemento, e não um `click` no resumo: o navegador abre
  // e fecha a caixa por teclado, por busca na página e por script, e só o
  // `toggle` vê os três.
  //
  // O ÚLTIMO VALOR RELATADO fica guardado, e a guarda não é zelo: o navegador
  // enfileira um `toggle` quando o atributo `open` é escrito, e nas stacks em
  // que a marcação é declarativa isso acontece no primeiro quadro. Sem a
  // guarda, um grupo que nasce aberto avisaria que alguém o abriu — e ninguém
  // abriu. Aqui o atributo já foi escrito antes do ouvinte, então a guarda
  // nunca dispara; ela existe para que as cinco stacks digam a MESMA coisa.
  if (onOpenChange) {
    let lastReported = root.open;
    root.addEventListener('toggle', () => {
      if (root.open === lastReported) return;
      lastReported = root.open;
      onOpenChange(root.open);
    });
  }

  return root;
}
