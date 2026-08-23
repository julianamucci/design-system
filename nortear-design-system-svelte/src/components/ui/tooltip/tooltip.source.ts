/**
 * Transforms do painel Code do Tooltip.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

/** Nome do componente e caminho do módulo de cada ícone usado nas stories. */
const ICONS = {
  salvar: ['Save', 'save'],
  excluir: ['Trash2', 'trash-2'],
  compartilhar: ['Share2', 'share-2'],
} as const;

type IconKey = keyof typeof ICONS;

export type TooltipArgs = {
  side: 'top' | 'right' | 'bottom' | 'left';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  delayDuration: number;
  triggerLabel: string;
  ariaLabel: string;
  contentText: string;
  variant: 'default' | 'withShortcut' | 'longText';
};

const IMPORT = `import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";`;

/** O ícone do gatilho sai da ação que ele representa, como nas demonstrações. */
function triggerIcon(variant: string, triggerLabel: string): IconKey {
  if (variant === 'longText') return 'compartilhar';
  return /excluir|delete|eliminar/i.test(triggerLabel) ? 'excluir' : 'salvar';
}

/**
 * O conteúdo do balão. Texto curto cabe na mesma linha da tag; texto longo e
 * atalho de teclado ganham corpo próprio.
 */
function balaoBody(variant: string, contentText: string): string {
  if (variant === 'withShortcut') {
    // O atalho sai do texto e vira tecla: `.nds-tooltip-content:has([data-slot="kbd"])`
    // é o que encurta o respiro à direita do balão.
    const text = contentText.replace(/\s*\([^)]*\)\s*$/, '');
    return `
      <span>${text}</span>
      <kbd data-slot="kbd" class="nds-kbd">Ctrl</kbd>
      <kbd data-slot="kbd" class="nds-kbd">S</kbd>
    `;
  }
  return contentText.length > 48 ? `\n      ${contentText}\n    ` : contentText;
}

/** Monta a composição inteira: Provider, raiz, gatilho e balão. */
function montar(options: {
  icone: IconKey;
  ariaLabel: string;
  provider: string;
  root: string;
  content: string;
  body: string;
  state?: string;
}): string {
  const [name, caminho] = ICONS[options.icone];
  const script = [
    `${IMPORT}\nimport ${name} from "@lucide/svelte/icons/${caminho}";`,
    options.state ?? '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return svelteSnippet(
    script,
    `<TooltipProvider${options.provider}>
  <Tooltip${options.root}>
    <TooltipTrigger>
      {#snippet child({ props })}
        <Button variant="outline" size="icon" aria-label="${options.ariaLabel}" {...props}>
          <${name} aria-hidden="true" class="nds-size-4" />
        </Button>
      {/snippet}
    </TooltipTrigger>
    <TooltipContent${options.content}>${options.body}</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
  );
}

/**
 * Forma canônica, e transform do meta de todos os arquivos: gatilho só de
 * ícone com nome próprio, balão complementar.
 *
 * A abertura NÃO entra aqui de propósito. As stories de variação, composição e
 * posicionamento nascem abertas só para a regressão visual capturar o balão —
 * ensinar `defaultOpen` como uso comum inverteria o componente. Quem documenta
 * a abertura é a story que trata dela, com transform própria.
 */
export function tooltipSource(_gerado?: string, ctx?: { args?: Partial<TooltipArgs> }): string {
  const {
    side = 'top',
    align = 'center',
    sideOffset = 4,
    delayDuration = 0,
    triggerLabel = 'Salvar',
    ariaLabel = 'Salvar',
    contentText = 'Salvar (Ctrl+S)',
    variant = 'default',
  } = ctx?.args ?? {};

  return montar({
    icone: triggerIcon(variant, triggerLabel),
    ariaLabel,
    // A espera é decisão do Provider, que a compartilha entre os vizinhos.
    provider: attrs(delayDuration ? `delayDuration={${delayDuration}}` : ''),
    root: '',
    content: attrs(
      side === 'top' ? '' : `side="${side}"`,
      align === 'center' ? '' : `align="${align}"`,
      sideOffset ? `sideOffset={${sideOffset}}` : '',
    ),
    body: balaoBody(variant, contentText),
  });
}

/** Open (States): o balão nasce aberto, sem interação e sem estado externo. */
export function tooltipOpenSource(): string {
  return montar({
    icone: 'salvar',
    ariaLabel: 'Salvar',
    provider: '',
    root: ' defaultOpen',
    content: ' sideOffset={4}',
    body: 'Salvar (Ctrl+S)',
  });
}

/** Controlled (States): a abertura vem de fora, e o Escape devolve o valor. */
export function tooltipControlledSource(): string {
  return montar({
    icone: 'salvar',
    ariaLabel: 'Salvar',
    provider: '',
    root: ' bind:open={aberto}',
    content: ' sideOffset={4}',
    body: 'Salvar (Ctrl+S)',
    state: 'let aberto = $state(true);',
  });
}
