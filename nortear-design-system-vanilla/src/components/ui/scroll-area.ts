// ─── ScrollArea — Vanilla factory standalone ────────────────────────────────
// Visual: classes .nds-scroll-area + .nds-scroll-area-viewport (standalone).
//
// A barra é a NATIVA do navegador, de propósito: o que ela entrega de graça é
// arrasto do pegador, roda do mouse, teclado (setas, PageUp/PageDown, Home/End)
// e inércia de toque, tudo com a aparência do sistema operacional.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';

// A altura é obrigatória: sem limite não há transbordo, e sem transbordo não há
// rolagem. `size` é a escada de janela (`--box-height-*`), e existe porque a
// alternativa praticada era cada página escolher o próprio número em `style`
// inline. O degrau vai para `data-size` na RAIZ, que é onde a folha compartilhada
// resolve `block-size`; o viewport já é `height: 100%` por ela, então não há
// medida a repetir aqui. Altura fora da escada continua possível pela custom
// property `--box-height`, que a folha governa.
export type ScrollAreaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ScrollAreaOptions = {
  size?: ScrollAreaSize;
  width?: string;
  /**
   * Nome acessível da região rolável. SEM PADRÃO, de propósito.
   *
   * O design system não tem como saber o que rola aqui — este é o container
   * genérico, e o nome é do CONTEÚDO que quem monta pôs dentro. Um padrão
   * genérico ("Área de rolagem") anunciaria sem informar: quem chegou por Tab
   * já sabe que rola, o que não sabe é onde entrou. Sem nome NÃO emitimos papel
   * nenhum: `aria-label` em elemento sem papel é atributo proibido, e o axe
   * acusa `aria-prohibited-attr`.
   *
   * `role="group"` e NÃO `region`, e esta escolha MUDOU — medida, não herdada.
   * Até aqui esta fábrica emitia `region`, e três das cinco stacks não emitiam
   * nome nenhum. `region` é papel de MARCO: a especificação pede que ele fique
   * reservado a seções que a pessoa vá querer navegar diretamente, e um viewport
   * que rola é recurso de layout, não seção de conteúdo. Três medidas decidiram:
   *
   * 1. o próprio conteúdo compartilhado deste componente já ensinava o contrário
   *    (`accessibility.aria.label` manda pôr o `aria-label` no container PAI
   *    quando o ScrollArea define uma região) — implementação e documentação
   *    discordavam, e quem estava certo era a documentação;
   * 2. este é o primitivo mais repetido do sistema, e só as stories de
   *    composição nomeiam cinco instâncias — cinco marcos onde não há cinco
   *    seções;
   * 3. a story de composição põe uma área nomeada DENTRO de um `<nav>` que já
   *    carrega nome, o que produzia marco dentro de marco descrevendo o mesmo
   *    conteúdo.
   *
   * O prejuízo também é assimétrico: `group` de menos custa só a entrada na
   * lista de marcos, e o nome continua sendo anunciado ao focar; `region` de
   * mais suja a navegação por marcos, que é mecanismo primário de quem lê
   * ouvindo, e quem consome não tinha como desligar. Quem quiser marco de
   * verdade envolve a área num `<section>` ou `<nav>` nomeado — que é
   * exatamente o que a documentação já manda e o que as stories já fazem.
   *
   * Quando a página tem mais de uma área nomeada, os nomes precisam ser
   * DISTINTOS: dois grupos de mesmo nome são indistinguíveis para quem navega
   * ouvindo.
   */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  label?: string;
  class?: string;
  children?: HTMLElement;
};

// ─── createScrollArea ─────────────────────────────────────────────────────────

export function createScrollArea(options: ScrollAreaOptions = {}): HTMLElement {
  const { size, width, children } = options;

  // `label` continua aceito como apelido do nome acessível; o canônico vence.
  const label = options['aria-label'] ?? options.label;

  const root = document.createElement('div');
  root.dataset.slot = 'scroll-area';
  root.className = cn('nds-scroll-area', options.class);
  if (size) root.dataset.size = size;
  if (width) root.style.width = width;

  const viewport = document.createElement('div');
  viewport.dataset.slot = 'scroll-area-viewport';
  viewport.className = 'nds-scroll-area-viewport';
  // Scrollable regions must be keyboard focusable (WCAG SC 2.1.1).
  viewport.setAttribute('tabindex', '0');
  if (label) {
    viewport.setAttribute('role', 'group');
    viewport.setAttribute('aria-label', label);
  }
  if (children) viewport.appendChild(children);

  root.appendChild(viewport);
  return root;
}
