/**
 * Transforms do painel Code do Tooltip.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * São QUATRO arquivos de story mostrando o mesmo componente, e por muito tempo
 * só o Playground tinha construtor: as outras onze stories imprimiam o template
 * cru, com `args.`, com o andaime de captura e com atributo que a diretiva
 * escreve em runtime. Quem lê a docs page copia o snippet, não o preview.
 *
 * O que é ANDAIME e por isso não entra em nenhum snippet: o `nds-p-8` que dá ao
 * balão portalizado contra o que se posicionar dentro do quadro do Storybook, e
 * o `[delay]="0"` que faz o hover abrir na hora para a `play` — espera zero não
 * é o padrão que se ensina, é o que o teste precisa. O único snippet que fala
 * de espera é o da própria story de espera.
 *
 * O que o snippet ensina: o `ndsTooltipProvider` entra UMA VEZ, no root da
 * aplicação, e é ele que guarda o atraso comum a todos os balões. O gatilho
 * carrega o próprio `aria-label` — o balão COMPLEMENTA o nome acessível, nunca
 * o substitui, e um botão de ícone sem rótulo continua mudo mesmo com tooltip.
 */
import { HELP_ICON, INFO_ICON, SAVE_ICON } from './tooltip.fixtures';

export type TooltipArgs = {
  label: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  delay: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TOOLTIP_IMPORT = "import { NDS_TOOLTIP } from '@/components/ui/tooltip';";
const BUTTON_IMPORT = "import { NdsButton } from '@/components/ui/button';";

/**
 * O desenho do ícone no nível de recuo em que ele aparece no exemplo.
 *
 * As fixtures guardam o markup com recuo de 8 espaços — o que ele tem na story
 * de onde saiu. Reindentar aqui é o que deixa o mesmo desenho servir a um
 * gatilho no topo do exemplo e a outro dentro de um cartão, sem uma segunda
 * cópia do SVG para envelhecer sozinha.
 */
function iconAt(markup: string, indent: number): string {
  return markup.replace(/\n {8}/g, `\n${' '.repeat(indent)}`);
}

/**
 * O gatilho só-ícone.
 *
 * O `aria-label` é do BOTÃO, e não do balão: quem chega pelo toque nunca vê o
 * balão, e sem o rótulo o gatilho fica anônimo. O ícone sai da árvore de
 * acessibilidade (`aria-hidden` vem no próprio desenho) para não competir com
 * ele.
 *
 * Rótulo longo quebra os atributos em linhas, como a story escreve: uma linha
 * de 120 colunas no painel Code obriga quem lê a rolar na horizontal para
 * descobrir justamente o atributo que importa aqui.
 */
function iconTrigger(
  label: string,
  markup: string,
  size: 'icon' | 'icon-sm',
  pad: string,
): string {
  const inline = `${pad}<button ndsTooltipTrigger ndsButton variant="ghost" size="${size}" aria-label="${label}">`;
  const head =
    inline.length <= 100
      ? inline
      : [
          `${pad}<button`,
          `${pad}  ndsTooltipTrigger`,
          `${pad}  ndsButton`,
          `${pad}  variant="ghost"`,
          `${pad}  size="${size}"`,
          `${pad}  aria-label="${label}"`,
          `${pad}>`,
        ].join('\n');

  return `${head}
${pad}  ${iconAt(markup, pad.length + 2)}
${pad}</button>`;
}

/**
 * O provider em volta do exemplo.
 *
 * Ele aparece em TODOS os snippets, com o comentário, porque cada docs page é
 * lida isolada: quem abre a variante de atalho não passou pelo Playground e
 * precisa saber ali mesmo que o provider é um só, no root — declarar um por
 * balão é o erro que este comentário existe para evitar.
 */
function withProvider(inner: string, attrs = ''): string {
  return `    <!-- Uma vez no root da app -->
    <div ndsTooltipProvider${attrs}>
${inner}
    </div>`;
}

/** O componente que se escreve: imports, template e — quando há estado — corpo. */
function example(
  imports: string[],
  componentImports: string,
  template: string,
  body?: string,
): string {
  return `${imports.join('\n')}

@Component({
  imports: [${componentImports}],
  template: \`
${template}
  \`,
})
export class Exemplo {${body ? `\n${body}\n` : ''}}`;
}

/**
 * Ver a nota em separator.source.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos args. O `transform` devolve o
 * uso real, com os valores atuais dos controls.
 */
export function tooltipPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<TooltipArgs> } = {},
): string {
  const {
    label = 'Salvar (Ctrl+S)',
    side = 'top',
    align = 'center',
    sideOffset = 4,
    delay = 0,
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet — documentação que repete valor
  // padrão ensina ruído.
  const position = [
    side !== 'top' ? `side="${side}"` : '',
    align !== 'center' ? `align="${align}"` : '',
    sideOffset !== 4 ? `[sideOffset]="${sideOffset}"` : '',
  ].filter(Boolean).join(' ');
  const content = position ? `<ng-template ndsTooltipContent ${position}>` : '<ng-template ndsTooltipContent>';

  return `import { NDS_TOOLTIP } from '@/components/ui/tooltip';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_TOOLTIP, NdsButton],
  template: \`
    <!-- Uma vez no root da app -->
    <div ndsTooltipProvider [delay]="${delay}">
      <span ndsTooltip>
        <button ndsTooltipTrigger ndsButton variant="outline" size="icon" aria-label="Salvar">
          ${SAVE_ICON.replace(/\n/g, '\n  ')}
        </button>

        ${content}${label}</ng-template>
      </span>
    </div>
  \`,
})
export class Exemplo {}`;
}

// ─── Variantes ────────────────────────────────────────────────────────────────

/**
 * Texto curto — a variante padrão.
 *
 * `defaultOpen` fica no snippet porque é a única forma de o balão existir no
 * DOM sem interação: ele nasce e morre com a abertura, e é assim que a
 * regressão visual o alcança. Quem copia recebe a mesma tela que está vendo.
 */
export function tooltipDefaultSource(): string {
  return example(
    [TOOLTIP_IMPORT, BUTTON_IMPORT],
    '...NDS_TOOLTIP, NdsButton',
    withProvider(`      <span ndsTooltip [defaultOpen]="true">
${iconTrigger('Salvar', SAVE_ICON, 'icon', '        ')}

        <ng-template ndsTooltipContent>Salvar</ng-template>
      </span>`),
  );
}

/**
 * Com atalho de teclado.
 *
 * O `data-slot="kbd"` não é decoração: é o gancho de
 * `.nds-tooltip-content:has([data-slot="kbd"])` na folha compartilhada, que
 * encurta o respiro à direita do balão. Sem ele a regra existe e não pinta
 * nada — a tecla fica com folga a mais de um lado só. É o único `data-slot`
 * que um snippet de Tooltip escreve; os outros a diretiva escreve sozinha.
 */
export function tooltipWithShortcutSource(): string {
  return example(
    [TOOLTIP_IMPORT, BUTTON_IMPORT],
    '...NDS_TOOLTIP, NdsButton',
    withProvider(`      <span ndsTooltip [defaultOpen]="true">
${iconTrigger('Salvar', SAVE_ICON, 'icon', '        ')}

        <ng-template ndsTooltipContent>
          <span>Salvar</span>
          <kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd>
          <kbd class="nds-kbd" data-slot="kbd">S</kbd>
        </ng-template>
      </span>`),
  );
}

/**
 * Texto longo, num gatilho que já se explica sozinho.
 *
 * O balão quebra dentro do limite de largura que a folha define; passou disso,
 * o conteúdo deixou de ser tooltip e virou Popover. O texto vai numa linha só
 * de propósito: o balão é `inline-flex`, e recuo em volta do texto viraria
 * espaço visível dentro dele.
 */
export function tooltipLongTextSource(): string {
  return example(
    [TOOLTIP_IMPORT, BUTTON_IMPORT],
    '...NDS_TOOLTIP, NdsButton',
    withProvider(`      <span ndsTooltip [defaultOpen]="true">
        <button ndsTooltipTrigger ndsButton variant="outline">Compartilhar</button>

        <ng-template ndsTooltipContent side="bottom">Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo</ng-template>
      </span>`),
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Fechado — o estado inicial, e o uso mais comum do componente.
 *
 * Não há prop nenhuma para isso: fechado é o que o componente faz sem que se
 * peça, e o balão sequer existe no DOM. É o que torna o `aria-describedby`
 * seguro, porque ele só é escrito enquanto há um balão para apontar.
 */
export function tooltipClosedSource(): string {
  return example(
    [TOOLTIP_IMPORT, BUTTON_IMPORT],
    '...NDS_TOOLTIP, NdsButton',
    withProvider(`      <span ndsTooltip>
${iconTrigger('Salvar', SAVE_ICON, 'icon', '        ')}

        <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
      </span>`),
  );
}

/**
 * Aberto por estado de fora.
 *
 * As duas pontas: `open` manda, `openChange` avisa. Ligar só a primeira é o
 * defeito clássico — o balão fecha sozinho no Escape e no blur, e o estado de
 * fora continua dizendo que está aberto.
 */
export function tooltipOpenSource(): string {
  return example(
    [TOOLTIP_IMPORT, BUTTON_IMPORT],
    '...NDS_TOOLTIP, NdsButton',
    withProvider(`      <span ndsTooltip [open]="isOpen()" (openChange)="isOpen.set($event)">
${iconTrigger('Salvar', SAVE_ICON, 'icon', '        ')}

        <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
      </span>`),
    `  // Sinal, e não campo comum: é a escrita no sinal que agenda o redesenho.
  readonly isOpen = signal(true);`,
  );
}

/**
 * A espera antes de abrir no hover — o que separa PASSAR o mouse de PARAR sobre
 * o elemento.
 *
 * Ela mora no provider, uma vez, e vale para todos os balões da aplicação;
 * declará-la em cada balão ensinaria a duplicar o que já é comum. Quem chega
 * pelo teclado não espera: o foco abre na hora, porque não há como parar em
 * cima sem mouse — e é por isso que este mesmo snippet serve às stories de
 * hover e de foco, que renderizam exatamente este markup.
 */
export function tooltipDelaySource(): string {
  return example(
    [TOOLTIP_IMPORT, BUTTON_IMPORT],
    '...NDS_TOOLTIP, NdsButton',
    withProvider(
      `      <span ndsTooltip>
${iconTrigger('Salvar', SAVE_ICON, 'icon', '        ')}

        <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
      </span>`,
      ' [delay]="600"',
    ),
  );
}

/**
 * O balão que não some quando o mouse vai até ele.
 *
 * Persistência é requisito da WCAG 1.4.13, e aqui ela é do componente: não há
 * prop para ligar nem desligar. O gatilho é um botão com texto, porque o balão
 * acrescenta contexto a algo que já se entende sozinho — nunca é o único
 * portador da informação.
 */
export function tooltipPersistenceSource(): string {
  return example(
    [TOOLTIP_IMPORT, BUTTON_IMPORT],
    '...NDS_TOOLTIP, NdsButton',
    withProvider(`      <span ndsTooltip>
        <button ndsTooltipTrigger ndsButton variant="outline">Compartilhar</button>

        <ng-template ndsTooltipContent side="bottom">Cria um link público de leitura</ng-template>
      </span>`),
  );
}

// ─── Composições ──────────────────────────────────────────────────────────────

/**
 * Botão de ação rápida com o atalho no balão.
 *
 * A ordem da informação é a regra: o `aria-label` já diz o que o botão faz, e a
 * tecla é conveniência. Invertido — rótulo genérico e a ação só no balão — quem
 * usa toque fica sem a informação.
 */
export function tooltipIconButtonShortcutSource(): string {
  return example(
    [TOOLTIP_IMPORT, BUTTON_IMPORT],
    '...NDS_TOOLTIP, NdsButton',
    withProvider(
      `      <span ndsTooltip>
${iconTrigger('Salvar', SAVE_ICON, 'icon', '        ')}

        <ng-template ndsTooltipContent>
          <span>Salvar</span>
          <kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd>
          <kbd class="nds-kbd" data-slot="kbd">S</kbd>
        </ng-template>
      </span>`,
      ' class="nds-cluster" data-spacing="sm"',
    ),
  );
}

/**
 * Ajuda ao lado do rótulo de um campo.
 *
 * Quem nomeia o campo é o `for`/`id` do rótulo, e não o balão: o Tooltip diz
 * ONDE achar o valor, informação que pode faltar sem quebrar o formulário. O
 * ícone de ajuda é um BOTÃO focável com nome próprio — pendurar o balão num
 * `<span>` o deixaria fora do alcance do teclado.
 */
export function tooltipFormFieldHelpSource(): string {
  return example(
    [
      TOOLTIP_IMPORT,
      BUTTON_IMPORT,
      "import { NdsInput } from '@/components/ui/input';",
      "import { NdsLabel } from '@/components/ui/label';",
    ],
    '...NDS_TOOLTIP, NdsButton, NdsInput, NdsLabel',
    withProvider(
      `      <div class="nds-cluster" data-spacing="sm">
        <label ndsLabel for="token-api">Token da API</label>

        <span ndsTooltip>
${iconTrigger('Onde encontrar o token da API', HELP_ICON, 'icon-sm', '          ')}

          <ng-template ndsTooltipContent side="right">Gere em Configurações › Acesso › Tokens</ng-template>
        </span>
      </div>

      <input ndsInput id="token-api" placeholder="ndsk_..." />`,
      ' class="nds-stack nds-w-sm" data-spacing="sm"',
    ),
  );
}

/**
 * A sigla de uma métrica, expandida no balão.
 *
 * A sigla continua VISÍVEL no cartão; o balão só a estende. É a diferença entre
 * complementar e esconder — em toque não há hover, e o número precisa continuar
 * legível sem o balão.
 */
export function tooltipMetricDescriptionSource(): string {
  return example(
    [
      TOOLTIP_IMPORT,
      BUTTON_IMPORT,
      "import { NDS_CARD } from '@/components/ui/card';",
    ],
    '...NDS_TOOLTIP, ...NDS_CARD, NdsButton',
    withProvider(`      <div ndsCard class="nds-p-4 nds-w-sm">
        <div ndsCardHeader>
          <div class="nds-cluster" data-spacing="sm">
            <span ndsCardTitle>LCP</span>

            <span ndsTooltip>
${iconTrigger('O que é LCP', INFO_ICON, 'icon-sm', '              ')}

              <ng-template ndsTooltipContent>LCP — Largest Contentful Paint</ng-template>
            </span>
          </div>
        </div>

        <div ndsCardContent>
          <p class="nds-text-h3 nds-m-0">1,8 s</p>
        </div>
      </div>`),
  );
}

/**
 * Os quatro lados.
 *
 * `side` é preferência, não garantia: perto da borda o balão vira para o lado
 * oposto em vez de sair da tela, e por isso o snippet ensina os quatro juntos
 * em vez de prometer um. A lista é tipada como `TooltipSide[]` porque um
 * `string[]` não passaria no `[side]` — e o erro apareceria só no `ngc`, longe
 * de quem copiou.
 */
export function tooltipPlacementSidesSource(): string {
  // Escrito por extenso, e não pelo molde acima, por causa de quem o lê depois:
  // a guarda transversal varre o TEXTO deste módulo para saber o que a classe
  // do exemplo declara. Montada por interpolação, a lista `sides` some dessa
  // leitura e o laço passa a parecer um binding sem membro — que é exatamente o
  // defeito que aquela guarda existe para pegar. O molde continua servindo aos
  // outros dez snippets, nenhum dos quais itera coisa alguma.
  return `import { NDS_TOOLTIP, type TooltipSide } from '@/components/ui/tooltip';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_TOOLTIP, NdsButton],
  template: \`
    <!-- Uma vez no root da app -->
    <div ndsTooltipProvider class="nds-grid" data-cols="2" data-spacing="xl">
      @for (side of sides; track side) {
        <span ndsTooltip [defaultOpen]="true">
          <button ndsTooltipTrigger ndsButton variant="outline">{{ side }}</button>

          <ng-template ndsTooltipContent [side]="side">Tooltip {{ side }}</ng-template>
        </span>
      }
    </div>
  \`,
})
export class Exemplo {
  readonly sides: TooltipSide[] = ['top', 'right', 'bottom', 'left'];
}`;
}
