/**
 * Transforms do painel Code do Tooltip.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta do balão — `contain: layout`, `minHeight`,
 * `position: relative` — é andaime de captura, para o balão portalizado ter
 * contra o que se posicionar dentro do quadro do Storybook. Nada disso é do
 * componente, e por isso nada disso entra no snippet.
 */
import {
  attrs,
  jsxSnippet,
  propBool,
  propNumber,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type TooltipArgs = {
  side: 'top' | 'right' | 'bottom' | 'left';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  defaultOpen: boolean;
};

const LADOS = ['top', 'right', 'bottom', 'left'] as const;
const ALINHAMENTOS = ['start', 'center', 'end'] as const;

const IMPORT_TOOLTIP = `import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";`;

const IMPORT_DEFAULT = `${IMPORT_TOOLTIP}
import { Save } from "lucide-react";`;

/**
 * O gatilho é o botão de verdade, não um invólucro: `render` entrega as props
 * do gatilho ao elemento que já existe na interface. Um botão só-ícone precisa
 * do próprio `aria-label` — quem chega pelo toque nunca vê o balão, então o
 * tooltip não pode ser o único portador do nome.
 */
function triggerIcon(label = 'Salvar', variant: 'ghost' | 'outline' = 'ghost'): string {
  return `    <TooltipTrigger
      render={(props) => (
        <Button {...props} variant="${variant}" size="icon" aria-label="${label}">
          <Save aria-hidden="true" />
        </Button>
      )}
    />`;
}

/** Envolve a composição no provider, que é quem governa o atraso de abertura. */
function withProvider(miolo: string, delay?: number): string {
  const abertura = delay === undefined ? '<TooltipProvider>' : `<TooltipProvider delay={${delay}}>`;
  return `${abertura}\n${miolo}\n</TooltipProvider>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no estado fechado, que é o padrão do
 * componente e o uso canônico. Só o que difere do padrão entra no snippet.
 *
 * `onOpenChange` NÃO é interpolado: o Storybook o entrega como espião, e o
 * corpo do mock apareceria no painel como se fosse código do design system.
 */
export const tooltipSource: SourceTransform<TooltipArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const position = attrs(
    propOption('side', args.side, LADOS, 'top'),
    propOption('align', args.align, ALINHAMENTOS, 'center'),
    typeof args.sideOffset === 'number' && args.sideOffset !== 4
      ? propNumber('sideOffset', args.sideOffset)
      : undefined,
  );
  const root = attrs(propBool('defaultOpen', args.defaultOpen));

  return jsxSnippet(
    IMPORT_DEFAULT,
    withProvider(
      `  <Tooltip${root}>
${triggerIcon('Salvar', 'outline')}
    <TooltipContent${position}>Salvar (Ctrl+S)</TooltipContent>
  </Tooltip>`,
    ),
  );
};

/**
 * Texto curto — a variante padrão. Nasce aberta porque o balão só existe no DOM
 * enquanto está aberto, e é assim que a regressão visual o alcança.
 */
export function tooltipCurtoSource(): string {
  return jsxSnippet(
    IMPORT_DEFAULT,
    withProvider(
      `  <Tooltip defaultOpen>
${triggerIcon()}
    <TooltipContent>Salvar</TooltipContent>
  </Tooltip>`,
    ),
  );
}

/**
 * Com atalho de teclado. O `data-slot="kbd"` não é decoração: é o gancho de
 * `.nds-tooltip-content:has([data-slot="kbd"])`, que encurta o respiro à
 * direita do balão. Sem ele a tecla fica com folga a mais de um lado só.
 */
export function tooltipWithShortcutSource(): string {
  return jsxSnippet(
    IMPORT_DEFAULT,
    withProvider(
      `  <Tooltip defaultOpen>
${triggerIcon()}
    <TooltipContent>
      <span>Salvar</span>
      <kbd className="nds-kbd" data-slot="kbd">Ctrl</kbd>
      <kbd className="nds-kbd" data-slot="kbd">S</kbd>
    </TooltipContent>
  </Tooltip>`,
    ),
  );
}

/**
 * Texto longo: quebra dentro do limite de largura do balão, que é do próprio
 * componente. Passou disso, o caso deixou de ser tooltip e virou popover.
 */
export function tooltipTextLongSource(): string {
  return jsxSnippet(
    IMPORT_TOOLTIP,
    withProvider(
      `  <Tooltip defaultOpen>
    <TooltipTrigger
      render={(props) => <Button {...props} variant="outline">Compartilhar</Button>}
    />
    <TooltipContent side="bottom">
      Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo
    </TooltipContent>
  </Tooltip>`,
    ),
  );
}

/**
 * Aberto por estado inicial. O balão ganha `role="tooltip"` e o gatilho ganha
 * `aria-describedby` apontando para ele — e só enquanto ABERTO, porque um
 * `aria-describedby` apontando para id ausente é atributo inválido.
 */
export function tooltipOpenSource(): string {
  return jsxSnippet(
    IMPORT_DEFAULT,
    withProvider(
      `  <Tooltip defaultOpen>
${triggerIcon()}
    <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
  </Tooltip>`,
    ),
  );
}

/**
 * Atraso de abertura: é o que separa passar o mouse de parar sobre o elemento.
 * O atraso mora no provider, e o gatilho pode encurtá-lo ou alongá-lo para si.
 * Quem chega pelo teclado não é afetado — o foco abre na hora, porque não há
 * como "parar em cima" sem mouse.
 */
export function tooltipWithDelaySource(): string {
  return jsxSnippet(
    IMPORT_DEFAULT,
    withProvider(
      `  <Tooltip>
    <TooltipTrigger
      delay={600}
      render={(props) => (
        <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
          <Save aria-hidden="true" />
        </Button>
      )}
    />
    <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
  </Tooltip>`,
      600,
    ),
  );
}

/**
 * O gatilho já se explica sozinho — o botão tem texto — e o balão só acrescenta
 * o que ele faz. É a regra do componente: o tooltip nunca é o único portador da
 * informação. Levar o mouse do gatilho até o balão não fecha nada, que é a
 * persistência exigida pela WCAG 1.4.13.
 */
export function tooltipPersistenteSource(): string {
  return jsxSnippet(
    IMPORT_TOOLTIP,
    withProvider(
      `  <Tooltip>
    <TooltipTrigger
      render={(props) => <Button {...props} variant="outline">Compartilhar</Button>}
    />
    <TooltipContent side="bottom">
      Cria um link público de leitura
    </TooltipContent>
  </Tooltip>`,
    ),
  );
}

/**
 * Controlado de fora. Dois botões, e não um que alterna: o `pointerdown` do
 * clique fora dispensa o balão ANTES do `click`, então um alternador leria o
 * estado já invertido pela lib e reabriria o que acabou de fechar.
 */
export function tooltipControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT_DEFAULT}`,
    `const [aberto, setAberto] = useState(false);

<TooltipProvider>
  <div className="nds-stack" data-spacing="sm">
    <div className="nds-cluster" data-spacing="md">
      <Button onClick={() => setAberto(true)}>Abrir externamente</Button>
      <Button variant="outline" onClick={() => setAberto(false)}>
        Fechar externamente
      </Button>
    </div>

    <Tooltip open={aberto} onOpenChange={setAberto}>
${triggerIcon()}
      <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
    </Tooltip>
  </div>
</TooltipProvider>`,
  );
}

/**
 * Ajuda ao lado do rótulo de um campo.
 *
 * O ícone "?" carrega o próprio `aria-label` — o balão explica ONDE achar o
 * valor, e não o que o botão é. O campo continua rotulado pelo `<label>`: o
 * tooltip acrescenta contexto, nunca sustenta o nome de ninguém.
 */
export function tooltipHelpInFormFieldSource(): string {
  return jsxSnippet(
    IMPORT_TOOLTIP,
    withProvider(
      `  <div className="nds-stack nds-w-sm" data-spacing="xs" data-align="start">
    <div className="nds-cluster" data-spacing="sm">
      <label htmlFor="api-token" className="nds-text-body nds-font-medium">
        Token de API
      </label>

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline" size="icon-sm" aria-label="Ajuda sobre Token de API">
              ?
            </Button>
          )}
        />
        <TooltipContent side="right">
          Gere em Configurações › Acesso › Tokens
        </TooltipContent>
      </Tooltip>
    </div>

    <input id="api-token" type="text" className="nds-input" placeholder="sk-..." />
  </div>`,
    ),
  );
}

/**
 * Sigla de métrica explicada no cabeçalho de um número.
 *
 * O balão define a sigla sem ocupar espaço vertical no painel. `side` fica no
 * padrão: num cabeçalho de KPI o espaço de sobra é acima, e escrever o lado
 * aqui prometeria o que a borda pode desmentir.
 */
export function tooltipMetricDescriptionSource(): string {
  return jsxSnippet(
    IMPORT_TOOLTIP,
    withProvider(
      `  <div className="nds-stack" data-spacing="xs" data-align="start">
    <div className="nds-cluster" data-spacing="sm">
      <p className="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">
        LCP
      </p>

      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline" size="icon-sm" aria-label="O que é LCP">
              i
            </Button>
          )}
        />
        <TooltipContent className="nds-whitespace-normal">
          Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
        </TooltipContent>
      </Tooltip>
    </div>

    <p className="nds-text-h3 nds-m-0">1,8 s</p>
  </div>`,
    ),
  );
}

/**
 * Atalho ao lado de uma barra de ferramentas: o nome acessível continua sendo o
 * do botão, e a tecla é conveniência — nunca a informação que faltava.
 */
export function barTooltipShortcutSource(): string {
  return jsxSnippet(
    IMPORT_DEFAULT,
    withProvider(
      `  <div className="nds-cluster" data-align="center" data-spacing="xs">
    <Tooltip>
${triggerIcon()}
      <TooltipContent side="bottom">
        <span>Salvar</span>
        <kbd className="nds-kbd" data-slot="kbd">Ctrl</kbd>
        <kbd className="nds-kbd" data-slot="kbd">S</kbd>
      </TooltipContent>
    </Tooltip>
  </div>`,
    ),
  );
}

/**
 * Colisão: `side` é preferência, e a borda decide.
 *
 * Sem espaço acima, o balão nasce ABAIXO do gatilho em vez de sair da tela, e
 * `data-side` passa a trazer o lado final — que é o que o CSS compartilhado lê.
 * Quem escreve `side="top"` escreve uma preferência, nunca uma garantia.
 */
export function tooltipCollisionSource(): string {
  return jsxSnippet(
    IMPORT_TOOLTIP,
    withProvider(
      `  {/* Encostado no topo da janela, o balão vira para baixo sozinho:
      \`side\` é preferência, e \`data-side\` traz o lado FINAL. */}
  <Tooltip>
    <TooltipTrigger
      render={(props) => <Button {...props} variant="outline">Salvar</Button>}
    />
    <TooltipContent side="top">Salvar</TooltipContent>
  </Tooltip>`,
    ),
  );
}

/**
 * Espera compartilhada do grupo.
 *
 * O provedor guarda duas medidas diferentes: `delay` é quanto o PRIMEIRO balão
 * faz o ponteiro esperar, e `timeout` é por quanto tempo, depois de um fechar,
 * o vizinho abre NA HORA. É o que torna uma barra de ações percorrível sem
 * acender um balão a cada milímetro e sem cobrar a espera de novo em cada item.
 */
export function tooltipGroupWaitSource(): string {
  return jsxSnippet(
    IMPORT_TOOLTIP,
    `<TooltipProvider delay={800} timeout={5000}>
  {/* \`delay\`: o primeiro balão espera. \`timeout\`: fechado o primeiro, o
      vizinho abre sem esperar enquanto a janela do grupo durar. */}
  <div className="nds-cluster" data-spacing="md">
    <Tooltip>
      <TooltipTrigger
        render={(props) => <Button {...props} variant="outline">Copiar</Button>}
      />
      <TooltipContent>Copiar</TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger
        render={(props) => <Button {...props} variant="outline">Colar</Button>}
      />
      <TooltipContent>Colar</TooltipContent>
    </Tooltip>
  </div>
</TooltipProvider>`,
  );
}

/**
 * Os quatro lados. `side` é preferência, não garantia: perto da borda o balão
 * vira para o lado oposto em vez de sair da tela, e é por isso que o snippet
 * ensina os quatro juntos em vez de prometer um deles.
 */
export function tooltipLadosSource(): string {
  return jsxSnippet(
    `${IMPORT_TOOLTIP}

const lados = ["top", "right", "bottom", "left"] as const;`,
    withProvider(
      `  <div className="nds-grid nds-p-8" data-spacing="xl" data-cols="2">
    {lados.map((lado) => (
      <Tooltip key={lado} defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline" aria-label={lado}>
              {lado}
            </Button>
          )}
        />
        <TooltipContent side={lado}>Tooltip {lado}</TooltipContent>
      </Tooltip>
    ))}
  </div>`,
    ),
  );
}
