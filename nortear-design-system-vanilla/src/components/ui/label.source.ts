// Snippet do painel Code do Label — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/**
 * O que as stories do Label usam.
 *
 * `className` entra porque é o nome do CONTROL da story, mas o snippet nunca o
 * imprime: a opção canônica da fábrica é `class`, e `className` sobrevive só
 * como apelido `@deprecated` para não quebrar chamador antigo. Documentação que
 * ensinasse o apelido perpetuaria o que está de saída.
 */
export type LabelSnippetOptions = {
  text?: string;
  /** id do controle associado — é o par `for`/`id` que faz o rótulo funcionar. */
  htmlFor?: string;
  class?: string;
  /** @deprecated Apelido de `class`; aceito na entrada, nunca na saída. */
  className?: string;
  /** Tipo do campo que acompanha o rótulo no exemplo. */
  type?: string;
  placeholder?: string;
  /**
   * Campo desabilitado marcado com `nds-peer`. O esmaecimento do rótulo vem da
   * folha, casando no CONTROLE irmão — o rótulo não recebe classe nenhuma.
   */
  disabled?: boolean;
};

const TEXT_DEFAULT = 'Nome completo';
const ID_DEFAULT = 'campo';

/** Linhas de `createLabel`, com o canônico `class` no lugar do apelido. */
function labelLines(o: LabelSnippetOptions, id: string, conteudo?: string): string[] {
  const classe = o.class ?? o.className;
  return opcoes([
    ['text', conteudo ? texto(conteudo) : undefined],
    ['htmlFor', texto(id)],
    ['class', classe ? texto(classe) : undefined],
  ]);
}

/**
 * A chamada real de `createLabel` com o campo que ela nomeia.
 *
 * Um rótulo sozinho não é exemplo de nada: o que o componente entrega é a
 * associação, e ela precisa dos dois lados para existir.
 */
export function labelSnippet(o: LabelSnippetOptions = {}): string {
  const id = o.htmlFor ?? ID_DEFAULT;
  const campo = opcoes([
    ['id', texto(id)],
    ['type', o.type && o.type !== 'text' ? texto(o.type) : undefined],
    ['placeholder', o.placeholder ? texto(o.placeholder) : undefined],
    ['class', o.disabled ? texto('nds-peer') : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
  ]);

  return snippet(
    [importing('label', 'createLabel'), importing('input', 'createInput')].join('\n'),
    `const rotulo = ${chamada('createLabel', labelLines(o, id, o.text ?? TEXT_DEFAULT))};`,
    `const campo = ${chamada('createInput', campo)};`,
    // Com o controle desabilitado, a ORDEM importa: a folha casa no irmão
    // marcado com `nds-peer`, e é o controle que carrega a marca.
    montar(o.disabled ? 'campo, rotulo' : 'rotulo, campo'),
  );
}

/**
 * Campo obrigatório.
 *
 * O asterisco é decorativo (`aria-hidden`) e a obrigatoriedade é anunciada pelo
 * CONTROLE, com `aria-required` — o leitor anuncia o rótulo limpo, sem falar
 * "asterisco" no meio do nome do campo.
 */
export function labelObrigatorioSnippet(o: LabelSnippetOptions = {}): string {
  const id = o.htmlFor ?? 'email';
  const conteudo = o.text ?? 'Email profissional';

  return snippet(
    [importing('label', 'createLabel'), importing('input', 'createInput')].join('\n'),
    `const rotulo = ${chamada('createLabel', labelLines(o, id))};

const marcador = document.createElement('span');
marcador.className = 'nds-text-destructive';
marcador.setAttribute('aria-hidden', 'true');
marcador.textContent = '*';
rotulo.append(${texto(conteudo)}, marcador);`,
    `const campo = ${chamada(
      'createInput',
      opcoes([
        ['id', texto(id)],
        ['type', texto(o.type ?? 'email')],
        ['placeholder', o.placeholder ? texto(o.placeholder) : undefined],
      ]),
    )};
campo.setAttribute('aria-required', 'true');`,
    montar('rotulo, campo'),
  );
}

/**
 * Bloco inteiro desabilitado.
 *
 * `data-disabled="true"` no ancestral: a folha esmaece o rótulo por herança, e
 * quem consome não precisa marcar cada peça uma a uma.
 */
export function labelBlockDisabledSnippet(o: LabelSnippetOptions = {}): string {
  const id = o.htmlFor ?? 'documento';

  return snippet(
    [importing('label', 'createLabel'), importing('input', 'createInput')].join('\n'),
    `const bloco = document.createElement('div');
bloco.className = 'nds-stack';
bloco.dataset.spacing = 'xs';
bloco.dataset.disabled = 'true';`,
    `bloco.append(
  ${chamada('createLabel', labelLines(o, id, o.text ?? 'Documento'))},
  ${chamada(
    'createInput',
    opcoes([
      ['id', texto(id)],
      ['placeholder', o.placeholder ? texto(o.placeholder) : undefined],
      ['disabled', 'true'],
    ]),
  )},
);`,
    montar('bloco'),
  );
}

/**
 * Rótulo de caixa de seleção.
 *
 * Só `for`/`id`. A caixa é um `<button>`, que é controle rotulável do HTML, e
 * por isso a associação nativa basta — nem `aria-labelledby` de reserva, nem
 * ouvinte de clique reenviando o evento à mão.
 */
export function labelWithBoxSnippet(o: LabelSnippetOptions = {}): string {
  const id = o.htmlFor ?? 'termos';

  return snippet(
    [importing('label', 'createLabel'), importing('checkbox', 'createCheckbox')].join('\n'),
    `const caixa = ${chamada('createCheckbox', opcoes([['id', texto(id)]]))};`,
    `const rotulo = ${chamada(
      'createLabel',
      labelLines(o, id, o.text ?? 'Concordo com os termos de uso'),
    )};`,
    montar('caixa, rotulo'),
  );
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const labelSource: SourceTransform<LabelSnippetOptions> = (_gerado, ctx) =>
  labelSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function labelSourceWith(fixas: LabelSnippetOptions): SourceTransform<LabelSnippetOptions> {
  return (_gerado, ctx) => labelSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o campo obrigatório. */
export function labelSourceObrigatorio(
  fixas: LabelSnippetOptions = {},
): SourceTransform<LabelSnippetOptions> {
  return () => labelObrigatorioSnippet(fixas);
}

/** Transform de story para o bloco inteiro desabilitado. */
export function labelSourceBlock(
  fixas: LabelSnippetOptions = {},
): SourceTransform<LabelSnippetOptions> {
  return () => labelBlockDisabledSnippet(fixas);
}

/** Transform de story para o par com caixa de seleção. */
export function labelSourceBox(
  fixas: LabelSnippetOptions = {},
): SourceTransform<LabelSnippetOptions> {
  return () => labelWithBoxSnippet(fixas);
}
