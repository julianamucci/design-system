// Snippet do painel Code do InputOTP — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { InputOtpMode } from './input-otp';

/**
 * O que as stories do InputOTP usam.
 *
 * As chaves são as MESMAS dos args da story — inclusive `'aria-label'`, que é o
 * nome canônico da opção na fábrica (`ariaLabel` sobrevive só como apelido
 * `@deprecated`). Assim `{ ...ctx.args }` entra sem tradução.
 */
export type InputOtpSnippetOptions = {
  length?: number;
  mode?: InputOtpMode;
  /** Índices ANTES dos quais entra um separador. */
  separatorAt?: number[];
  /** Atalho do control da story: um separador no meio do código. */
  withSeparator?: boolean;
  value?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  'aria-label'?: string;
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onComplete?: unknown;
};

/** O padrão da fábrica para o nome do conjunto — repeti-lo não ensinaria nada. */
const NOME_PADRAO = 'Código de verificação';
const COMPRIMENTO_PADRAO = 6;
const CALLBACK_PADRAO = '(codigo) => verificar(codigo)';

/** Índices de separador: o explícito manda; o atalho do control divide ao meio. */
function separadores(o: InputOtpSnippetOptions, total: number): number[] | undefined {
  if (o.separatorAt?.length) return o.separatorAt;
  if (o.withSeparator) return [Math.floor(total / 2)];
  return undefined;
}

/** As linhas de opção da chamada, compartilhadas pelas duas formas de snippet. */
function linhasDoOtp(o: InputOtpSnippetOptions): string[] {
  const total = o.length ?? COMPRIMENTO_PADRAO;
  const separadorAt = separadores(o, total);
  const nome = o['aria-label'];

  return opcoes([
    // `length` é obrigatório na fábrica: entra sempre.
    ['length', String(total)],
    ['mode', o.mode && o.mode !== 'numeric' ? texto(o.mode) : undefined],
    ['separatorAt', separadorAt ? `[${separadorAt.join(', ')}]` : undefined],
    ['value', o.value ? texto(o.value) : undefined],
    ['aria-label', nome && nome !== NOME_PADRAO ? texto(nome) : undefined],
    ['invalid', o.invalid ? 'true' : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['autoFocus', o.autoFocus ? 'true' : undefined],
    ['describedBy', o.describedBy ? texto(o.describedBy) : undefined],
    [
      'onComplete',
      o.onComplete
        ? typeof o.onComplete === 'string'
          ? o.onComplete
          : CALLBACK_PADRAO
        : undefined,
    ],
  ]);
}

/** A chamada real de `createInputOTP` com as opções da story. */
export function inputOtpSnippet(o: InputOtpSnippetOptions = {}): string {
  return snippet(
    importar('input-otp', 'createInputOTP'),
    `const codigo = ${chamada('createInputOTP', linhasDoOtp(o))};`,
    montar('codigo'),
  );
}

/** O que a composição põe EM VOLTA do campo. Nada disso é opção de fábrica. */
export type InputOtpComposicaoOptions = InputOtpSnippetOptions & {
  /** Texto visível acima do campo. */
  rotulo?: string;
  /**
   * Liga o rótulo visível ao conjunto por `aria-labelledby`.
   *
   * Um `<label for>` não serve aqui: o alvo é um grupo de campos, e não um
   * controle só. `aria-labelledby` tem precedência sobre o `aria-label` padrão
   * da fábrica — o texto que a pessoa vê passa a ser o que o leitor anuncia.
   */
  ligarRotulo?: boolean;
  /** Texto de apoio, apontado por `describedBy`. */
  ajuda?: string;
  /** Mensagem de erro, apontada por `describedBy`. */
  erro?: string;
  /** Acrescenta a linha com o botão de reenviar o código. */
  reenvio?: string;
};

/**
 * Campo de código com rótulo visível e, conforme o caso, texto de apoio,
 * mensagem de erro ou reenvio.
 *
 * O rótulo é um `<span>` de texto, e não `createLabel`: `label[for]` alcança um
 * controle rotulável, e aqui o alvo é o CONJUNTO.
 */
export function inputOtpComposicaoSnippet(o: InputOtpComposicaoOptions = {}): string {
  const rotulo = o.rotulo ?? NOME_PADRAO;
  const idAjuda = o.ajuda ? 'otp-ajuda' : undefined;
  const idErro = o.erro ? 'otp-erro' : undefined;
  const idRotulo = o.ligarRotulo ? 'otp-rotulo' : undefined;

  const linhas = linhasDoOtp({
    ...o,
    describedBy: o.describedBy ?? idAjuda ?? idErro,
    invalid: o.invalid ?? Boolean(o.erro),
  });

  const montados = ['titulo', 'codigo', o.ajuda && 'apoio', o.erro && 'aviso', o.reenvio && 'linha']
    .filter((n): n is string => typeof n === 'string');

  return snippet(
    [
      importar('input-otp', 'createInputOTP'),
      o.reenvio ? importar('button', 'createButton') : undefined,
    ]
      .filter((l): l is string => typeof l === 'string')
      .join('\n'),
    `const titulo = document.createElement('span');
titulo.className = 'nds-text-label';${idRotulo ? `\ntitulo.id = ${texto(idRotulo)};` : ''}
titulo.textContent = ${texto(rotulo)};`,
    [
      `const codigo = ${chamada('createInputOTP', linhas)};`,
      ...(idRotulo
        ? [
            `codigo.removeAttribute('aria-label');`,
            `codigo.setAttribute('aria-labelledby', ${texto(idRotulo)});`,
          ]
        : []),
    ].join('\n'),
    o.ajuda
      ? `const apoio = document.createElement('p');
apoio.id = ${texto(idAjuda as string)};
apoio.className = 'nds-text-caption nds-text-muted-foreground';
apoio.textContent = ${texto(o.ajuda)};`
      : undefined,
    o.erro
      ? `const aviso = document.createElement('p');
aviso.id = ${texto(idErro as string)};
aviso.className = 'nds-text-caption nds-text-destructive';
aviso.textContent = ${texto(o.erro)};`
      : undefined,
    o.reenvio
      ? `const linha = document.createElement('div');
linha.className = 'nds-cluster';
linha.dataset.spacing = 'xs';
linha.dataset.align = 'center';

const nota = document.createElement('span');
nota.className = 'nds-text-caption nds-text-muted-foreground';
nota.textContent = 'Não recebeu?';

linha.append(nota, ${chamada(
          'createButton',
          opcoes([
            ['variant', texto('link')],
            ['size', texto('sm')],
            ['label', texto(o.reenvio)],
          ]),
        )});`
      : undefined,
    montar(montados.join(', ')),
  );
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const inputOtpSource: SourceTransform<InputOtpSnippetOptions> = (_gerado, ctx) =>
  inputOtpSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function inputOtpSourceCom(
  fixas: InputOtpSnippetOptions,
): SourceTransform<InputOtpSnippetOptions> {
  return (_gerado, ctx) => inputOtpSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o campo composto com rótulo, apoio, erro ou reenvio. */
export function inputOtpSourceComposicao(
  fixas: InputOtpComposicaoOptions,
): SourceTransform<InputOtpSnippetOptions> {
  return () => inputOtpComposicaoSnippet(fixas);
}
