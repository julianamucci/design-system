/**
 * Transforms do painel Code do Collapsible.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * O control se chama `defaultOpen` no painel do Storybook, mas quem o componente
 * publica é `open` — o valor inicial de um estado que o próprio componente
 * mantém. É `open` que o snippet escreve: `defaultOpen` cairia no DOM como
 * atributo morto e não abriria nada.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type CollapsibleArgs = {
  defaultOpen: boolean;
  disabled: boolean;
};

const IMPORT = `import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import ChevronDown from "@lucide/svelte/icons/chevron-down";`;

/** Gatilho fantasma — o do exemplo canônico. */
const GATILHO_FANTASMA = 'nds-button nds-button-ghost nds-cluster nds-w-full nds-px-4';
/** Gatilho com contorno — o da composição que veste o gatilho de botão. */
const GATILHO_CONTORNO = 'nds-button nds-button-outline nds-cluster nds-w-full nds-px-4';
const PAINEL =
  'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';

/**
 * O gatilho inteiro, indentado como filho do Collapsible.
 *
 * As classes de botão moram no PRÓPRIO gatilho: é ele quem carrega
 * `aria-expanded` e `aria-controls`, e um botão aninhado dentro dele seria um
 * segundo elemento interativo sem estado nenhum.
 */
function gatilho(rotulo: string, classe: string = GATILHO_FANTASMA): string {
  return `  <CollapsibleTrigger
    class="${classe}"
    data-justify="between"
  >
    <span>${rotulo}</span>
    <ChevronDown
      aria-hidden="true"
      class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
    />
  </CollapsibleTrigger>`;
}

/** O painel inteiro, indentado como filho do Collapsible. */
function painel(corpo: string): string {
  return `  <CollapsibleContent
    class="${PAINEL}"
    data-spacing="sm"
  >
${corpo}
  </CollapsibleContent>`;
}

/** Forma canônica (Playground e Uncontrolled): o estado nasce e vive dentro. */
export function collapsibleSource(
  _gerado?: string,
  ctx?: { args?: Partial<CollapsibleArgs> },
): string {
  const { defaultOpen = false, disabled = false } = ctx?.args ?? {};
  const props = attrs(defaultOpen ? 'open' : '', disabled ? 'disabled' : '');
  const rotulo = defaultOpen ? 'Ocultar filtros avançados' : 'Exibir filtros avançados';

  return svelteSnippet(
    IMPORT,
    `<Collapsible class="nds-w-full nds-max-w-sm"${props}>
${gatilho(rotulo)}
${painel('    <p>Filtro avançado 1 · Filtro avançado 2</p>')}
</Collapsible>`,
  );
}

/** Estado OpenByDefault: `open` é ponto de partida, não trava. */
export function collapsibleAbertoPorPadraoSource(): string {
  return collapsibleSource(undefined, { args: { defaultOpen: true } });
}

/** Estado Disabled: o gatilho recusa ponteiro e teclado. */
export function collapsibleDesabilitadoSource(): string {
  return collapsibleSource(undefined, { args: { disabled: true } });
}

/** Estado Controlled: quem manda é o estado de fora, e o gatilho o devolve. */
export function collapsibleControladoSource(): string {
  return svelteSnippet(
    `import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import ChevronDown from "@lucide/svelte/icons/chevron-down";

let aberto = $state(false);`,
    `<div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
  <p class="nds-text-caption nds-text-muted-foreground">
    Estado externo: <strong>{aberto ? 'aberto' : 'fechado'}</strong>
  </p>
  <div class="nds-cluster" data-spacing="sm">
    <Button variant="outline" size="sm" onclick={() => (aberto = true)}>
      Abrir pelo estado externo
    </Button>
    <Button variant="outline" size="sm" onclick={() => (aberto = false)}>
      Fechar pelo estado externo
    </Button>
  </div>
  <Collapsible bind:open={aberto} class="nds-w-full">
${gatilho("{aberto ? 'Ocultar filtros avançados' : 'Exibir filtros avançados'}")}
${painel('    <p>Conteúdo colapsável controlado externamente.</p>')}
  </Collapsible>
</div>`,
  );
}

/** Composição WithCustomButton: o botão do design system É o gatilho. */
export function collapsibleComBotaoSource(): string {
  return svelteSnippet(
    IMPORT,
    `<Collapsible class="nds-w-full nds-max-w-sm">
${gatilho('Exibir opções avançadas', GATILHO_CONTORNO)}
${painel(`    <p>Opção avançada 1</p>
    <p>Opção avançada 2</p>
    <p>Opção avançada 3</p>`)}
</Collapsible>`,
  );
}

/**
 * Composição WithRotatingChevron: a rotação de 180° é 100% CSS.
 *
 * `.nds-chevron` gira sozinha quando o ancestral está em
 * `[aria-expanded="true"]` — nenhum utilitário e nenhuma medida no markup.
 */
export function collapsibleComChevronSource(): string {
  return svelteSnippet(
    IMPORT,
    `<Collapsible class="nds-w-full nds-max-w-sm">
${gatilho('Configurações avançadas', GATILHO_CONTORNO)}
${painel(`    <div class="nds-cluster" data-justify="between">
      <span class="nds-text-muted-foreground">Notificações</span>
      <span class="nds-font-medium">Ativadas</span>
    </div>
    <div class="nds-cluster" data-justify="between">
      <span class="nds-text-muted-foreground">Privacidade</span>
      <span class="nds-font-medium">Modo estrito</span>
    </div>`)}
</Collapsible>`,
  );
}
