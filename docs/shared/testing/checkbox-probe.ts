/**
 * Sonda de comparação da Caixa de seleção entre as cinco stacks.
 *
 * A pergunta que originou esta sonda veio da rodada do Label: `label[for]` só
 * alcança CONTROLE ROTULÁVEL do HTML (button, input, select, textarea, meter,
 * output, progress). Onde a caixa não é um deles, o par rótulo+caixa fica inerte
 * ao clique no texto — e a story antiga passava havia anos porque conferia
 * `label.htmlFor`, nunca o EFEITO.
 *
 * Por isso a medição central aqui tem DOIS eixos, e o resultado só é bom quando
 * os dois valem:
 *
 *   1. clicar no texto do rótulo ALTERNA o estado da caixa;
 *   2. clicar no texto do rótulo move o FOCO para a caixa visível.
 *
 * A sonda procura os elementos pelo contrato `.nds-*` / `data-slot`. Onde o
 * contrato não é cumprido o campo vem `null` — e isso É o achado, não falha da
 * medição.
 *
 * Armadilhas evitadas aqui (todas tropeçadas de verdade em rodadas anteriores):
 *
 *   - `console.log` não chega ao terminal: o addon do Storybook instrumenta o
 *     console dentro da `play`. O canal é a exceção — ver `reportarSonda`.
 *   - Atributo de PRESENÇA casa o valor `"false"`. `[data-indeterminate]` casa
 *     `data-indeterminate="false"`, que algumas libs emitem em todos os nós.
 *     Aqui se lê o valor, nunca só a presença.
 *   - `HTMLElement.click()` na CAIXA não move o foco (não roda os passos de
 *     foco do clique real), então usá-lo para medir "o clique foca" mediria a
 *     API, não o produto. Por isso a focabilidade da caixa é medida à parte, com
 *     `focus()`; o clique no RÓTULO, esse sim, é medido com `.click()` — ali o
 *     foco é efeito da ativação sintética do `<label>`, que é comportamento do
 *     navegador.
 *   - Toda medição é DESFEITA: o estado marcável volta ao valor anterior e o
 *     foco volta a quem o tinha. Sem isso a sonda mudaria o resultado da story
 *     seguinte e a foto do Chromatic.
 */

// ─── Vocabulário ──────────────────────────────────────────────────────────────

/** Elementos que o HTML deixa um `<label for>` alcançar. */
const ROTULAVEIS = ['button', 'input', 'meter', 'output', 'progress', 'select', 'textarea'];

const SELETOR_CAIXA = '[data-slot="checkbox"], .nds-checkbox, [role="checkbox"]';

const texto = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

const classesDe = (el: Element | null | undefined): string[] =>
  (el?.getAttribute('class') || '').split(/\s+/).filter(Boolean);

const descreverNo = (el: Element | null): string | null =>
  el ? [el.tagName.toLowerCase(), ...classesDe(el)].join('.') : null;

/** Valor do atributo, tratando presença vazia como `"true"` e `"false"` como falso. */
function presenca(el: Element | null, nome: string): boolean | null {
  if (!el) return null;
  if (!el.hasAttribute(nome)) return false;
  return el.getAttribute(nome) !== 'false';
}

// ─── Estado marcável ──────────────────────────────────────────────────────────

export type Marcado = boolean | 'mixed' | null;

/**
 * Estado da caixa como o leitor de tela o entende.
 *
 * `aria-checked` vem primeiro de propósito: é o único canal que as cinco stacks
 * emitem, e é o que a WAI-ARIA define. `data-state` e o input nativo entram só
 * como reserva, para que a sonda ainda meça uma stack que não cumpra o contrato
 * ARIA — medir o descumprimento é justamente o objetivo.
 */
export function estadoMarcado(el: Element | null): Marcado {
  if (!el) return null;
  const aria = el.getAttribute('aria-checked');
  if (aria === 'mixed') return 'mixed';
  if (aria === 'true' || aria === 'false') return aria === 'true';
  const estado = el.getAttribute('data-state');
  if (estado === 'indeterminate') return 'mixed';
  if (estado === 'checked' || estado === 'unchecked') return estado === 'checked';
  if (el instanceof HTMLInputElement && el.type === 'checkbox') {
    return el.indeterminate ? 'mixed' : el.checked;
  }
  return null;
}

/** `true` quando a caixa está desabilitada por atributo nativo OU por ARIA. */
export function estaDesabilitada(el: Element | null): boolean | null {
  if (!el) return null;
  if ((el as HTMLButtonElement).disabled === true) return true;
  return el.getAttribute('aria-disabled') === 'true';
}

/** `true` quando o foco do documento está na caixa (ou dentro dela). */
export function focoEstaNa(el: Element | null): boolean {
  if (!el) return false;
  const ativo = el.ownerDocument.activeElement;
  return ativo === el || el.contains(ativo);
}

// ─── Nome acessível ───────────────────────────────────────────────────────────

/**
 * Aproximação do nome acessível, com a ORIGEM registrada.
 *
 * A origem é o achado que interessa: duas stacks podem anunciar o mesmo texto,
 * uma pelo `aria-labelledby` que a própria story escreveu à mão e outra pela
 * associação nativa do `<label for>`. A primeira é andaime; a segunda é produto.
 */
function nomeAcessivel(caixa: Element | null) {
  if (!caixa) return { valor: null, origem: null } as const;
  const doc = caixa.ownerDocument;

  const rotuladoPor = caixa.getAttribute('aria-labelledby');
  if (rotuladoPor) {
    const partes = rotuladoPor
      .split(/\s+/)
      .map((id) => texto(doc.getElementById(id)))
      .filter(Boolean);
    if (partes.length) return { valor: partes.join(' '), origem: 'aria-labelledby' } as const;
  }

  const rotulo = caixa.getAttribute('aria-label');
  if (rotulo) return { valor: rotulo, origem: 'aria-label' } as const;

  const id = caixa.getAttribute('id');
  if (id) {
    const associado = doc.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
    if (associado) {
      // `for` apontando para elemento NÃO rotulável não nomeia nada: o
      // navegador ignora a associação, e o leitor de tela anuncia a caixa sem
      // nome. Registrar "label[for]" aqui esconderia exatamente o defeito que a
      // sonda existe para achar — por isso a origem diz que a associação é nula.
      const vale = ROTULAVEIS.includes(caixa.tagName.toLowerCase());
      return vale
        ? ({ valor: texto(associado), origem: 'label[for]' } as const)
        : ({ valor: null, origem: 'label[for] inerte (caixa não é rotulável)' } as const);
    }
  }

  const ancestral = caixa.closest('label');
  if (ancestral) return { valor: texto(ancestral), origem: 'label ancestral' } as const;

  const proprio = texto(caixa);
  if (proprio) return { valor: proprio, origem: 'conteúdo' } as const;

  return { valor: null, origem: null } as const;
}

/**
 * Ordem em que um leitor de tela anuncia a caixa.
 *
 * Não é a fala literal de um leitor específico — é a ORDEM dos canais que todos
 * eles percorrem (nome, papel, estado, obrigatoriedade, validade, desabilitado).
 * O que a sonda compara entre stacks é a presença e a sequência, não o texto.
 */
function ordemDeLeitura(caixa: Element | null): string[] {
  if (!caixa) return [];
  const partes: string[] = [];
  const nome = nomeAcessivel(caixa).valor;
  if (nome) partes.push(`nome:${nome}`);
  partes.push(`papel:${caixa.getAttribute('role') ?? caixa.tagName.toLowerCase()}`);
  const marcado = estadoMarcado(caixa);
  partes.push(`estado:${marcado === null ? 'ausente' : String(marcado)}`);
  if (caixa.getAttribute('aria-required') === 'true' || (caixa as HTMLInputElement).required) {
    partes.push('obrigatório');
  }
  if (caixa.getAttribute('aria-invalid') === 'true') partes.push('inválido');
  if (caixa.getAttribute('aria-readonly') === 'true') partes.push('somente leitura');
  if (estaDesabilitada(caixa)) partes.push('desabilitado');
  return partes;
}

// ─── Medição do clique no rótulo ──────────────────────────────────────────────

/**
 * A pergunta inteira desta sonda: clicar no TEXTO do rótulo foca e alterna?
 *
 * `HTMLElement.click()` no `<label>` executa a ativação sintética que o
 * navegador define para o elemento — é o caminho do produto, não uma simulação
 * da biblioteca de teste, e por isso responde pelo que o usuário vê.
 *
 * Tudo é restaurado no fim.
 */
function aoClicarNoRotulo(rotulo: HTMLElement | null, caixa: Element | null) {
  if (!rotulo) return { focou: null, focoFoiPara: null, alternou: null, erro: 'sem rótulo' };

  const doc = rotulo.ownerDocument;
  const focoAnterior = doc.activeElement as HTMLElement | null;
  const antes = estadoMarcado(caixa);

  let focou: boolean | null = null;
  let focoFoiPara: string | null = null;
  let alternou: boolean | null = null;
  let erro: string | null = null;

  try {
    rotulo.click();
    focou = focoEstaNa(caixa);
    focoFoiPara = descreverNo(doc.activeElement);
    const depois = estadoMarcado(caixa);
    alternou = antes === null ? null : depois !== antes;
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  // Desfaz: devolve a caixa ao estado original e o foco a quem o tinha.
  if (antes !== null && estadoMarcado(caixa) !== antes) (caixa as HTMLElement).click();
  if (focoAnterior && focoAnterior !== doc.body) focoAnterior.focus();
  else (doc.activeElement as HTMLElement | null)?.blur?.();

  return { focou, focoFoiPara, alternou, erro };
}

/** Clicar na própria caixa alterna? (o foco do clique real é medido à parte) */
function aoClicarNaCaixa(caixa: Element | null) {
  if (!caixa) return { alternou: null, erro: 'sem caixa' };
  const antes = estadoMarcado(caixa);
  let alternou: boolean | null = null;
  let erro: string | null = null;
  try {
    (caixa as HTMLElement).click();
    const depois = estadoMarcado(caixa);
    alternou = antes === null ? null : depois !== antes;
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }
  if (antes !== null && estadoMarcado(caixa) !== antes) (caixa as HTMLElement).click();
  return { alternou, erro };
}

/** A caixa aceita foco programático, e sobra foco visível? */
function focabilidade(caixa: Element | null) {
  if (!caixa) return { aceitaFoco: null, anelDeFoco: null };
  const doc = caixa.ownerDocument;
  const focoAnterior = doc.activeElement as HTMLElement | null;
  (caixa as HTMLElement).focus?.();
  const aceitaFoco = doc.activeElement === caixa;
  let anelDeFoco: boolean | null = null;
  if (aceitaFoco) {
    const cs = getComputedStyle(caixa);
    anelDeFoco = cs.outlineStyle !== 'none' || cs.boxShadow !== 'none';
  }
  if (focoAnterior && focoAnterior !== doc.body) focoAnterior.focus();
  else (doc.activeElement as HTMLElement | null)?.blur?.();
  return { aceitaFoco, anelDeFoco };
}

/** Quem recebe o clique no centro do elemento — pega peça coberta por overlay. */
function quemRecebeOClique(el: Element | null): string | null {
  if (!el) return null;
  const caixa = el.getBoundingClientRect();
  if (caixa.width === 0 || caixa.height === 0) return null;
  const alvo = el.ownerDocument.elementFromPoint(
    caixa.left + caixa.width / 2,
    caixa.top + caixa.height / 2,
  );
  return descreverNo(alvo);
}

// ─── Medição ──────────────────────────────────────────────────────────────────

/** Mede UMA caixa e o rótulo que a rotula. `raiz` é o wrapper do cenário. */
export function medirCaixa(raiz: HTMLElement) {
  const caixa = raiz.querySelector<HTMLElement>(SELETOR_CAIXA);
  if (!caixa) return { presente: false } as const;

  const doc = caixa.ownerDocument;
  const classes = classesDe(caixa);
  const cs = getComputedStyle(caixa);
  const retangulo = caixa.getBoundingClientRect();

  const rotulo =
    raiz.querySelector<HTMLLabelElement>('label[data-slot="label"]') ??
    raiz.querySelector<HTMLLabelElement>('label');

  const htmlFor = rotulo?.getAttribute('for') ?? null;
  const alvoDoFor = htmlFor ? doc.getElementById(htmlFor) : null;

  const indicador = caixa.querySelector<HTMLElement>(
    '[data-slot="checkbox-indicator"], .nds-checkbox-indicator',
  );
  const inputEscondido = raiz.querySelector<HTMLInputElement>('input[type="checkbox"]');

  return {
    presente: true,

    // ── Estrutura: é rotulável pelo HTML? é aí que o defeito nasce ────────────
    caixa: {
      tag: caixa.tagName.toLowerCase(),
      /** O eixo do defeito: `label[for]` só alcança elemento rotulável. */
      ehRotulavelPeloHtml: ROTULAVEIS.includes(caixa.tagName.toLowerCase()),
      type: caixa.getAttribute('type'),
      role: caixa.getAttribute('role'),
      id: caixa.getAttribute('id'),
      dataSlot: caixa.getAttribute('data-slot'),
      tabIndex: caixa.getAttribute('tabindex'),
      temClasseBase: classes.includes('nds-checkbox'),
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: classes.filter((c) => !c.startsWith('nds-')),
      largura: Math.round(retangulo.width),
      altura: Math.round(retangulo.height),
      cursor: cs.cursor,
    },

    // ── Estado tri-valorado ──────────────────────────────────────────────────
    estado: {
      ariaChecked: caixa.getAttribute('aria-checked'),
      dataState: caixa.getAttribute('data-state'),
      dataChecked: presenca(caixa, 'data-checked'),
      dataIndeterminate: presenca(caixa, 'data-indeterminate'),
      marcado: estadoMarcado(caixa),
      fundo: cs.backgroundColor,
    },

    // ── Desabilitado: atributo nativo × ARIA ─────────────────────────────────
    desabilitado: {
      atributoNativo: (caixa as HTMLButtonElement).disabled === true,
      ariaDisabled: caixa.getAttribute('aria-disabled'),
      dataDisabled: presenca(caixa, 'data-disabled'),
      efetivo: estaDesabilitada(caixa),
      opacidade: Number(cs.opacity),
    },

    // ── Contrato ARIA que o WAI-ARIA pede para role="checkbox" ───────────────
    aria: {
      ariaRequired: caixa.getAttribute('aria-required'),
      ariaInvalid: caixa.getAttribute('aria-invalid'),
      ariaReadonly: caixa.getAttribute('aria-readonly'),
      ariaLabelledby: caixa.getAttribute('aria-labelledby'),
      ariaLabel: caixa.getAttribute('aria-label'),
      ariaDescribedby: caixa.getAttribute('aria-describedby'),
    },

    nome: nomeAcessivel(caixa),
    leitura: ordemDeLeitura(caixa),

    // ── Rótulo e a associação ────────────────────────────────────────────────
    rotulo: {
      existe: !!rotulo,
      dataSlot: rotulo?.getAttribute('data-slot') ?? null,
      htmlFor,
      texto: texto(rotulo),
      alvoDoForExiste: htmlFor ? !!alvoDoFor : null,
      /** `false` aqui significa: o `for` aponta para outra coisa (input oculto). */
      alvoDoForEhACaixa: alvoDoFor ? alvoDoFor === caixa : null,
      alvoDoForTag: alvoDoFor?.tagName.toLowerCase() ?? null,
      cursor: rotulo ? getComputedStyle(rotulo).cursor : null,
      /** Ouvinte de clique escrito na story para compensar o componente. */
      temAndaimeDeClique: rotulo?.hasAttribute('data-andaime-clique') ?? null,
    },

    // ── Input nativo escondido (participação em formulário) ──────────────────
    inputEscondido: {
      existe: !!inputEscondido,
      id: inputEscondido?.getAttribute('id') ?? null,
      tabIndex: inputEscondido?.getAttribute('tabindex') ?? null,
      ariaHidden: inputEscondido?.getAttribute('aria-hidden') ?? null,
      name: inputEscondido?.getAttribute('name') ?? null,
      checked: inputEscondido?.checked ?? null,
      indeterminate: inputEscondido?.indeterminate ?? null,
      /** O `for` do rótulo caindo no input oculto é o defeito do React. */
      ehAlvoDoFor: inputEscondido ? alvoDoFor === inputEscondido : null,
    },

    // ── Indicador: traço (misto) × marca de seleção ──────────────────────────
    indicador: {
      existe: !!indicador,
      desenho: indicador?.querySelector('line')
        ? 'traço'
        : indicador?.querySelector('polyline, path')
          ? 'marca'
          : null,
      visivel: indicador ? getComputedStyle(indicador).display !== 'none' : null,
    },

    // ── OS DOIS EIXOS ────────────────────────────────────────────────────────
    cliqueNoRotulo: aoClicarNoRotulo(rotulo, caixa),
    cliqueNaCaixa: aoClicarNaCaixa(caixa),
    foco: focabilidade(caixa),

    alcance: {
      centroDaCaixa: quemRecebeOClique(caixa),
      centroDoRotulo: quemRecebeOClique(rotulo),
    },
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `raiz`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export function medirCaixas(raiz: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = alvo ? medirCaixa(alvo) : null;
  }
  return registro;
}

/**
 * O MESMO clique no rótulo, mas pelo caminho da biblioteca de teste.
 *
 * Existem dois canais e eles podem divergir: `label.click()` dispara a ativação
 * sintética que o navegador define para o `<label>`; `userEvent.click()` simula
 * a sequência de ponteiro (pointerdown → mousedown → focus → click) e tem lógica
 * própria de foco. A asserção permanente vai rodar pelo segundo — então medir só
 * o primeiro deixaria a asserção sem lastro.
 */
export async function medirCliqueDoUsuario(
  raiz: HTMLElement,
  cenarios: string[],
  clicar: (el: HTMLElement) => Promise<unknown>,
) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    const caixa = alvo?.querySelector<HTMLElement>(SELETOR_CAIXA) ?? null;
    const rotulo = alvo?.querySelector<HTMLLabelElement>('label') ?? null;
    if (!alvo || !rotulo) {
      registro[cenario] = null;
      continue;
    }
    const doc = rotulo.ownerDocument;
    const antes = estadoMarcado(caixa);
    let resultado: Record<string, unknown>;
    try {
      await clicar(rotulo);
      resultado = {
        focou: focoEstaNa(caixa),
        focoFoiPara: descreverNo(doc.activeElement),
        alternou: antes === null ? null : estadoMarcado(caixa) !== antes,
      };
    } catch (e) {
      resultado = { erro: e instanceof Error ? e.message : String(e) };
    }
    // Desfaz, para não envenenar o cenário seguinte nem a foto do Chromatic.
    if (antes !== null && estadoMarcado(caixa) !== antes) caixa?.click();
    (doc.activeElement as HTMLElement | null)?.blur?.();
    registro[cenario] = resultado;
  }
  return registro;
}

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest.
 */
export async function reportarSonda(
  stack: string,
  raiz: HTMLElement,
  cenarios: string[],
  clicar: (el: HTMLElement) => Promise<unknown>,
) {
  const registro = {
    dom: medirCaixas(raiz, cenarios),
    cliqueDoUsuario: await medirCliqueDoUsuario(raiz, cenarios, clicar),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
