/**
 * Transforms do painel Code do Composer.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories usam e que o snippet precisa mostrar. */
export type ComposerArgs = {
  value?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  submitOn?: 'enter' | 'modifier';
  /** A story liga o estado de geração? */
  running?: boolean;
  /** A story põe controles no trilho? */
  rail?: boolean;
};

const IMPORT = "import { Composer } from '@/components/ui/composer';";

const IMPORT_WITH_BUTTON = `${IMPORT}
import { Button } from '@/components/ui/button';`;

/**
 * O vínculo do texto e o `onSubmit` entram SEMPRE, mesmo quando a story não
 * passa nenhum dos dois.
 *
 * Sem eles o snippet ensinaria um composer que não faz nada com o que foi
 * escrito — que é o erro mais provável de quem copia, porque o componente não
 * limpa o campo nem envia por conta própria. As duas linhas existem para dizer
 * onde a responsabilidade continua: o texto é de quem consome, e o envio
 * também.
 */
function attributes(opts: ComposerArgs): Array<string | undefined> {
  return [
    'bind:value={texto}',
    '{labels}',
    opts.rail ? '{railStart}' : undefined,
    opts.rows === undefined ? undefined : `rows={${opts.rows}}`,
    opts.maxLength === undefined ? undefined : `maxLength={${opts.maxLength}}`,
    opts.submitOn === undefined ? undefined : `submitOn="${opts.submitOn}"`,
    opts.running ? 'running={gerando}' : undefined,
    opts.disabled ? 'disabled' : undefined,
    'onSubmit={enviar}',
    opts.running ? 'onStop={cancelar}' : undefined,
  ];
}

/** O snippet completo, com ou sem o trilho preenchido. */
export function composerSnippet(opts: ComposerArgs = {}): string {
  const attrs = attrsMultilinha(attributes(opts));
  if (!opts.rail) return svelteSnippet(IMPORT, `<Composer${attrs} />`);

  // O trilho é um ESPAÇO, e nesta stack ele é um trecho de marcação — declarado
  // ANTES de quem o usa, senão a referência aponta para o nada.
  return svelteSnippet(
    IMPORT_WITH_BUTTON,
    [
      '{#snippet railStart()}',
      '  <Button variant="ghost" size="sm">Anexar</Button>',
      '{/snippet}',
      '',
      `<Composer${attrs} />`,
    ].join('\n'),
  );
}

/** Transform do `meta` do Playground: a forma básica. */
export function composerSource(): string {
  return composerSnippet();
}

/** Transform do `meta` das variações, dos estados e das composições. */
export function composerBaseSource(): string {
  return composerSnippet();
}

/** A tecla direta envia — convenção de teclado físico. */
export function composerEnterSource(): string {
  return composerSnippet({ submitOn: 'enter' });
}

/** A combinação envia — é o certo no toque. */
export function composerModifierSource(): string {
  return composerSnippet({ submitOn: 'modifier' });
}

/** Com texto, o envio está disponível. */
export function composerFilledSource(): string {
  return composerSnippet({ value: 'Resume a última reunião.' });
}

/** Enquanto gera, o botão troca de nome e passa a interromper. */
export function composerRunningSource(): string {
  return composerSnippet({ value: 'Resume a última reunião.', running: true });
}

/** Perto do limite, o contador muda de cor e de peso. */
export function composerNearLimitSource(): string {
  return composerSnippet({ maxLength: 120 });
}

/** O conjunto inteiro fora do percurso do teclado. */
export function composerDisabledSource(): string {
  return composerSnippet({ disabled: true });
}

/** O trilho é um espaço, e nesta stack ele é um trecho de marcação. */
export function composerRailSource(): string {
  return composerSnippet({ rail: true });
}
