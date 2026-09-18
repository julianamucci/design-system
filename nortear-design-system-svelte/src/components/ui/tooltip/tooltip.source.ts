/**
 * Transforms do painel Code do Tooltip.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

/**
 * Nome do componente e caminho do módulo de cada ícone usado nas stories.
 *
 * `compartilhar` (Share2) saiu: o único gatilho que compartilhava virou botão
 * de TEXTO na variante `longText`, e ali não entra ícone nenhum — a entrada
 * ficou inalcançável no mesmo passo, sem que nada reprovasse.
 */
const ICONS = {
  save: ['Save', 'save'],
  excluir: ['Trash2', 'trash-2'],
} as const;

type IconKey = keyof typeof ICONS;

/**
 * A espera padrão do `TooltipProvider`, em ms — 300, fixada pela dona em
 * 2026-09-12 nas cinco stacks (D5 do PRD).
 *
 * Vive aqui porque o snippet só escreve `delayDuration` quando o valor DIFERE
 * do padrão, como faz o do navigation-menu: escrever o padrão é ruído, e
 * omitir o que difere é mentir sobre a cena que a story mostra. Enquanto o
 * padrão era zero as duas regras coincidiam por acidente — `0` é falsy —, e
 * foi essa coincidência que amarrou o painel Code ao valor antigo.
 */
const DEFAULT_DELAY = 300;

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

/**
 * O ícone do gatilho sai da ação que ele representa, como nas demonstrações.
 * `longText` não tem ícone: ali o gatilho é de TEXTO, e o rótulo visível já é
 * o nome acessível — um `aria-label` diferente dele quebraria a WCAG 2.5.3.
 */
function triggerIcon(variant: string, triggerLabel: string): IconKey | null {
  if (variant === 'longText') return null;
  return /excluir|delete|eliminar/i.test(triggerLabel) ? 'excluir' : 'save';
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
function mount(options: {
  icon: IconKey | null;
  ariaLabel: string;
  triggerLabel?: string;
  provider: string;
  root: string;
  content: string;
  body: string;
  state?: string;
}): string {
  const icon = options.icon ? ICONS[options.icon] : null;
  const script = [
    icon ? `${IMPORT}\nimport ${icon[0]} from "@lucide/svelte/icons/${icon[1]}";` : IMPORT,
    options.state ?? '',
  ]
    .filter(Boolean)
    .join('\n\n');

  // Gatilho de texto não leva ícone nem `aria-label`: seria import órfão na mão
  // de quem copia, e nome acessível competindo com o rótulo visível.
  const gatilho = icon
    ? `<Button variant="outline" size="icon" aria-label="${options.ariaLabel}" {...props}>
          <${icon[0]} aria-hidden="true" class="nds-size-4" />
        </Button>`
    : `<Button variant="outline" {...props}>${options.triggerLabel ?? ''}</Button>`;

  return svelteSnippet(
    script,
    `<TooltipProvider${options.provider}>
  <Tooltip${options.root}>
    <TooltipTrigger>
      {#snippet child({ props })}
        ${gatilho}
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
    delayDuration = DEFAULT_DELAY,
    triggerLabel = 'Salvar',
    ariaLabel = 'Salvar',
    contentText = 'Salvar (Ctrl+S)',
    variant = 'default',
  } = ctx?.args ?? {};

  return mount({
    icon: triggerIcon(variant, triggerLabel),
    ariaLabel,
    triggerLabel,
    // A espera é decisão do Provider, que a compartilha entre os vizinhos, e o
    // snippet a escreve só quando ela difere do padrão.
    provider: attrs(
      delayDuration === DEFAULT_DELAY ? '' : `delayDuration={${delayDuration}}`,
    ),
    root: '',
    content: attrs(
      side === 'top' ? '' : `side="${side}"`,
      align === 'center' ? '' : `align="${align}"`,
      sideOffset ? `sideOffset={${sideOffset}}` : '',
    ),
    body: balaoBody(variant, contentText),
  });
}

/**
 * PlacementSides (Compositions): os quatro lados, um provedor só.
 *
 * O snippet ensina a FORMA de produção — provedor único no root, um balão por
 * gatilho, abertura por ponteiro ou foco. A cena da story abre os quatro ao
 * mesmo tempo e por isso dá um provedor a cada um; isso é andaime de regressão
 * visual, e andaime não entra no que alguém copia.
 */
export function tooltipPlacementSidesSource(): string {
  return svelteSnippet(
    `${IMPORT}

const SIDES = [
  { side: "top", label: "Top" },
  { side: "right", label: "Right" },
  { side: "bottom", label: "Bottom" },
  { side: "left", label: "Left" },
] as const;`,
    `<TooltipProvider>
  {#each SIDES as item (item.side)}
    <Tooltip>
      <TooltipTrigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>{item.label}</Button>
        {/snippet}
      </TooltipTrigger>
      <TooltipContent side={item.side}>Tooltip {item.label}</TooltipContent>
    </Tooltip>
  {/each}
</TooltipProvider>`,
  );
}

/**
 * Collision (Compositions): o lado pedido não cabe, e a lib vira o balão.
 *
 * Nada a configurar — a fuga de colisão é o padrão. O que o snippet ensina é
 * que `side` é PREFERÊNCIA, e que o lado final chega ao balão em `data-side`,
 * que é o gancho lido pela folha compartilhada.
 */
export function tooltipCollisionSource(): string {
  return svelteSnippet(
    IMPORT,
    `<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      {#snippet child({ props })}
        <Button variant="outline" {...props}>Sem espaço acima</Button>
      {/snippet}
    </TooltipTrigger>
    <!-- side é preferência: sem espaço acima, o balão nasce embaixo e
         publica o lado final em data-side. -->
    <TooltipContent side="top">Viro para baixo sozinho</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
  );
}

/** HelpInFormField (Compositions): ajuda ao lado do rótulo de um campo. */
export function tooltipFormFieldHelpSource(): string {
  return svelteSnippet(
    IMPORT,
    `<TooltipProvider>
  <div class="nds-stack nds-w-sm" data-spacing="xs">
    <div class="nds-cluster" data-spacing="sm">
      <label for="api-token" class="nds-text-body nds-font-medium">Token de API</label>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon-sm" aria-label="Ajuda sobre Token de API" {...props}>
              ?
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent side="right">
          Gere em Configurações › Acesso › Tokens
        </TooltipContent>
      </Tooltip>
    </div>
    <input id="api-token" type="text" class="nds-input" placeholder="sk-..." />
  </div>
</TooltipProvider>`,
  );
}

/** MetricDescription (Compositions): a sigla da métrica, definida no balão. */
export function tooltipMetricDescriptionSource(): string {
  return svelteSnippet(
    IMPORT,
    `<TooltipProvider>
  <div class="nds-stack" data-spacing="xs">
    <div class="nds-cluster" data-spacing="sm">
      <p class="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase">LCP</p>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon-sm" aria-label="O que é LCP" {...props}>i</Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>
          Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
        </TooltipContent>
      </Tooltip>
    </div>
    <p class="nds-text-h3 nds-m-0">1,8 s</p>
  </div>
</TooltipProvider>`,
  );
}

/**
 * GroupWait (Compositions): a janela de cortesia do grupo, com os dois números
 * à vista — o par só se lê junto.
 */
export function tooltipGroupWaitSource(): string {
  return svelteSnippet(
    `${IMPORT}
import Save from "@lucide/svelte/icons/save";
import Trash2 from "@lucide/svelte/icons/trash-2";
import Share2 from "@lucide/svelte/icons/share-2";

const ACTIONS = [
  { id: "save", label: "Salvar", hint: "Salvar (Ctrl+S)", icon: Save },
  { id: "delete", label: "Excluir", hint: "Excluir item", icon: Trash2 },
  { id: "share", label: "Compartilhar", hint: "Compartilhar link", icon: Share2 },
] as const;`,
    `<!-- O primeiro balão espera os 600 ms; enquanto a janela de 1000 ms está
     quente, o vizinho abre na hora. Os dois números só se leem juntos. -->
<TooltipProvider delayDuration={600} skipDelayDuration={1000}>
  <div class="nds-cluster" data-spacing="lg">
    {#each ACTIONS as action (action.id)}
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label={action.label} {...props}>
              <action.icon aria-hidden="true" class="nds-size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>{action.hint}</TooltipContent>
      </Tooltip>
    {/each}
  </div>
</TooltipProvider>`,
  );
}

/** Open (States): o balão nasce aberto, sem interação e sem estado externo. */
export function tooltipOpenSource(): string {
  return mount({
    icon: 'save',
    ariaLabel: 'Salvar',
    provider: '',
    root: ' defaultOpen',
    content: ' sideOffset={4}',
    body: 'Salvar (Ctrl+S)',
  });
}

/** Controlled (States): a abertura vem de fora, e o Escape devolve o valor. */
export function tooltipControlledSource(): string {
  return mount({
    icon: 'save',
    ariaLabel: 'Salvar',
    provider: '',
    root: ' bind:open={aberto}',
    content: ' sideOffset={4}',
    body: 'Salvar (Ctrl+S)',
    state: 'let aberto = $state(true);',
  });
}
