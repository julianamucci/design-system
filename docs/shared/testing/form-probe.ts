/**
 * Sonda de comparação do Form entre as stacks.
 *
 * O Form é o único componente do design system cujo produto NÃO é o que se vê:
 * o que ele entrega é a costura entre rótulo, controle, texto de apoio e
 * mensagem de erro — e essa costura só existe em atributo. Um campo pode estar
 * perfeito na tela e mudo no leitor de tela, e nenhuma foto do Chromatic acusa.
 *
 * Por isso toda medida aqui é de ASSOCIAÇÃO RESOLVIDA, nunca de atributo
 * presente. A distinção não é teórica: na rodada do textarea a story passava um
 * id para `aria-describedby`, a asserção conferia o ATRIBUTO, e o elemento
 * apontado não existia — o leitor não anunciava erro nenhum e a suíte ficou
 * verde. Aqui `alvoDescribedbyExiste: false` é o achado.
 *
 * A busca é pelo contrato `.nds-*` / `data-slot`. Onde o contrato não é
 * cumprido o campo vem `null` — e isso É o achado, não falha da medição.
 *
 * Armadilhas já pagas, herdadas dos colhedores anteriores:
 *
 *   - `console.log` não chega ao terminal (o addon instrumenta o console dentro
 *     da play). O canal é a exceção — ver `reportarSondaForm`.
 *   - ler estilo logo após trocar de tema devolve o PRIMEIRO QUADRO da
 *     transição. Todo acesso a cor passa por `semTransicao`.
 *   - atributo de presença casa valor `"false"`: `[data-error]` casaria
 *     `data-error="false"`. Os seletores usam `:not([attr="false"])`.
 *   - contraste é aritmética, não olhômetro, e o fundo do container costuma ter
 *     alfa. `razao`/`fundoEfetivo` de `cor.ts` fazem a composição.
 */

import { fundoEfetivo, ligarTemaEscuro, razao, semTransicao, type Contraste } from './cor';

export type { Contraste };
export { ligarTemaEscuro, semTransicao };

// ─── Seletores do contrato ────────────────────────────────────────────────────

export const SELETOR_CAMPO = '[data-slot="field"], .nds-form-field';
export const SELETOR_ROTULO = '[data-slot="label"], .nds-form-label';
export const SELETOR_DESCRICAO = '[data-slot="field-description"], .nds-form-description';
export const SELETOR_ERRO = '[data-slot="field-error"], .nds-form-error';
export const SELETOR_FIELDSET = '[data-slot="fieldset"], .nds-form-fieldset';
export const SELETOR_LEGENDA = '[data-slot="fieldset-legend"], .nds-form-legend';

/**
 * O controle do campo, na ordem que o próprio Form usa para achá-lo.
 *
 * Os `data-slot` compostos vêm ANTES dos elementos nativos de propósito:
 * checkbox, switch e select desta família renderizam um `<input>` escondido
 * para participar do formulário, e ele casaria com `input` antes do controle
 * de verdade.
 */
const SELETORES_CONTROLE = [
  '[data-slot="input-group-control"]',
  '[data-slot="checkbox"]',
  '[data-slot="switch"]',
  '[data-slot="select-trigger"]',
  '[data-slot="slider"]',
  'input:not([type="hidden"])',
  'textarea',
  'select',
];

export function controleDe(campo: HTMLElement): HTMLElement | null {
  for (const seletor of SELETORES_CONTROLE) {
    const achado = campo.querySelector<HTMLElement>(seletor);
    if (achado) return achado;
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const texto = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

const classes = (el: Element | null | undefined): string[] =>
  (el?.getAttribute('class') || '').split(/\s+/).filter(Boolean);

/** Classe sem o prefixo do design system: inerte, não pinta nada. */
const inertes = (el: Element | null | undefined): string[] =>
  classes(el).filter((c) => !c.startsWith('nds-'));

/**
 * Nome acessível pela ordem que o leitor usa.
 *
 * `null` é campo sem nome — o defeito que a associação rótulo↔controle existe
 * para impedir, e o que separa "tem um `for`" de "o leitor lê o rótulo".
 */
export function nomeAcessivel(el: Element | null | undefined): string | null {
  if (!el) return null;
  const rotulado = el.getAttribute('aria-labelledby');
  if (rotulado) {
    const alvo = el.ownerDocument.getElementById(rotulado.split(/\s+/)[0]);
    if (alvo?.textContent?.trim()) return alvo.textContent.trim();
  }
  const rotulo = el.getAttribute('aria-label');
  if (rotulo?.trim()) return rotulo.trim();
  const id = el.getAttribute('id');
  if (id) {
    const label = el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const dentro = el.closest('label');
  if (dentro?.textContent?.trim()) return dentro.textContent.trim();
  // Último degrau: os elementos cujo NOME é o próprio conteúdo. Sem ele o botão
  // de envio de um formulário saía `null` numa lista em que todo campo tinha
  // nome — um falso achado, porque `<button>Salvar</button>` é nomeado.
  // `<input>` fica de fora de propósito: o valor digitado não é nome.
  if (el.matches('button, [role="button"], a[href], [role="link"], summary')) {
    const proprio = el.textContent?.trim().replace(/\s+/g, ' ');
    if (proprio) return proprio;
  }
  return null;
}

/**
 * Resolve `aria-describedby` em ELEMENTOS, não em ids.
 *
 * `presentes` é o que o leitor de tela realmente vai ler. `orfaos` é o defeito
 * que passa por qualquer asserção de atributo: id escrito, alvo inexistente.
 */
export function descricaoResolvida(controle: HTMLElement | null) {
  const bruto = controle?.getAttribute('aria-describedby') ?? null;
  if (!controle || !bruto) {
    return { atributo: bruto, ids: [] as string[], presentes: [] as string[], orfaos: [] as string[] };
  }
  const ids = bruto.split(/\s+/).filter(Boolean);
  const presentes: string[] = [];
  const orfaos: string[] = [];
  for (const id of ids) {
    const alvo = controle.ownerDocument.getElementById(id);
    if (alvo) presentes.push(texto(alvo) ?? '');
    else orfaos.push(id);
  }
  return { atributo: bruto, ids, presentes, orfaos };
}

/**
 * A mensagem de erro é ANUNCIADA?
 *
 * Não basta existir e estar vermelha. Só é anunciada se estiver numa região
 * viva — `aria-live` no próprio elemento ou num ancestral, ou um `role` que já
 * seja região viva por definição.
 */
export function regiaoViva(el: HTMLElement | null) {
  if (!el) return null;
  const proprio = el.getAttribute('aria-live');
  const papel = el.getAttribute('role');
  const ancestral = el.closest('[aria-live]');
  const vivoPorPapel = papel === 'alert' || papel === 'status';
  return {
    ariaLive: proprio,
    papel,
    ariaLiveHerdado: ancestral && ancestral !== el ? ancestral.getAttribute('aria-live') : null,
    /** `false` é erro que aparece na tela e não chega a quem não olha. */
    anunciada: Boolean(proprio) || vivoPorPapel || Boolean(ancestral),
  };
}

// ─── Medição de um campo ──────────────────────────────────────────────────────

export function medirCampo(raiz: HTMLElement) {
  const campo = raiz.matches(SELETOR_CAMPO)
    ? raiz
    : raiz.querySelector<HTMLElement>(SELETOR_CAMPO);
  if (!campo) return { presente: false } as const;

  const rotulo = campo.querySelector<HTMLLabelElement>(SELETOR_ROTULO);
  const controle = controleDe(campo);
  const descricao = campo.querySelector<HTMLElement>(SELETOR_DESCRICAO);
  const erro = campo.querySelector<HTMLElement>(SELETOR_ERRO);

  const cs = getComputedStyle(campo);
  const fundo = fundoEfetivo(campo);

  const descrito = descricaoResolvida(controle);
  const idsDescritos = new Set(descrito.ids);

  return {
    presente: true,
    estrutura: {
      tag: campo.tagName.toLowerCase(),
      dataSlot: campo.getAttribute('data-slot'),
      temClasseBase: classes(campo).includes('nds-form-field'),
      classesInertes: inertes(campo),
      /** Ordem visual das peças: rótulo, controle, apoio, erro. */
      ordem: Array.from(campo.children).map(
        (c) => c.getAttribute('data-slot') ?? c.tagName.toLowerCase(),
      ),
      temRotulo: Boolean(rotulo),
      temControle: Boolean(controle),
      temDescricao: Boolean(descricao),
      temErro: Boolean(erro),
    },
    associacao: {
      /** `for` do rótulo e `id` do controle — os dois lados do mesmo fio. */
      rotuloFor: rotulo?.getAttribute('for') ?? null,
      controleId: controle?.id || null,
      /** `null` quando falta um dos lados; `true` só quando o fio fecha. */
      forCasaComId:
        rotulo && controle ? (rotulo.getAttribute('for') || null) === (controle.id || null) : null,
      /** O rótulo ENVOLVE o controle — a outra forma válida de associar. */
      rotuloEnvolve: rotulo && controle ? rotulo.contains(controle) : null,
      /** O que o leitor de tela realmente anuncia como nome do campo. */
      nomeAcessivel: nomeAcessivel(controle),
      idGerado: Boolean(controle?.id && !controle.getAttribute('data-id-escrito')),
      textoDoRotulo: texto(rotulo),
    },
    apoio: {
      texto: texto(descricao),
      id: descricao?.id || null,
      /** Visível e mudo é o defeito: existe na tela, fora do describedby. */
      noDescribedby: descricao ? idsDescritos.has(descricao.id) : null,
      classesInertes: inertes(descricao),
      tag: descricao?.tagName.toLowerCase() ?? null,
    },
    erro: {
      texto: texto(erro),
      id: erro?.id || null,
      noDescribedby: erro ? idsDescritos.has(erro.id) : null,
      viva: regiaoViva(erro),
      classesInertes: inertes(erro),
      tag: erro?.tagName.toLowerCase() ?? null,
    },
    controle: controle
      ? {
          tag: controle.tagName.toLowerCase(),
          dataSlot: controle.getAttribute('data-slot'),
          ariaInvalid: controle.getAttribute('aria-invalid'),
          ariaRequired: controle.getAttribute('aria-required'),
          required: (controle as HTMLInputElement).required ?? null,
          desabilitado: (controle as HTMLInputElement).disabled ?? null,
          describedby: descrito,
        }
      : null,
    rotulo: rotulo
      ? {
          /** `data-error` é o gancho que pinta o rótulo de destructive. */
          dataError: rotulo.getAttribute('data-error'),
          /** Marcado de erro DE VERDADE — `"false"` não conta. */
          marcadoComErro: rotulo.matches('[data-error]:not([data-error="false"])'),
          cor: getComputedStyle(rotulo).color,
          peso: getComputedStyle(rotulo).fontWeight,
          tamanho: getComputedStyle(rotulo).fontSize,
        }
      : null,
    geometria: {
      /** O ritmo interno do campo — 6px pelo contrato (`--spacing-1-5`). */
      espacoEntrePecas: Math.round(parseFloat(cs.rowGap || '0')),
      direcao: cs.flexDirection,
      display: cs.display,
      largura: Math.round(campo.getBoundingClientRect().width),
    },
    contraste: {
      rotulo: rotulo && fundo ? razao(getComputedStyle(rotulo).color, fundo) : null,
      apoio: descricao && fundo ? razao(getComputedStyle(descricao).color, fundo) : null,
      erro: erro && fundo ? razao(getComputedStyle(erro).color, fundo) : null,
    },
  };
}

// ─── Medição de um agrupamento ────────────────────────────────────────────────

export function medirFieldset(raiz: HTMLElement) {
  const grupo = raiz.matches(SELETOR_FIELDSET)
    ? raiz
    : raiz.querySelector<HTMLElement>(SELETOR_FIELDSET);
  if (!grupo) return { presente: false } as const;

  const legenda = grupo.querySelector<HTMLElement>(SELETOR_LEGENDA);
  const cs = getComputedStyle(grupo);
  const fundo = fundoEfetivo(grupo);

  return {
    presente: true,
    estrutura: {
      /** `<div>` com um título por cima parece igual e não anuncia grupo nenhum. */
      tag: grupo.tagName.toLowerCase(),
      nativo: grupo.tagName === 'FIELDSET',
      dataSlot: grupo.getAttribute('data-slot'),
      classesInertes: inertes(grupo),
      legendaTag: legenda?.tagName.toLowerCase() ?? null,
      legendaNativa: legenda?.tagName === 'LEGEND',
      /** A legenda tem que ser o PRIMEIRO filho; senão não rotula o grupo. */
      legendaPrimeira: legenda ? grupo.firstElementChild === legenda : null,
      texto: texto(legenda),
      campos: grupo.querySelectorAll(SELETOR_CAMPO).length,
    },
    semantica: {
      /** O que o leitor anuncia antes de cada campo do grupo. */
      nomeDoGrupo: nomeAcessivel(grupo) ?? texto(legenda),
      papel: grupo.getAttribute('role'),
    },
    geometria: {
      /** 16px pelo contrato (`--spacing-4`). */
      espacoEntreCampos: Math.round(parseFloat(cs.rowGap || '0')),
      direcao: cs.flexDirection,
      borda: cs.borderTopWidth,
      padding: cs.paddingTop,
      margem: cs.marginTop,
    },
    contraste: {
      legenda: legenda && fundo ? razao(getComputedStyle(legenda).color, fundo) : null,
    },
  };
}

// ─── Ordem de tabulação ───────────────────────────────────────────────────────

/**
 * Os controles alcançáveis por Tab, na ordem em que o teclado os visita.
 *
 * Sem `tabindex` positivo em jogo, essa ordem é a do DOM — e é exatamente isso
 * que o contrato afirma. Devolve o nome ACESSÍVEL de cada um: uma ordem certa
 * de campos anônimos não é uma ordem útil.
 */
export function ordemDeTabulacao(raiz: HTMLElement) {
  const focalizaveis = Array.from(
    raiz.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
  return focalizaveis.map((el) => ({
    nome: nomeAcessivel(el),
    tag: el.tagName.toLowerCase(),
    tabindex: el.getAttribute('tabindex'),
  }));
}

/**
 * O primeiro campo inválido do formulário — para onde o foco deve ir no envio.
 *
 * `null` quando não há nenhum, o que é o estado válido. A story compara o foco
 * DEPOIS do envio com o que esta função aponta ANTES.
 */
export function primeiroInvalido(raiz: HTMLElement): HTMLElement | null {
  return raiz.querySelector<HTMLElement>('[aria-invalid="true"], :invalid:not(form)');
}

// ─── Tema escuro ──────────────────────────────────────────────────────────────

/**
 * Contraste do rótulo, do apoio e do erro nos DOIS modos.
 *
 * O axe do test-runner mede só o que está na tela, e a tela está sempre no tema
 * claro — metade do produto ficava sem medição enquanto o contrato afirmava
 * "4.5:1 em todos os temas". A classe sai no `finally`: deixá-la posta envenena
 * a story seguinte e a foto do Chromatic.
 */
export function contrastesNosDoisModos(raiz: HTMLElement) {
  const medir = (modo: 'claro' | 'escuro') => {
    const m = medirCampo(raiz);
    if (!m.presente) return null;
    return {
      modo,
      rotulo: m.contraste.rotulo?.razao ?? null,
      apoio: m.contraste.apoio?.razao ?? null,
      erro: m.contraste.erro?.razao ?? null,
    };
  };

  const campo = raiz.matches(SELETOR_CAMPO) ? raiz : raiz.querySelector<HTMLElement>(SELETOR_CAMPO);
  const claro = medir('claro');
  const desfazer = ligarTemaEscuro(raiz.ownerDocument);
  let escuro: ReturnType<typeof medir> = null;
  try {
    escuro = campo ? semTransicao(campo, () => medir('escuro')) : medir('escuro');
  } finally {
    desfazer();
  }
  return [claro, escuro].filter(Boolean) as {
    modo: string; rotulo: number | null; apoio: number | null; erro: number | null;
  }[];
}

// ─── Saída ────────────────────────────────────────────────────────────────────

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest.
 */
export function reportarSondaForm(stack: string, cenario: string, dados: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(dados)}`);
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `raiz`.
 * Cenário ausente vem `null` — o achado de "esta stack não monta este caso".
 */
export function medirCenarios(raiz: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    if (!alvo) {
      registro[cenario] = null;
      continue;
    }
    registro[cenario] = alvo.matches(SELETOR_FIELDSET) ? medirFieldset(alvo) : medirCampo(alvo);
  }
  return registro;
}
