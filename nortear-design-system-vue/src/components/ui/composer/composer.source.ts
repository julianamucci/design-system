/**
 * Transforms do painel Code do Composer.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * O gerador imprimiria a tag sozinha, sem o andaime que os rótulos exigem. O
 * que se escreve é um componente com rótulos, um vínculo de texto e um punhado
 * de opções — é isso que o painel mostra.
 */
import { attrsMultilinha, vueSnippet, type SourceTransform } from '@/lib/story-source';

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
 * O que o exemplo DECLARA, e não só o que ele importa.
 *
 * É a outra metade da decisão registrada logo abaixo: o vínculo do texto e o
 * `@submit` entram sempre para dizer ONDE a responsabilidade continua, e um
 * `texto`, um `labels` e um `enviar` que nunca fossem declarados diriam isso
 * ligando três nomes que não resolvem na mão de quem copia.
 */
const ROTULOS = [
  'const labels = {',
  "  input: 'Mensagem',",
  "  placeholder: 'Escreva sua mensagem…',",
  "  submit: 'Enviar',",
  "  stop: 'Parar',",
  "  hint: '{key} envia',",
  '};',
].join('\n');

const TEXTO = [
  '// O texto é de quem consome: o campo não guarda nem limpa nada sozinho.',
  "const texto = ref('');",
  '',
  'function enviar(value: string) {',
  '  mandarMensagem(value);',
  "  texto.value = '';",
  '}',
].join('\n');

/** O estado de geração e o que interrompe — só nos exemplos que os ligam. */
const GERANDO = [
  'const gerando = ref(false);',
  '',
  'function cancelar() {',
  '  // Interromper é de quem consome: o campo só avisa que alguém pediu.',
  '  pararGeracao();',
  '}',
].join('\n');

/** O `<script setup>` de cada exemplo: o que importa e o que declara. */
function setupFor(opts: ComposerArgs): string {
  const base = opts.rail ? IMPORT_WITH_BUTTON : IMPORT;
  return [
    "import { ref } from 'vue';",
    base,
    '',
    ROTULOS,
    '',
    TEXTO,
    ...(opts.running ? ['', GERANDO] : []),
  ].join('\n');
}

/**
 * O vínculo do texto e o `@submit` entram SEMPRE, mesmo quando a story não
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
    'v-model:value="texto"',
    ':labels="labels"',
    opts.rows === undefined ? undefined : `:rows="${opts.rows}"`,
    opts.maxLength === undefined ? undefined : `:max-length="${opts.maxLength}"`,
    opts.submitOn === undefined ? undefined : `submit-on="${opts.submitOn}"`,
    opts.running ? ':running="gerando"' : undefined,
    opts.disabled ? 'disabled' : undefined,
    '@submit="enviar"',
    opts.running ? '@stop="cancelar"' : undefined,
  ];
}

/** O snippet completo, com ou sem o trilho preenchido. */
export function composerSnippet(opts: ComposerArgs = {}): string {
  const attrs = attrsMultilinha(attributes(opts));
  if (!opts.rail) return vueSnippet(setupFor(opts), `<Composer${attrs} />`);

  return vueSnippet(
    setupFor(opts),
    [
      `<Composer${attrs}>`,
      '  <template #railStart>',
      '    <Button variant="ghost" size="sm">Anexar</Button>',
      '  </template>',
      '</Composer>',
    ].join('\n'),
  );
}

/** Transform do `meta` do Playground: lê os args da story e devolve o uso real. */
export const composerSource: SourceTransform<ComposerArgs> = (_gerado, ctx) =>
  composerSnippet(ctx?.args ?? {});

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

/** O trilho é um espaço, e nesta stack ele é um slot. */
export function composerRailSource(): string {
  return composerSnippet({ rail: true });
}
