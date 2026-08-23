/**
 * Sonda de comparação do Accordion entre as quatro stacks.
 *
 * Passo padrão da auditoria (quality 2f1): medir as quatro de uma vez, com o
 * mesmo colhedor, antes de corrigir qualquer coisa.
 *
 * O accordion é um componente de DISCLOSURE: o que ele promete é que o gatilho
 * anuncie o estado, que o painel seja alcançável e que abrir um não deixe o
 * outro num limbo. Quase tudo isso é atributo ARIA — e atributo é exatamente o
 * que diverge em silêncio entre libs headless.
 */

import { contraste } from './alert-probe';

function text(el: Element | null): string {
  return (el?.textContent ?? '').trim().replace(/\s+/g, ' ');
}

function box(el: HTMLElement | null) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    height: Math.round(r.height),
    padding: cs.padding,
    background: cs.backgroundColor,
    cor: cs.color,
    pesoDaFonte: cs.fontWeight,
    tamanhoDaFonte: cs.fontSize,
    cursor: cs.cursor,
  };
}

/** Fundo composto: o painel costuma ser transparente sobre o card. */
function backgroundEffective(el: HTMLElement): string {
  let current: HTMLElement | null = el;
  while (current) {
    const cor = getComputedStyle(current).backgroundColor;
    const alfa = Number((cor.match(/-?[\d.]+/g) ?? [])[3] ?? 1);
    if (cor !== 'rgba(0, 0, 0, 0)' && alfa >= 1) return cor;
    current = current.parentElement;
  }
  return 'rgb(255, 255, 255)';
}

export function measureAccordion(root: HTMLElement) {
  const triggers = Array.from(root.querySelectorAll<HTMLElement>('.nds-accordion-trigger'));
  const first = triggers[0] ?? null;
  const conteudos = Array.from(root.querySelectorAll<HTMLElement>('.nds-accordion-content'));
  const items = Array.from(root.querySelectorAll<HTMLElement>('.nds-accordion-item'));
  const chevron = first?.querySelector<HTMLElement>('svg') ?? null;

  // Quem está aberto: o painel visível, não o que o data-state diz — atributo é
  // promessa, altura é entrega.
  const abertos = conteudos.filter((c) => c.getBoundingClientRect().height > 0).length;

  const background = first ? backgroundEffective(first) : 'rgb(255, 255, 255)';

  return {
    finding: triggers.length > 0,
    estrutura: {
      root: root.querySelector('.nds-accordion') ? '.nds-accordion' : null,
      items: items.length,
      triggers: triggers.length,
      conteudos: conteudos.length,
      abertos,
      /**
       * O gatilho precisa estar dentro de um HEADING para o leitor listar — e
       * heading é PAPEL, não tag. O bits emite <div role="heading" aria-level>,
       * que o leitor anuncia igual a um <h3>: medir a tag reportava divergência
       * onde a semântica é a mesma. Aconteceu nesta sonda.
       */
      papelDoEnvoltorio: (() => {
        const parent = first?.parentElement;
        if (!parent) return null;
        const tag = parent.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) return 'heading ' + tag[1];
        if (parent.getAttribute('role') === 'heading') return 'heading ' + (parent.getAttribute('aria-level') ?? '?');
        return tag;
      })(),
      tagDoGatilho: first?.tagName.toLowerCase() ?? null,
      tagDoConteudo: conteudos[0]?.tagName.toLowerCase() ?? null,
    },
    semantica: {
      expandido: first?.getAttribute('aria-expanded') ?? null,
      controla: first?.getAttribute('aria-controls') ? 'sim' : 'não',
      /** O painel aponta de volta para o gatilho? */
      labelledBy: conteudos[0]?.getAttribute('aria-labelledby') ? 'sim' : 'não',
      papelDoConteudo: conteudos[0]?.getAttribute('role') ?? null,
      /**
       * Estado do painel, agnóstico de lib: o base-ui marca `data-open` e
       * `data-closed`; reka, bits e a factory usam `data-state`. O CSS cobre as
       * duas convenções, e medir só uma acusava o React de não expor estado.
       */
      estadoDoConteudo: (() => {
        const c = conteudos[0];
        if (!c) return null;
        if (c.hasAttribute('data-state')) return c.getAttribute('data-state');
        if (c.hasAttribute('data-open')) return 'open';
        if (c.hasAttribute('data-closed')) return 'closed';
        return null;
      })(),
      escondidoDoConteudo: conteudos[0]?.hasAttribute('hidden') ? 'sim' : 'não',
      corpoInterno: conteudos[0]?.querySelector('.nds-accordion-content-body') ? 'sim' : 'não',
      estadoDoItem: items[0]?.getAttribute('data-state') ?? null,
      estadoDoGatilho: first?.getAttribute('data-state') ?? null,
      chevronEscondido: chevron?.getAttribute('aria-hidden') ?? null,
      tabindexDoGatilho: first?.getAttribute('tabindex') ?? null,
      textoDoPrimeiro: text(first),
    },
    geometria: {
      trigger: box(first),
      chevron: chevron
        ? {
            width: Math.round(chevron.getBoundingClientRect().width),
            transform: getComputedStyle(chevron).transform,
            transicao: getComputedStyle(chevron).transitionProperty,
          }
        : null,
      content: box(conteudos.find((c) => c.getBoundingClientRect().height > 0) ?? null),
      bordaDoItem: items[0] ? getComputedStyle(items[0]).borderBottomWidth : null,
    },
    contraste: first
      ? {
          trigger: contraste(getComputedStyle(first).color, background),
          chevron: chevron ? contraste(getComputedStyle(chevron).color, background) : null,
        }
      : null,
  };
}

/** Canal de saída: o console da play não chega ao terminal do vitest. */
export function reportAccordion(stack: string, cenario: string, root: HTMLElement) {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(measureAccordion(root))}`);
}
