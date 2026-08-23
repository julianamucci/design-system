/**
 * Transforms do painel Code do Resizable.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta e NÃO entra no snippet: o quadro de
 * `width: 520` / `height: 280` que existe para o grupo ter contra o que se
 * medir dentro do Storybook, a `key` que força a remontagem quando o control
 * troca a direção — a lib não suporta trocar o eixo com o grupo montado —, e o
 * espião de `onLayout`. Nada disso é composição que alguém escreva.
 *
 * A decisão de composição, e ela é o assunto do componente: painel tem
 * `flex-basis: 0`, então os tamanhos saem do ESPAÇO LIVRE do grupo. Um grupo sem
 * medida definida no próprio eixo não tem espaço livre nenhum para repartir e os
 * painéis colapsam para zero — visível de imediato no eixo vertical, e invisível
 * no horizontal, onde a altura ainda vem do conteúdo. Por isso o grupo carrega
 * uma altura mínima próprio: a medida vai no GRUPO, que é o contêiner flex, e
 * não num invólucro de fora, onde ela não chegaria aos painéis.
 *
 * A outra decisão: o punho leva sempre `aria-label`, e o rótulo diz o ATALHO. É
 * um `role="separator"` focável — sem nome o leitor de tela anuncia "separador"
 * e para por aí, e o ajuste por teclado não tem nenhuma pista visual que o
 * anuncie.
 */
import {
  attrs,
  indentar,
  jsxSnippet,
  propNumber,
  type SourceTransform,
} from '@/lib/story-source';

export type ResizableArgs = {
  direction: 'horizontal' | 'vertical';
  withHandle: boolean;
  defaultSize: number;
  minSize: number;
  maxSize: number;
};

const DIRECOES = ['horizontal', 'vertical'] as const;

const IMPORT = `import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";`;

/**
 * Moldura do grupo. `nds-min-h-50` fica no PRÓPRIO grupo — ele é o contêiner
 * flex, e é a altura dele que vira espaço livre para os painéis dividirem.
 */
const FRAME = 'nds-rounded-lg nds-border-default nds-max-w-lg nds-min-h-50';

/** Rótulos dos punhos. Cada um nomeia O QUE separa, e nunca só "divisor". */
const LABEL_DEFAULT = 'Redimensionar painéis — use setas para ajustar';
const LABEL_COLUMNS = 'Redimensionar as colunas — use setas para ajustar';
const LABEL_FAIXAS = 'Redimensionar as faixas — use setas para ajustar';
const LABEL_SIDEBAR = 'Redimensionar sidebar e conteúdo — use setas';
const LABEL_CONSOLE = 'Redimensionar editor e console — use setas';

/** Conteúdo centralizado de um painel — o painel é a caixa, não o texto. */
function centralizado(text: string, background = ''): string {
  const classes = ['nds-cluster', 'nds-p-4', 'nds-text-body', 'nds-h-full', background]
    .filter(Boolean)
    .join(' ');
  return `<div className="${classes}" data-align="center" data-justify="center">
  ${text}
</div>`;
}

/** Painel com os limites que a story declara e o conteúdo já indentado. */
function panel(limites: string, content: string): string {
  return `<ResizablePanel${limites}>
${indentar(content)}
</ResizablePanel>`;
}

/** Punho: `withHandle` mostra o pegador; o rótulo é sempre obrigatório. */
function punho(label: string, comPegador = true): string {
  return `<ResizableHandle${comPegador ? ' withHandle' : ''} aria-label="${label}" />`;
}

/** O grupo inteiro, já com a moldura que lhe dá espaço livre para repartir. */
function group(direction: string, children: string, extra = ''): string {
  return `<ResizablePanelGroup
  direction="${direction}"${extra}
  className="${FRAME}"
>
${indentar(children)}
</ResizablePanelGroup>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; nas stories sem args cai no split lateral 30/70 com pegador, que
 * é o que o Playground carrega.
 *
 * O segundo painel recebe o complemento de `defaultSize`, e não um número fixo:
 * dois painéis pedindo 30 e 70 quando o control está em 45 se contradizem, e a
 * lib resolve o conflito em silêncio — o snippet ensinaria uma soma que não
 * fecha.
 */
export const resizableSource: SourceTransform<ResizableArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const direction =
    typeof args.direction === 'string' && (DIRECOES as readonly string[]).includes(args.direction)
      ? args.direction
      : 'horizontal';
  const inicial = typeof args.defaultSize === 'number' ? args.defaultSize : 30;
  const minimum = typeof args.minSize === 'number' ? args.minSize : 20;

  const first = attrs(
    propNumber('defaultSize', inicial),
    propNumber('minSize', minimum),
    typeof args.maxSize === 'number' && args.maxSize !== 100
      ? propNumber('maxSize', args.maxSize)
      : undefined,
  );
  const segundo = attrs(
    propNumber('defaultSize', 100 - inicial),
    propNumber('minSize', minimum),
  );

  return jsxSnippet(
    IMPORT,
    group(
      direction,
      `${panel(
        first,
        `<div className="nds-stack nds-p-4" data-spacing="xs">
  <p className="nds-text-body nds-font-semibold">Sidebar</p>
  <p className="nds-text-caption nds-text-muted-foreground">Navegação do projeto</p>
</div>`,
      )}
${punho(LABEL_DEFAULT, args.withHandle !== false)}
${panel(
  segundo,
  `<div className="nds-stack nds-p-4" data-spacing="xs">
  <p className="nds-text-body nds-font-semibold">Conteúdo principal</p>
  <p className="nds-text-caption nds-text-muted-foreground">
    Arraste o divisor ou use as setas com ele focado.
  </p>
</div>`,
)}`,
    ),
  );
};

/**
 * Split lateral sem pegador. O punho é uma linha de 1px: aqui ele aparece
 * sozinho de propósito, porque é o par de comparação da variante com pegador —
 * e é o que mostra por que a guideline pede o pegador em desktop.
 */
export function resizableHorizontalSource(): string {
  return jsxSnippet(
    IMPORT,
    group(
      'horizontal',
      `${panel(' defaultSize={30} minSize={20} maxSize={50}', centralizado('Sidebar', 'nds-bg-muted'))}
${punho(LABEL_COLUMNS, false)}
${panel(' defaultSize={70} minSize={50}', centralizado('Conteúdo principal'))}`,
    ),
  );
}

/**
 * Split empilhado. Mudar `direction` muda TUDO junto: o eixo do flex, o eixo
 * que os painéis dividem, a espessura e o cursor do punho, e o
 * `aria-orientation` que o punho anuncia — que num grupo vertical é
 * `horizontal`, porque descreve a linha, não o grupo.
 */
export function resizableVerticalSource(): string {
  return jsxSnippet(
    IMPORT,
    group(
      'vertical',
      `${panel(' defaultSize={40} minSize={20}', centralizado('Topo'))}
${punho(LABEL_FAIXAS, false)}
${panel(' defaultSize={60} minSize={20}', centralizado('Rodapé', 'nds-bg-muted'))}`,
    ),
  );
}

/**
 * Grupo dentro de painel. Cada grupo governa só os PRÓPRIOS filhos diretos: é
 * isso que mantém as duas proporções independentes, e o que impede que ajustar
 * a sidebar mexa na altura do console. O grupo de dentro não repete a moldura —
 * ele já herda o espaço do painel que o contém.
 */
export function resizableNestedSource(): string {
  const interno = `<ResizablePanelGroup direction="vertical">
${indentar(
  `${panel(' defaultSize={60} minSize={20}', centralizado('Editor'))}
${punho(LABEL_CONSOLE, false)}
${panel(' defaultSize={40} minSize={20}', centralizado('Console', 'nds-bg-muted-60'))}`,
)}
</ResizablePanelGroup>`;

  return jsxSnippet(
    IMPORT,
    group(
      'horizontal',
      `${panel(' defaultSize={30} minSize={20}', centralizado('Sidebar', 'nds-bg-muted'))}
${punho(LABEL_SIDEBAR, false)}
${panel(' defaultSize={70} minSize={40}', interno)}`,
    ),
  );
}

/**
 * Com pegador. O pegador é DESENHO: não carrega texto, para não entrar na
 * composição do nome acessível do punho — quem diz o que ali se ajusta continua
 * sendo o `aria-label`.
 */
export function resizableWithGrabberSource(): string {
  return jsxSnippet(
    IMPORT,
    group(
      'horizontal',
      `${panel(' defaultSize={50} minSize={20}', centralizado('Antes'))}
${punho(LABEL_DEFAULT)}
${panel(' defaultSize={50} minSize={20}', centralizado('Depois', 'nds-bg-muted'))}`,
    ),
  );
}

/**
 * Reagindo ao ajuste. `onLayout` entrega os tamanhos finais, em porcentagem, uma
 * vez por gesto concluído — e não a cada pixel do arrasto, que encheria de
 * ruído qualquer coisa que escute do outro lado.
 */
export function resizableArrastoSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT}

const [tamanhos, setTamanhos] = useState([50, 50]);`,
    `<div className="nds-stack nds-max-w-lg" data-spacing="sm">
${indentar(
  group(
    'horizontal',
    `${panel(' defaultSize={50} minSize={10}', centralizado('Esquerda'))}
${punho(LABEL_DEFAULT)}
${panel(' defaultSize={50} minSize={10}', centralizado('Direita', 'nds-bg-muted'))}`,
    '\n  onLayout={setTamanhos}',
  ),
)}
  <p className="nds-text-caption nds-text-muted-foreground">
    Tamanhos: {tamanhos.join(" / ")}
  </p>
</div>`,
  );
}

/**
 * Piso e teto. Sem `minSize` insistir na seta faria o painel sumir, e o conteúdo
 * dentro dele junto; `maxSize` é o que impede o painel secundário de ser
 * espremido a nada. Os dois viajam também para o `aria-valuemin` e o
 * `aria-valuemax` do punho, então o limite é anunciado, e não só aplicado.
 */
export function resizableLimitesSource(): string {
  return jsxSnippet(
    IMPORT,
    group(
      'horizontal',
      `${panel(' defaultSize={50} minSize={30} maxSize={60}', centralizado('Limitado'))}
${punho(LABEL_DEFAULT, false)}
${panel(' defaultSize={50} minSize={30}', centralizado('Livre', 'nds-bg-muted'))}`,
    ),
  );
}

/**
 * Alcançável pelo teclado. Nada aqui é opcional: o punho está na ordem de
 * tabulação por ser um controle, e o painel também está, porque ele ROLA — uma
 * região rolável fora do Tab esconde conteúdo de quem não usa mouse.
 */
export function resizableFocusSource(): string {
  return jsxSnippet(
    IMPORT,
    group(
      'horizontal',
      `${panel(' defaultSize={50} minSize={20}', centralizado('Um'))}
${punho(LABEL_DEFAULT, false)}
${panel(' defaultSize={50} minSize={20}', centralizado('Dois', 'nds-bg-muted'))}`,
    ),
  );
}

/**
 * Divisor travado. Continua sendo anunciado — o leitor de tela precisa saber que
 * ali existe uma divisão —, mas nem a seta nem o arrasto movem nada, e o cursor
 * deixa de prometer um gesto que não acontece.
 */
export function resizableTravadoSource(): string {
  return jsxSnippet(
    IMPORT,
    group(
      'horizontal',
      `${panel(' defaultSize={50} minSize={20}', centralizado('Fixo'))}
<ResizableHandle disabled withHandle aria-label="${LABEL_DEFAULT}" />
${panel(' defaultSize={50} minSize={20}', centralizado('Fixo', 'nds-bg-muted'))}`,
    ),
  );
}

/**
 * Editor e resultado lado a lado. O caso clássico da ferramenta de quem escreve
 * código: os dois lados competem pela mesma largura, e quem lê decide na hora
 * qual deles importa mais.
 */
export function resizableEditorPreviewSource(): string {
  return jsxSnippet(
    IMPORT,
    group(
      'horizontal',
      `${panel(
        ' defaultSize={50} minSize={30} maxSize={70}',
        `<div className="nds-stack nds-p-4 nds-text-caption nds-font-mono nds-h-full" data-spacing="xs">
  <span className="nds-text-muted-foreground">editor.tsx</span>
  <span>function App() {"{"}</span>
  <span className="nds-pl-4">return &lt;p&gt;Olá&lt;/p&gt;;</span>
  <span>{"}"}</span>
</div>`,
      )}
${punho(LABEL_DEFAULT)}
${panel(' defaultSize={50} minSize={30}', centralizado('Resultado', 'nds-bg-muted'))}`,
    ),
  );
}

/**
 * Layout de IDE: sidebar à esquerda, editor e console empilhados à direita. É a
 * composição em que o aninhamento se justifica — o console divide a ALTURA do
 * editor, e não a largura da janela inteira.
 */
export function resizableIdeSource(): string {
  const direita = `<ResizablePanelGroup direction="vertical">
${indentar(
  `${panel(
    ' defaultSize={70} minSize={30}',
    `<div className="nds-cluster nds-p-4 nds-text-caption nds-font-mono nds-h-full" data-align="start">
  <span className="nds-text-muted-foreground">App.tsx (1:1)</span>
</div>`,
  )}
${punho(LABEL_CONSOLE)}
${panel(
  ' defaultSize={30} minSize={15}',
  `<div className="nds-cluster nds-bg-muted-60 nds-p-4 nds-text-caption nds-font-mono nds-h-full" data-align="center" data-spacing="sm">
  <span className="nds-text-muted-foreground">{">"}</span>
  <span>npm run dev</span>
</div>`,
)}`,
)}
</ResizablePanelGroup>`;

  return jsxSnippet(
    IMPORT,
    group(
      'horizontal',
      `${panel(
        ' defaultSize={20} minSize={15} maxSize={35}',
        `<div className="nds-stack nds-bg-muted nds-p-4 nds-text-caption nds-h-full" data-spacing="xs">
  <span className="nds-font-medium">Explorer</span>
  <span>src</span>
  <span className="nds-pl-4">App.tsx</span>
  <span className="nds-pl-4">main.tsx</span>
</div>`,
      )}
${punho(LABEL_SIDEBAR)}
${panel(' defaultSize={80} minSize={50}', direita)}`,
    ),
  );
}

/**
 * Três painéis, dois punhos. Cada punho ajusta o par que ele separa — o do meio
 * não empurra o terceiro painel —, e é por isso que cada um precisa de um nome
 * acessível próprio: "redimensionar painéis" repetido duas vezes deixaria quem
 * ouve sem saber qual dos dois está sob o foco.
 */
export function resizableTriploSource(): string {
  return jsxSnippet(
    IMPORT,
    group(
      'horizontal',
      `${panel(' defaultSize={25} minSize={15} maxSize={40}', centralizado('Lista', 'nds-bg-muted'))}
${punho('Redimensionar lista e mensagens — use setas')}
${panel(' defaultSize={50} minSize={25}', centralizado('Mensagens'))}
${punho('Redimensionar mensagens e leitura — use setas')}
${panel(' defaultSize={25} minSize={15} maxSize={40}', centralizado('Leitura', 'nds-bg-muted'))}`,
    ),
  );
}

/**
 * Layout que sobrevive ao recarregamento. `autoSaveId` é o que liga a
 * persistência: sem chave nada é gravado, de propósito — voltar a uma tela com
 * o tamanho de uma sessão antiga que ninguém pediu é surpresa, não conveniência.
 * Só o que a PESSOA ajustou é gravado; redimensionar a janela não conta.
 */
export function resizablePersistidoSource(): string {
  return jsxSnippet(
    IMPORT,
    group(
      'horizontal',
      `${panel(' defaultSize={30} minSize={20} maxSize={50}', centralizado('Sidebar', 'nds-bg-muted'))}
${punho(LABEL_DEFAULT)}
${panel(' defaultSize={70} minSize={50}', centralizado('Conteúdo principal'))}`,
      '\n  autoSaveId="layout-do-editor"',
    ),
  );
}
