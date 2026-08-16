/**
 * Sonda de comparação do Input entre as cinco stacks.
 *
 * O Input é o campo mais copiado do design system e o que mais promete por
 * escrito: a tabela de tokens diz qual token pintar, a tabela de estados diz
 * qual borda aparece em cada situação, e os `testes.*` afirmam medidas em px e
 * porcentagem. Nada disso tinha uma única asserção computada — as cinco stacks
 * verificavam presença, `type` e `aria-invalid`, e mais nada.
 *
 * A sonda procura o campo pelo contrato `.nds-*` / `data-slot`. Onde o contrato
 * não é cumprido o campo vem `null` — e isso É o achado, não falha da medição.
 *
 * Armadilhas já pagas, evitadas aqui:
 *
 *   - `console.log` não chega ao terminal (o addon instrumenta o console dentro
 *     da play). O canal é a exceção — ver `reportarSonda`.
 *   - **ler estilo logo após `focus()` devolve o PRIMEIRO QUADRO da transição.**
 *     `.nds-input` transiciona `border-color` e `box-shadow`, então o computado
 *     sai `rgba(0,0,0,0) 0px 0px 0px 0px` e um anel perfeitamente pintado parece
 *     inexistente. Todo acesso a estado passa por `semTransicao`.
 *   - `:hover` não acende por evento sintético. A sonda lê a DECLARAÇÃO da folha
 *     e manda o navegador resolver o `var()` — a medida continua sendo dele.
 *   - divergência de NOME de classe entre stacks faz o seletor não casar. A
 *     sonda registra `classesInertes` (tudo sem o prefixo `nds-`): classe morta
 *     sobrevivendo numa stack é, ela própria, o achado.
 *   - `aria-describedby` presente não quer dizer alvo existente. A sonda resolve
 *     o id: `alvoDescribedbyExiste: false` é apontar para o nada.
 *   - foco muda o estado medido; a sonda devolve o foco a quem o tinha.
 */

import {
  declaracaoDaRegra,
  fundoEfetivo,
  ligarTemaEscuro,
  razao,
  resolverCor,
  semTransicao,
} from './cor';

export type { Contraste } from './cor';
export { ligarTemaEscuro, semTransicao };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const texto = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

/** Nome acessível pela ordem que o leitor usa. `null` é campo sem nome. */
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
  return null;
}

/** O `<input>` do cenário, pelo contrato e com os degraus de fallback. */
export function campoDe(raiz: HTMLElement): HTMLInputElement | null {
  return (
    raiz.querySelector<HTMLInputElement>('input[data-slot="input"]') ??
    raiz.querySelector<HTMLInputElement>('input.nds-input') ??
    raiz.querySelector<HTMLInputElement>('input')
  );
}

// ─── Aferições reusadas pelas stories ─────────────────────────────────────────
//
// Existem para que as stories afirmem EFEITO COMPUTADO em vez de nome de classe.
// Asserção de classe passou anos verde afirmando `border-input` — um nome de
// utilitário do Tailwind, inerte desde a migração `.nds-*`.

/**
 * Altura RESULTANTE do campo, em px, e as parcelas que a produzem.
 *
 * O projeto proíbe `height` cravada em primitivo com texto (WCAG 1.4.4): a
 * altura tem que sair de `padding-block` + `line-height`, para o campo crescer
 * junto quando a pessoa aumenta a fonte do navegador. `heightCss !== 'auto'`
 * é a assinatura do defeito.
 */
export function alturaResultante(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return {
    caixa: Math.round(el.getBoundingClientRect().height),
    heightCss: cs.height,
    minHeightCss: cs.minHeight,
    paddingBloco: [cs.paddingTop, cs.paddingBottom] as const,
    alturaDeLinha: cs.lineHeight,
    tamanhoDaFonte: cs.fontSize,
    /** `true` quando a folha crava altura — o defeito que a regra proíbe. */
    alturaCravada:
      declaracaoDaRegra(el.ownerDocument, (s) => /\.nds-input(?![\w-])/.test(s), 'height') !== null,
  };
}

/**
 * Borda no repouso, no foco e — pela folha — no hover.
 *
 * O hover não acende por evento sintético, então a cor dele vem da declaração
 * da regra resolvida pelo próprio navegador. É a mesma leitura que o portão
 * `QA/Borda de Campo` faz em 6 alvos; aqui ela é só descritiva.
 */
export function bordasPorEstado(el: HTMLInputElement) {
  const doc = el.ownerDocument;
  const anterior = doc.activeElement as HTMLElement | null;

  return semTransicao(el, () => {
    const repouso = getComputedStyle(el);
    const medidaRepouso = {
      cor: repouso.borderTopColor,
      espessura: repouso.borderTopWidth,
      estilo: repouso.borderTopStyle,
      sombra: repouso.boxShadow,
    };

    el.focus();
    const foco = getComputedStyle(el);
    const medidaFoco = {
      cor: foco.borderTopColor,
      sombra: foco.boxShadow,
      contorno: `${foco.outlineWidth} ${foco.outlineStyle}`,
      casaFocusVisible: el.matches(':focus-visible'),
    };
    el.blur();
    if (anterior && anterior !== doc.body) anterior.focus();

    const declaradoHover = declaracaoDaRegra(
      doc,
      (s) => /\.nds-input:hover/.test(s),
      'border-color',
    );

    // A sonda de resolução entra no PAI: `<input>` é elemento vazio e um filho
    // apendado nele nunca é renderizado — `getComputedStyle` devolveria vazio e
    // o hover viria `null`, um falso "a regra sumiu da folha".
    const hospedeiro = (el.parentElement ?? doc.body) as HTMLElement;

    return {
      repouso: medidaRepouso,
      foco: medidaFoco,
      hover: {
        declarado: declaradoHover,
        resolvido: declaradoHover ? resolverCor(hospedeiro, declaradoHover) : null,
      },
    };
  });
}

/**
 * O halo de foco assentado, decomposto: espessura em px, alfa e cor.
 *
 * O contrato afirma "halo de 2px com 30% de opacidade" e nenhuma stack
 * verificava isso — a documentação dizia 3px e 50% havia meses. Ler o
 * `box-shadow` cru numa asserção obrigaria cada stack a repetir o mesmo regex.
 *
 * `null` quando não há halo: é o resultado esperado no campo desabilitado, e é
 * achado em qualquer outro.
 */
export function haloDeFoco(
  el: HTMLInputElement,
): { espessura: number; alfa: number; cor: string } | null {
  const sombra = bordasPorEstado(el).foco.sombra;
  if (!sombra || sombra === 'none') return null;
  const cor = /rgba?\([^)]+\)/.exec(sombra)?.[0];
  if (!cor) return null;
  // O box-shadow do campo é `<cor> 0px 0px 0px <espessura>` — o spread é o
  // quarto comprimento, e é ele que a pessoa vê como grossura do halo.
  const comprimentos = [...sombra.matchAll(/(-?[\d.]+)px/g)].map((m) => parseFloat(m[1]));
  const alfa = parseFloat(/rgba\([^)]*[,/]\s*([\d.]+)\s*\)/.exec(cor)?.[1] ?? '1');
  return { espessura: comprimentos[3] ?? 0, alfa, cor };
}

/**
 * Contraste do texto, do placeholder e da borda nos DOIS modos.
 *
 * O axe do test-runner mede só o que está na tela, e a tela está sempre no tema
 * claro — metade do produto ficava sem medição, e o item de contraste do
 * contrato dizia "verificado por axe-core" sem que ninguém rodasse nada no
 * escuro. A classe sai no `finally`: deixá-la posta envenena a story seguinte e
 * a foto do Chromatic.
 */
export function contrastesNosDoisModos(raiz: HTMLElement) {
  const campo = campoDe(raiz);
  if (!campo) return null;

  const medir = (modo: 'claro' | 'escuro') => {
    const m = medirInput(raiz);
    if (!m.presente) return null;
    return {
      modo,
      texto: m.contraste.textoNoFundo?.razao ?? null,
      placeholder: m.contraste.placeholderNoFundo?.razao ?? null,
      borda: m.contraste.bordaNoFundo?.razao ?? null,
    };
  };

  const claro = medir('claro');
  const desfazer = ligarTemaEscuro(raiz.ownerDocument);
  let escuro;
  try {
    escuro = semTransicao(campo, () => medir('escuro'));
  } finally {
    desfazer();
  }
  return [claro, escuro].filter(Boolean) as {
    modo: string; texto: number | null; placeholder: number | null; borda: number | null;
  }[];
}

/**
 * A cor que um token vira depois que o navegador resolve `var()` e o tema.
 *
 * Serve para a story afirmar "esta borda é --destructive" sem escrever um rgb
 * literal, que quebraria a cada ajuste de paleta e não valeria nos temas de
 * marca. `raiz` precisa ser um elemento que RENDERIZE — `<input>` é vazio e um
 * filho apendado nele nunca entra no layout.
 */
export function corDoToken(raiz: HTMLElement, token: string): string | null {
  const hospedeiro = raiz.tagName === 'INPUT' ? raiz.parentElement ?? raiz : raiz;
  return resolverCor(hospedeiro as HTMLElement, `hsl(var(${token}))`);
}

/** Razão WCAG entre a borda em repouso e o fundo — o alvo de 3:1 (1.4.11). */
export function contrasteDaBorda(el: HTMLElement) {
  const fundo = fundoEfetivo(el);
  if (!fundo) return null;
  return semTransicao(el, () => razao(getComputedStyle(el).borderTopColor, fundo));
}

// ─── Medição de um campo ──────────────────────────────────────────────────────

export function medirInput(raiz: HTMLElement) {
  const campo = campoDe(raiz);
  if (!campo) return { presente: false } as const;

  const classes = (campo.getAttribute('class') || '').split(/\s+/).filter(Boolean);
  const cs = getComputedStyle(campo);
  const csPlaceholder = getComputedStyle(campo, '::placeholder');
  const csBotaoDeArquivo = getComputedStyle(campo, '::file-selector-button');
  const caixa = campo.getBoundingClientRect();
  const fundo = fundoEfetivo(campo);

  const describedby = campo.getAttribute('aria-describedby');
  const alvosDescritos = describedby
    ? describedby
        .split(/\s+/)
        .map((id) => campo.ownerDocument.getElementById(id))
        .filter(Boolean)
    : [];

  return {
    presente: true,
    estrutura: {
      tag: campo.tagName.toLowerCase(),
      dataSlot: campo.getAttribute('data-slot'),
      temClasseBase: classes.includes('nds-input'),
      classes,
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: classes.filter((c) => !c.startsWith('nds-')),
      estiloInline: campo.getAttribute('style'),
      wrapper: {
        tag: raiz.firstElementChild?.tagName.toLowerCase() ?? null,
        classes: (raiz.firstElementChild?.getAttribute('class') || '').split(/\s+/).filter(Boolean),
        estiloInline: raiz.firstElementChild?.getAttribute('style') ?? null,
      },
    },
    semantica: {
      nomeAcessivel: nomeAcessivel(campo),
      /** `type` do atributo e da propriedade: divergem quando a stack não repassa. */
      typeAtributo: campo.getAttribute('type'),
      typePropriedade: campo.type,
      papel: campo.getAttribute('role'),
      placeholder: campo.getAttribute('placeholder'),
      ariaInvalid: campo.getAttribute('aria-invalid'),
      ariaRequired: campo.getAttribute('aria-required'),
      required: campo.required,
      desabilitado: campo.disabled,
      somenteLeitura: campo.readOnly,
      /** Só `readonly` continua focalizável — é o que separa os dois estados. */
      focalizavel: !campo.disabled,
      nome: campo.name || null,
      autocomplete: campo.getAttribute('autocomplete'),
      ariaDescribedby: describedby,
      alvoDescribedbyExiste: describedby
        ? alvosDescritos.length === describedby.split(/\s+/).length
        : null,
      textoDescrito: alvosDescritos.map((el) => texto(el)),
    },
    geometria: {
      largura: Math.round(caixa.width),
      ...alturaResultante(campo),
      paddingInline: [cs.paddingLeft, cs.paddingRight] as const,
      familiaDaFonte: cs.fontFamily.split(',')[0],
      raio: cs.borderTopLeftRadius,
      larguraCss: cs.width,
      displayCss: cs.display,
      boxSizing: cs.boxSizing,
    },
    estado: {
      fundo: cs.backgroundColor,
      fundoEfetivo: fundo,
      cor: cs.color,
      opacidade: cs.opacity,
      cursor: cs.cursor,
      corDoPlaceholder: csPlaceholder.color || null,
      /** `::file-selector-button` só existe em `type="file"`; nos demais vem herdado. */
      botaoDeArquivo: {
        fundo: csBotaoDeArquivo.backgroundColor || null,
        cor: csBotaoDeArquivo.color || null,
        raio: csBotaoDeArquivo.borderTopLeftRadius || null,
        espessuraDaBorda: csBotaoDeArquivo.borderTopWidth || null,
      },
      bordas: bordasPorEstado(campo),
    },
    contraste: {
      textoNoFundo: fundo ? razao(cs.color, fundo) : null,
      placeholderNoFundo: fundo && csPlaceholder.color ? razao(csPlaceholder.color, fundo) : null,
      bordaNoFundo: contrasteDaBorda(campo),
    },
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `raiz`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export function medirInputs(raiz: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = alvo ? medirInput(alvo) : null;
  }
  return registro;
}

/**
 * Mede um cenário no tema ESCURO — metade do produto que o axe do test-runner
 * nunca vê, porque a tela está sempre no claro.
 *
 * A classe sai no `finally`: deixá-la posta envenena a story seguinte e a foto
 * do Chromatic.
 */
export function medirNoEscuro(raiz: HTMLElement, cenario: string) {
  const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
  const campo = alvo ? campoDe(alvo) : null;
  if (!alvo || !campo) return null;

  const desfazer = ligarTemaEscuro(raiz.ownerDocument);
  try {
    // Trocar o tema troca `border-color`, que é propriedade em transição: sem
    // desligá-la a sonda leria a cor do tema CLARO e relataria uma borda que
    // não escurece.
    return semTransicao(campo, () => {
      const medida = medirInput(alvo);
      if (!medida.presente) return null;
      return { estado: medida.estado, contraste: medida.contraste };
    });
  } finally {
    desfazer();
  }
}

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest.
 */
export function reportarSonda(stack: string, raiz: HTMLElement, cenarios: string[]) {
  const registro = {
    claro: medirInputs(raiz, cenarios),
    escuro: medirNoEscuro(raiz, cenarios[0]),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
