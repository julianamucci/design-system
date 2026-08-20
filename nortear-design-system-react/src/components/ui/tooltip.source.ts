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
  propNumero,
  propOpcao,
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

const IMPORT_PADRAO = `${IMPORT_TOOLTIP}
import { Save } from "lucide-react";`;

/**
 * O gatilho é o botão de verdade, não um invólucro: `render` entrega as props
 * do gatilho ao elemento que já existe na interface. Um botão só-ícone precisa
 * do próprio `aria-label` — quem chega pelo toque nunca vê o balão, então o
 * tooltip não pode ser o único portador do nome.
 */
function gatilhoIcone(rotulo = 'Salvar'): string {
  return `    <TooltipTrigger
      render={(props) => (
        <Button {...props} variant="ghost" size="icon" aria-label="${rotulo}">
          <Save aria-hidden="true" />
        </Button>
      )}
    />`;
}

/** Envolve a composição no provider, que é quem governa o atraso de abertura. */
function comProvider(miolo: string, delay?: number): string {
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
  const posicao = attrs(
    propOpcao('side', args.side, LADOS, 'top'),
    propOpcao('align', args.align, ALINHAMENTOS, 'center'),
    typeof args.sideOffset === 'number' && args.sideOffset !== 4
      ? propNumero('sideOffset', args.sideOffset)
      : undefined,
  );
  const raiz = attrs(propBool('defaultOpen', args.defaultOpen));

  return jsxSnippet(
    IMPORT_PADRAO,
    comProvider(
      `  <Tooltip${raiz}>
${gatilhoIcone()}
    <TooltipContent${posicao}>Salvar (Ctrl+S)</TooltipContent>
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
    IMPORT_PADRAO,
    comProvider(
      `  <Tooltip defaultOpen>
${gatilhoIcone()}
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
export function tooltipComAtalhoSource(): string {
  return jsxSnippet(
    IMPORT_PADRAO,
    comProvider(
      `  <Tooltip defaultOpen>
${gatilhoIcone()}
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
export function tooltipTextoLongoSource(): string {
  return jsxSnippet(
    IMPORT_PADRAO,
    comProvider(
      `  <Tooltip defaultOpen>
${gatilhoIcone()}
    <TooltipContent>
      Salva as alterações do documento atual e mantém você na mesma tela.
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
export function tooltipAbertoSource(): string {
  return jsxSnippet(
    IMPORT_PADRAO,
    comProvider(
      `  <Tooltip defaultOpen>
${gatilhoIcone()}
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
export function tooltipComAtrasoSource(): string {
  return jsxSnippet(
    IMPORT_PADRAO,
    comProvider(
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
    comProvider(
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
export function tooltipControladoSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT_PADRAO}`,
    `const [aberto, setAberto] = useState(false);

<TooltipProvider>
  <div className="nds-stack" data-spacing="sm">
    <div className="nds-cluster" data-spacing="sm">
      <Button onClick={() => setAberto(true)}>Abrir externamente</Button>
      <Button variant="outline" onClick={() => setAberto(false)}>
        Fechar externamente
      </Button>
    </div>

    <Tooltip open={aberto} onOpenChange={setAberto}>
${gatilhoIcone()}
      <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
    </Tooltip>
  </div>
</TooltipProvider>`,
  );
}

/**
 * Barra de ações só-ícone: cada botão carrega o próprio `aria-label`, e o balão
 * repete a mesma palavra. Quem usa toque nunca vê o balão, e é o rótulo do
 * botão que sustenta o nome acessível sozinho.
 */
export function tooltipBarraDeIconesSource(): string {
  const acao = (rotulo: string, icone: string) => `    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Button {...props} variant="ghost" size="icon" aria-label="${rotulo}">
            <${icone} aria-hidden="true" />
          </Button>
        )}
      />
      <TooltipContent>${rotulo}</TooltipContent>
    </Tooltip>`;

  return jsxSnippet(
    `${IMPORT_TOOLTIP}
import { Save, Share2, Trash2 } from "lucide-react";`,
    comProvider(
      `  <div
    className="nds-cluster nds-rounded-md nds-border-default nds-p-1 nds-bg-card"
    data-align="center"
    data-spacing="xs"
  >
${acao('Salvar', 'Save')}

${acao('Compartilhar', 'Share2')}

${acao('Excluir', 'Trash2')}
  </div>`,
    ),
  );
}

/**
 * Atalho ao lado de uma barra de ferramentas: o nome acessível continua sendo o
 * do botão, e a tecla é conveniência — nunca a informação que faltava.
 */
export function tooltipAtalhoEmBarraSource(): string {
  return jsxSnippet(
    IMPORT_PADRAO,
    comProvider(
      `  <div className="nds-cluster" data-align="center" data-spacing="xs">
    <Tooltip>
${gatilhoIcone()}
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
 * Os quatro lados. `side` é preferência, não garantia: perto da borda o balão
 * vira para o lado oposto em vez de sair da tela, e é por isso que o snippet
 * ensina os quatro juntos em vez de prometer um deles.
 */
export function tooltipLadosSource(): string {
  return jsxSnippet(
    `${IMPORT_TOOLTIP}

const lados = ["top", "right", "bottom", "left"] as const;`,
    comProvider(
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
