/**
 * Sonda de comparação do Alert Dialog entre as cinco stacks.
 *
 * Passo padrão da auditoria (quality 2f1): medir as cinco de uma vez, com o
 * mesmo colhedor, antes de corrigir qualquer coisa.
 *
 * O alert dialog é o irmão do dialog para decisões sem volta, e as três coisas
 * que o separam são invisíveis num screenshot: `role="alertdialog"`, clique fora
 * que NÃO dispensa, e o foco pousando na saída segura. Nenhuma delas aparece a
 * olho nu, e todas moram em camadas diferentes (lib headless, CSS, ordem do
 * DOM) — que é exatamente o feitio da divergência que sobrevive entre stacks.
 *
 * O painel é PORTALADO para o `body`, então o colhedor procura no documento e
 * não no canvas da story.
 */

function texto(el: Element | null): string {
  return (el?.textContent ?? '').trim().replace(/\s+/g, ' ');
}

/** Como o leitor identifica o elemento focado: slot, papel e nome. */
function describeFocus(doc: Document) {
  const el = doc.activeElement as HTMLElement | null;
  if (!el || el === doc.body) return { slot: null, tag: 'body', texto: '' };
  return {
    slot: el.getAttribute('data-slot'),
    tag: el.tagName.toLowerCase(),
    texto: texto(el).slice(0, 40),
  };
}

function caixa(el: HTMLElement | null) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    largura: Math.round(r.width),
    raio: cs.borderRadius,
    padding: cs.padding,
    background: cs.backgroundColor,
    zIndex: cs.zIndex,
  };
}

export function panelOpen(doc: Document): HTMLElement | null {
  return doc.querySelector<HTMLElement>('.nds-alert-dialog-content');
}

/**
 * Estrutura e semântica do painel aberto.
 *
 * `aria-labelledby` e `aria-describedby` são medidos por RESOLUÇÃO, não por
 * presença: apontar para um id que não existe é o defeito clássico dessa dupla,
 * e ele passa por qualquer verificação de "tem o atributo".
 */
export function measureAlertDialog(doc: Document) {
  const painel = panelOpen(doc);
  if (!painel) return { finding: false as const };

  const overlay = doc.querySelector<HTMLElement>('.nds-alert-dialog-overlay');
  const titulo = painel.querySelector<HTMLElement>('.nds-alert-dialog-title');
  const descricao = painel.querySelector<HTMLElement>('.nds-alert-dialog-description');
  const media = painel.querySelector<HTMLElement>('.nds-alert-dialog-media');
  const rodape = painel.querySelector<HTMLElement>('.nds-alert-dialog-footer');
  const cancelar = painel.querySelector<HTMLElement>('[data-slot="alert-dialog-cancel"]');
  const acao = painel.querySelector<HTMLElement>('[data-slot="alert-dialog-action"]');

  const labelled = painel.getAttribute('aria-labelledby');
  const described = painel.getAttribute('aria-describedby');

  /** Ordem no DOM dos botões do rodapé — é ela que o Tab e o leitor seguem. */
  const footerOrder = rodape
    ? Array.from(rodape.querySelectorAll<HTMLElement>('[data-slot]'))
        .map((b) => b.getAttribute('data-slot'))
        .join(' > ')
    : null;

  return {
    finding: true as const,
    semantica: {
      papel: painel.getAttribute('role'),
      modal: painel.getAttribute('aria-modal'),
      /** Resolve? `sim` só quando o id existe no documento. */
      labelledBy: labelled ? (doc.getElementById(labelled) ? 'resolve' : 'quebrado') : 'ausente',
      describedBy: described ? (doc.getElementById(described) ? 'resolve' : 'quebrado') : 'ausente',
      /**
       * Heading é PAPEL, não tag. O bits emite `<div role="heading" aria-level>`,
       * que o leitor anuncia igual a um `<h2>` — medir só a tag reportava
       * divergência semântica onde não há. Mesma armadilha da sonda do accordion.
       */
      tituloComoHeading: (() => {
        if (!titulo) return null;
        const tag = titulo.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) return `heading ${tag[1]} (${tag})`;
        if (titulo.getAttribute('role') === 'heading') {
          return `heading ${titulo.getAttribute('aria-level') ?? '?'} (${tag})`;
        }
        return `sem heading (${tag})`;
      })(),
      tagDaDescricao: descricao?.tagName.toLowerCase() ?? null,
      /** O ícone repete o título: tem que ficar fora da árvore de acessibilidade. */
      mediaEscondida: media ? (media.getAttribute('aria-hidden') ?? 'não') : 'sem media',
      estadoDoPainel: painel.getAttribute('data-state')
        ?? (painel.hasAttribute('data-open') ? 'open' : null),
      estadoDoOverlay: overlay
        ? overlay.getAttribute('data-state') ?? (overlay.hasAttribute('data-open') ? 'open' : null)
        : 'sem overlay',
    },
    estrutura: {
      footerOrder,
      textoDoCancelar: texto(cancelar),
      textoDaAcao: texto(acao),
      /** Rótulo acessível de qualquer botão de fechar sem texto. */
      rotuloDeFechar: (() => {
        const x = painel.querySelector<HTMLElement>(
          '[data-slot$="-close"], [aria-label][data-slot*="close"]',
        );
        return x ? x.getAttribute('aria-label') ?? texto(x) : 'sem botão X';
      })(),
      temMedia: media ? 'sim' : 'não',
    },
    geometria: {
      painel: caixa(painel),
      overlay: overlay
        ? { background: getComputedStyle(overlay).backgroundColor, zIndex: getComputedStyle(overlay).zIndex }
        : null,
      /** Em coluna manda `align-items`; em linha, `justify-content`. */
      rodape: rodape
        ? {
            direcao: getComputedStyle(rodape).flexDirection,
            justifica: getComputedStyle(rodape).justifyContent,
            espaco: getComputedStyle(rodape).gap,
          }
        : null,
    },
    focus: describeFocus(doc),
  };
}

/** Instantâneo curto para os passos de comportamento (fora, Escape, fechar). */
export function dialogoState(doc: Document) {
  return {
    isOpen: panelOpen(doc) !== null,
    focus: describeFocus(doc),
  };
}

/** Canal de saída: o console da play não chega ao terminal do vitest. */
export function reportAlertDialog(stack: string, cenario: string, dados: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(dados)}`);
}
