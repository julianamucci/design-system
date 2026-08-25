/**
 * Transforms do painel Code do Badge.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import { attr, attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type BadgeArgs = {
  variant: 'default' | 'destructive' | 'warning' | 'success' | 'info';
};

const IMPORT = `import { Badge } from '@/components/ui/badge'`;
const IMPORT_WITH_COUNTER = `import { Badge, BadgeCounter } from '@/components/ui/badge'`;

/** Import do ícone. Ele é reforço visual; quem nomeia o badge é o texto. */
function importIcon(...names: string[]): string {
  return `import { ${names.join(', ')} } from 'lucide-vue-next'`;
}

/**
 * A etiqueta. `variant` some quando é a padrão, e nenhum exemplo escreve `as`:
 * o badge já nasce em elemento inline, que é o que o deixa caber dentro de
 * frase, de título e de célula de tabela.
 */
function badge(variant: string | undefined, content: string): string {
  return `<Badge${attrs(attr('variant', variant, 'default'))}>${content}</Badge>`;
}

/**
 * Forma canônica: o badge é só o texto dentro dele. A variante acompanha o
 * control, e a padrão não é escrita.
 */
export const badgeSource: SourceTransform<BadgeArgs> = (_gerado, ctx) =>
  vueSnippet(IMPORT, badge(ctx?.args?.variant, 'Novo'));

/** Ênfase máxima: a borda em `primary`, para o que precisa ser visto primeiro. */
export function badgeDefaultSource(): string {
  return vueSnippet(IMPORT, badge('default', 'Novo'));
}

/**
 * Alerta: a borda em `destructive`, com o texto neutro. É a combinação que
 * sustenta os 4.5:1 — a cor sinaliza no contorno, o contraste vem do texto.
 */
export function badgeDestructiveSource(): string {
  return vueSnippet(IMPORT, badge('destructive', 'Urgente'));
}

/**
 * As três semânticas juntas, porque o que elas prometem é serem DISTINGUÍVEIS
 * entre si: uma avisa, uma confirma e uma contextualiza.
 */
export function badgeSemanticasSource(): string {
  const etiquetas = [
    badge('warning', 'Vence hoje'),
    badge('success', 'Aprovado'),
    badge('info', 'Novidade'),
  ];
  return vueSnippet(
    IMPORT,
    `<div class="nds-cluster" data-spacing="sm">
${indentar(etiquetas.join('\n'))}
</div>`,
  );
}

/**
 * Ícone junto do texto: o respiro entre os dois é do próprio badge, e
 * `data-icon` diz de que lado o ícone está para que o preenchimento daquele
 * lado encurte. Margem escrita à mão somaria ao respiro e o dobraria.
 */
export function badgeWithIconSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Check')}`,
    `<Badge>
  <Check aria-hidden="true" data-icon="inline-start" />
  Ativo
</Badge>`,
  );
}

/**
 * Contador DENTRO da etiqueta: o número fica à direita do texto, na mesma
 * caixa. O rótulo diz de que é a contagem, então quem lê ouve "Urgente 12".
 *
 * O contador é neutro em qualquer variante: a cor da etiqueta vem da borda ao
 * redor, e pintar o número derrubaria o contraste dele em parte dos temas.
 */
export function badgeWithCounterSource(): string {
  return vueSnippet(
    IMPORT_WITH_COUNTER,
    `<Badge variant="destructive">
  Urgente
  <BadgeCounter>12</BadgeCounter>
</Badge>`,
  );
}

/**
 * Badge dentro de botão: quem é focável e clicável é o BOTÃO — o badge não vira
 * controle. É por isso que o anel de foco mora no elemento de fora, e o badge
 * continua sem tabulação própria.
 */
export function badgeAsButtonSource(): string {
  return vueSnippet(
    IMPORT,
    `<button
  type="button"
  aria-label="Filtrar por acessibilidade"
  class="nds-cluster nds-rounded-md nds-focus-ring-inset"
>
  ${badge('info', 'Acessibilidade')}
</button>`,
  );
}
