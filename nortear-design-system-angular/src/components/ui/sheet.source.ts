/**
 * Transforms do painel Code do Sheet.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * São QUATRO arquivos de story mostrando o mesmo componente, e até esta rodada
 * só o Playground tinha construtor: as outras onze stories imprimiam o template
 * CRU — `{{ tituloPainel }}` ligado a uma prop que só existe dentro da story,
 * `[side]="side"` apontando para um control que o leitor não tem. Quem lê a docs
 * page copia o snippet, não o preview.
 *
 * O que é ANDAIME e por isso não entra em snippet nenhum: as props de rótulo que
 * a story injeta para trazer o conteúdo trilíngue (`tituloPainel`, `panelBody`,
 * `rotuloCancelar`) e o `(openChange)` do Playground, que está ligado ao espião
 * da `play`. No snippet o texto entra RESOLVIDO, que é o que a pessoa escreve.
 *
 * O que o snippet ensina, e é a lição do componente:
 *
 *  · `side` mora no CONTEÚDO, nunca na raiz — é o erro mais fácil de cometer
 *    aqui, porque é a raiz que tem `open`, `defaultOpen` e `modal`;
 *  · o par `ndsSheetTitle` + `ndsSheetDescription` é o que dá NOME e DESCRIÇÃO
 *    acessíveis ao diálogo. Sem o título o leitor de tela anuncia "diálogo" e
 *    nada mais, e nenhum teste de render percebe;
 *  · a saída é sempre explícita: o X do canto vem de graça, e quando ele é
 *    dispensado (`[showCloseButton]="false"`) o rodapé tem de oferecer outra.
 *
 * Os textos saem do MESMO `translations.json` que a story usa; ler dali, e não
 * repetir literal, é o que impede o snippet de ensinar um rótulo que a
 * demonstração não mostra mais. As QUATRO composições são a exceção declarada:
 * elas escrevem os próprios textos dentro da story, e o snippet os repete como
 * estão — copiar de `translations.json` ali inventaria uma sincronia que a
 * story não tem. O que elas repetem é conferido contra o conteúdo compartilhado
 * no `sheet.source.test.ts`: cinco seções no menu, três ações no painel
 * inferior, três campos no perfil, dois campos nos filtros.
 */
import { useTranslation } from '@/lib/i18n';
import sheetTranslations from '@shared/content/sheet/translations.json';
import type { SheetSide } from './sheet';

const { t } = useTranslation(sheetTranslations as Record<string, unknown>);

export type SheetArgs = {
  side: SheetSide;
  showCloseButton: boolean;
  modal: boolean;
  defaultOpen: boolean;
  triggerLabel: string;
  onOpenChange: (isOpen: boolean) => void;
};

const SHEET_IMPORT = "import { NDS_SHEET } from '@/components/ui/sheet';";
const BUTTON_IMPORT = "import { NdsButton } from '@/components/ui/button';";
const INPUT_IMPORT = "import { NdsInput } from '@/components/ui/input';";
const LABEL_IMPORT = "import { NdsLabel } from '@/components/ui/label';";

/**
 * Os rótulos do conteúdo compartilhado, lidos NA CHAMADA.
 *
 * Não numa constante de módulo: o idioma é global do Storybook e muda sem
 * recarregar a página. Resolvido uma vez na importação, o snippet congelaria no
 * idioma em que a aba abriu.
 */
function labels() {
  return {
    trigger: t('demonstration.labels.trigger'),
    title: t('demonstration.labels.title'),
    description: t('demonstration.labels.description'),
    body: t('demonstration.labels.body'),
    cancel: t('demonstration.labels.cancel'),
    apply: t('demonstration.labels.apply'),
  };
}

/** Atributos que sobraram depois de omitir os padrões, com o espaço à esquerda. */
function attrs(...list: Array<string | false | undefined>): string {
  const used = list.filter(Boolean);
  return used.length ? ` ${used.join(' ')}` : '';
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
 * A forma canônica do painel: raiz, gatilho e o `ng-template` de conteúdo com
 * cabeçalho, corpo e rodapé.
 *
 * `triggerLabel` ausente é o painel SEM gatilho interno — o caso controlado, em
 * que quem abre é um botão de fora. Corpo e rodapé ausentes são o painel só de
 * cabeçalho, que é o que as stories de direção e de estado fechado renderizam:
 * inventar um corpo aqui mostraria uma tela que não está ao lado.
 */
function sheetMarkup(o: {
  rootAttrs?: string;
  contentAttrs?: string;
  triggerLabel?: string;
  title: string;
  description: string;
  body?: string;
  footer?: string;
  pad?: string;
  /**
   * Nível do cabeçalho do título. Padrão `h2`, que é o que quase toda story
   * mostra; a diretiva casa de `h1` a `h6`, porque o nível certo depende da
   * hierarquia da página em volta e não do componente.
   */
  titleTag?: string;
}): string {
  const pad = o.pad ?? '    ';
  const p2 = `${pad}  `;
  const p4 = `${pad}    `;

  const triggerLine =
    o.triggerLabel === undefined
      ? ''
      : `${p2}<button ndsSheetTrigger ndsButton variant="outline">${o.triggerLabel}</button>\n\n`;

  const tag = o.titleTag ?? 'h2';

  const blocks = [
    `${p4}<div ndsSheetHeader>
${p4}  <${tag} ndsSheetTitle>${o.title}</${tag}>
${p4}  <p ndsSheetDescription>${o.description}</p>
${p4}</div>`,
    o.body,
    o.footer,
  ].filter(Boolean);

  return `${pad}<nds-sheet${o.rootAttrs ?? ''}>
${triggerLine}${p2}<ng-template ndsSheetContent${o.contentAttrs ?? ''}>
${blocks.join('\n\n')}
${p2}</ng-template>
${pad}</nds-sheet>`;
}

/** Corpo de texto — a área que rola quando o conteúdo passa da altura da tela. */
function textBody(text: string, pad = '        '): string {
  return `${pad}<div ndsSheetBody>
${pad}  <p class="nds-text-body nds-text-muted-foreground">${text}</p>
${pad}</div>`;
}

/**
 * Rodapé: a saída à esquerda, a confirmação à direita.
 *
 * `ndsSheetClose` no botão de saída, e não um `(click)` que mexe em estado: o
 * fechamento é do componente, e escrevê-lo à mão duplicaria o que a diretiva já
 * faz — inclusive devolver o foco ao gatilho.
 */
function footerBlock(cancel: string, action: string | null, pad = '        '): string {
  const primary = action === null ? '' : `\n${pad}  <button ndsButton>${action}</button>`;
  return `${pad}<div ndsSheetFooter>
${pad}  <button ndsSheetClose ndsButton variant="outline">${cancel}</button>${primary}
${pad}</div>`;
}

/**
 * O painel Code imprime o `template` da story literalmente — com os bindings
 * ligados aos args. `transform` devolve o uso real, com os valores atuais dos
 * controls (armadilha 3 do CLAUDE.md deste stack).
 */
export function sheetPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<SheetArgs> } = {},
): string {
  const l = labels();
  const {
    side = 'right',
    showCloseButton = true,
    modal = true,
    defaultOpen = false,
    triggerLabel = l.trigger,
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet: documentação que repete valor
  // padrão ensina ruído.
  return example(
    [SHEET_IMPORT, BUTTON_IMPORT],
    '...NDS_SHEET, NdsButton',
    sheetMarkup({
      rootAttrs: attrs(
        defaultOpen ? '[defaultOpen]="true"' : '',
        modal ? '' : '[modal]="false"',
      ),
      contentAttrs: attrs(
        side === 'right' ? '' : `side="${side}"`,
        showCloseButton ? '' : '[showCloseButton]="false"',
      ),
      triggerLabel,
      title: l.title,
      description: l.description,
      body: textBody(l.body),
      footer: footerBlock(l.cancel, l.apply),
    }),
  );
}

// ─── Variantes: as quatro direções ────────────────────────────────────────────

/**
 * Mesmo painel nas quatro direções — o que muda é `side` e o título.
 *
 * `[defaultOpen]="true"` fica no snippet porque as quatro stories nascem
 * abertas: é assim que a regressão visual as alcança, e sem ele quem copiasse
 * veria um painel fechado sem nada na tela que explicasse a diferença.
 *
 * Nenhuma delas tem corpo — o painel é cabeçalho e rodapé, exatamente o que a
 * story ao lado renderiza.
 */
function sideExample(side: SheetSide, title: string): string {
  const l = labels();
  return example(
    [SHEET_IMPORT, BUTTON_IMPORT],
    '...NDS_SHEET, NdsButton',
    sheetMarkup({
      rootAttrs: ' [defaultOpen]="true"',
      // `side` mora no CONTEÚDO. E `right` é o padrão: escrevê-lo apagaria a
      // informação de que existe um padrão.
      contentAttrs: attrs(side === 'right' ? '' : `side="${side}"`),
      triggerLabel: l.trigger,
      title,
      description: l.description,
      footer: footerBlock(l.cancel, l.apply),
    }),
  );
}

/** Direita: o padrão de desktop — e, por ser padrão, a prop não aparece. */
export function sheetSideRightSource(): string {
  return sideExample('right', t('demonstration.labels.rightLabel'));
}

/** Esquerda: a direção da navegação secundária. */
export function sheetSideLeftSource(): string {
  return sideExample('left', t('demonstration.labels.leftLabel'));
}

/** Topo: largura inteira, altura pelo conteúdo. */
export function sheetSideTopSource(): string {
  return sideExample('top', t('demonstration.labels.topLabel'));
}

/** Base: o mesmo desenho do Drawer, sem o gesto de arrastar. */
export function sheetSideBottomSource(): string {
  return sideExample('bottom', t('demonstration.labels.bottomLabel'));
}

/**
 * O título num nível diferente de `h2`.
 *
 * A diretiva de título casa de `h1` a `h6`, e o nível certo é o que a página em
 * volta pede: aberto de dentro de uma seção que já está em `h2`, o painel entra
 * em `h3` para não repetir o degrau. Nada mais muda — o `aria-labelledby` sai do
 * id REAL do título, e não da tag.
 *
 * Mesma forma das quatro direções, sem direção nenhuma: `right` é o padrão e
 * escrevê-lo apagaria a informação de que existe um padrão. O
 * `[defaultOpen]="true"` fica, pelo mesmo motivo delas — a story nasce aberta, e
 * sem ele quem copiasse veria um painel fechado.
 */
export function sheetHeadingH3Source(): string {
  const l = labels();
  return example(
    [SHEET_IMPORT, BUTTON_IMPORT],
    '...NDS_SHEET, NdsButton',
    sheetMarkup({
      rootAttrs: ' [defaultOpen]="true"',
      triggerLabel: l.trigger,
      titleTag: 'h3',
      title: l.title,
      description: l.description,
      footer: footerBlock(l.cancel, l.apply),
    }),
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Fechado — o estado inicial, e o uso mais comum do componente.
 *
 * Não há prop nenhuma para isso: fechado é o que o componente faz sem que se
 * peça, e o painel sequer chega ao DOM. O gatilho é a única coisa que existe, e
 * é a ausência que é o assunto — por isso o snippet não tem rodapé: não há
 * decisão a tomar num painel que ninguém abriu.
 */
export function sheetClosedSource(): string {
  const l = labels();
  return example(
    [SHEET_IMPORT, BUTTON_IMPORT],
    '...NDS_SHEET, NdsButton',
    sheetMarkup({
      triggerLabel: l.trigger,
      title: l.title,
      description: l.description,
    }),
  );
}

/** Aberto de saída, sem estado externo nenhum: `defaultOpen` e mais nada. */
export function sheetOpenSource(): string {
  const l = labels();
  return example(
    [SHEET_IMPORT, BUTTON_IMPORT],
    '...NDS_SHEET, NdsButton',
    sheetMarkup({
      rootAttrs: ' [defaultOpen]="true"',
      triggerLabel: l.trigger,
      title: l.title,
      description: l.description,
      footer: footerBlock(l.cancel, l.apply),
    }),
  );
}

/**
 * Corpo mais alto que o painel: quem rola é o corpo, e o rodapé fica.
 *
 * Escrito por extenso, e não pelo molde acima, por causa de quem o lê depois: a
 * guarda transversal varre o TEXTO deste módulo para saber o que a classe do
 * exemplo declara. Montada por interpolação, a lista `paragrafos` some dessa
 * leitura e o `@for` passa a parecer um laço sem membro — que é exatamente o
 * defeito que aquela guarda existe para pegar.
 *
 * `ndsSheetBody` é peça do componente, não um `div` com `overflow`: é ele que
 * traz o `flex` que segura o rodapé e o `tabindex` que a região rolável exige
 * (WCAG 2.1.1). E `panelClass` é a escotilha de classe do painel — ela NÃO
 * ajusta largura (as regras de lado vencem qualquer utilitária de largura); a
 * largura sai de `--sheet-width` / `--sheet-max-width`.
 */
export function sheetLongScrollBodySource(): string {
  const l = labels();
  return `${SHEET_IMPORT}
${BUTTON_IMPORT}

@Component({
  imports: [...NDS_SHEET, NdsButton],
  template: \`
    <nds-sheet [defaultOpen]="true">
      <button ndsSheetTrigger ndsButton variant="outline">${l.trigger}</button>

      <ng-template ndsSheetContent panelClass="nds-rounded-xl">
        <div ndsSheetHeader>
          <h2 ndsSheetTitle>${l.title}</h2>
          <p ndsSheetDescription>${l.description}</p>
        </div>

        <div ndsSheetBody class="nds-stack" data-spacing="sm">
          @for (p of paragrafos; track p.id) {
            <p class="nds-text-body">{{ p.text }}</p>
          }
        </div>

        <div ndsSheetFooter>
          <button ndsSheetClose ndsButton variant="outline">${l.cancel}</button>
          <button ndsButton>${l.apply}</button>
        </div>
      </ng-template>
    </nds-sheet>
  \`,
})
export class Exemplo {
  readonly paragrafos = Array.from({ length: 24 }, (_, i) => ({
    id: \`p-\${i}\`,
    text: \`\${i + 1} — ${l.body}\`,
  }));
}`;
}

/**
 * Sem o X do canto.
 *
 * A lição é o PAR, não a prop sozinha: dispensar o botão do canto só se sustenta
 * porque o rodapé oferece uma saída explícita. Sem ela sobraria o Escape, que
 * quem usa mouse não descobre.
 */
export function sheetCloseButtonHiddenSource(): string {
  const l = labels();
  return example(
    [SHEET_IMPORT, BUTTON_IMPORT],
    '...NDS_SHEET, NdsButton',
    sheetMarkup({
      rootAttrs: ' [defaultOpen]="true"',
      contentAttrs: ' [showCloseButton]="false"',
      triggerLabel: l.trigger,
      title: l.title,
      description: l.description,
      footer: footerBlock(l.cancel, null),
    }),
  );
}

/**
 * Estado do lado de fora: `open` entra ligado e `openChange` devolve cada
 * mudança. Ligar só a primeira é o defeito clássico — o painel fecha na tela
 * pelo Escape ou pelo rodapé, o valor de fora continua `true`, e ele reabre no
 * ciclo seguinte de detecção.
 *
 * O estado é um SINAL, e aqui o snippet se afasta de propósito do `props` da
 * story: o renderer do Storybook aceita um campo comum porque monta um objeto
 * de props, mas num componente de verdade quem agenda o redesenho é a escrita
 * no sinal. A tela é a mesma; o que se escreve, não.
 */
export function sheetControlledSource(): string {
  const l = labels();
  const panel = sheetMarkup({
    rootAttrs: ' [open]="isOpen()" (openChange)="isOpen.set($event)"',
    title: l.title,
    description: l.description,
    footer: footerBlock(l.cancel, null, '          '),
    pad: '      ',
  });

  return example(
    [SHEET_IMPORT, BUTTON_IMPORT],
    '...NDS_SHEET, NdsButton',
    `    <div class="nds-stack" data-spacing="sm">
      <button ndsButton variant="outline" (click)="isOpen.set(true)">Abrir pelo estado externo</button>

${panel}
    </div>`,
    '  readonly isOpen = signal(false);',
  );
}

// ─── Composições ──────────────────────────────────────────────────────────────

/**
 * Filtros avançados: o caso canônico do painel direito.
 *
 * O formulário mora no `ndsSheetBody`, e o rodapé fica FORA dele — é o que
 * mantém as ações no lugar quando o formulário cresce. Cada campo tem rótulo
 * ligado por `for`/`id`: é ele que nomeia o campo, e um `placeholder` no lugar
 * do rótulo some no instante em que a pessoa digita.
 */
export function sheetAdvancedFiltersSource(): string {
  return example(
    [SHEET_IMPORT, BUTTON_IMPORT, INPUT_IMPORT, LABEL_IMPORT],
    '...NDS_SHEET, NdsButton, NdsInput, NdsLabel',
    sheetMarkup({
      rootAttrs: ' [defaultOpen]="true"',
      triggerLabel: 'Abrir filtros',
      title: 'Filtros avançados',
      description: 'Configure os filtros para refinar os resultados.',
      body: `        <div ndsSheetBody>
          <form id="filtros-form" class="nds-grid" data-spacing="md" (submit)="$event.preventDefault()">
            <div class="nds-grid" data-spacing="xs">
              <label ndsLabel for="filtro-categoria">Categoria</label>
              <input ndsInput id="filtro-categoria" value="Eletrônicos" />
            </div>
            <div class="nds-grid" data-spacing="xs">
              <label ndsLabel for="filtro-minimo">Preço mínimo</label>
              <input ndsInput id="filtro-minimo" type="number" value="100" />
            </div>
          </form>
        </div>`,
      // Quem aplica é o ENVIO do formulário, religado pelo id. O rodapé mora
      // fora do corpo, então a primária não está dentro do `<form>`: sem o
      // atributo `form` ela é um botão comum, e com dois campos o navegador não
      // faz o envio implícito — o Enter num campo não dispara nada (PRD D10).
      footer: `        <div ndsSheetFooter>
          <button ndsSheetClose ndsButton variant="outline">Cancelar</button>
          <button ndsButton type="submit" form="filtros-form">Aplicar filtros</button>
        </div>`,
    }),
  );
}

/**
 * Navegação secundária: painel esquerdo, sem rodapé — a lista de links É a
 * ação, e não há o que confirmar. A saída é o X do canto.
 *
 * O `nav` leva nome próprio porque a página já tem outra navegação: dois marcos
 * sem nome distinto ficam indistinguíveis para quem navega por marcos.
 */
export function sheetSecondaryNavigationSource(): string {
  return example(
    [SHEET_IMPORT, BUTTON_IMPORT],
    '...NDS_SHEET, NdsButton',
    sheetMarkup({
      rootAttrs: ' [defaultOpen]="true"',
      contentAttrs: ' side="left"',
      triggerLabel: 'Abrir menu',
      title: 'Menu',
      description: 'Navegue entre as áreas do sistema.',
      body: `        <div ndsSheetBody>
          <nav aria-label="Navegação secundária" class="nds-stack" data-spacing="xs">
            <a href="#dashboard" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Dashboard</a>
            <a href="#projetos" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Projetos</a>
            <a href="#equipe" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Equipe</a>
            <a href="#configuracoes" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Configurações</a>
            <a href="#faturas" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Faturas</a>
          </nav>
        </div>`,
    }),
  );
}

/**
 * Edição de perfil: três campos no corpo e o par descartar ↔ confirmar no
 * rodapé.
 *
 * Quem confirma é o `type="submit"` ligado ao `form` pelo id — o rodapé mora
 * FORA do corpo rolável, então o botão não está dentro do formulário e só o
 * atributo o alcança. Um `(click)` solto deixaria de fora o Enter no campo, que
 * é como a maioria envia um formulário curto.
 */
export function sheetProfileEditSource(): string {
  return example(
    [SHEET_IMPORT, BUTTON_IMPORT, INPUT_IMPORT, LABEL_IMPORT],
    '...NDS_SHEET, NdsButton, NdsInput, NdsLabel',
    sheetMarkup({
      rootAttrs: ' [defaultOpen]="true"',
      triggerLabel: 'Editar perfil',
      title: 'Editar perfil',
      description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
      body: `        <div ndsSheetBody>
          <form id="perfil-form" class="nds-grid" data-spacing="md" (submit)="$event.preventDefault()">
            <div class="nds-grid" data-spacing="xs">
              <label ndsLabel for="perfil-nome">Nome</label>
              <input ndsInput id="perfil-nome" value="Juliana Mucci" />
            </div>
            <div class="nds-grid" data-spacing="xs">
              <label ndsLabel for="perfil-usuario">Nome de usuário</label>
              <input ndsInput id="perfil-usuario" value="@julianamucci" />
            </div>
            <div class="nds-grid" data-spacing="xs">
              <label ndsLabel for="perfil-bio">Bio</label>
              <input ndsInput id="perfil-bio" value="Designer de sistemas em São Paulo" />
            </div>
          </form>
        </div>`,
      footer: `        <div ndsSheetFooter>
          <button ndsSheetClose ndsButton variant="outline">Cancelar</button>
          <button ndsButton type="submit" form="perfil-form">Salvar alterações</button>
        </div>`,
    }),
  );
}

/**
 * Painel inferior: uma fileira de ações no corpo, no lugar de formulário.
 *
 * O rodapé só oferece a SAÍDA — a decisão já foi tomada no corpo, e repetir uma
 * confirmação aqui diria que falta um passo que não existe. A destrutiva vem
 * por último e é a única com a variante que a anuncia.
 */
export function sheetBottomPanelSource(): string {
  return example(
    [SHEET_IMPORT, BUTTON_IMPORT],
    '...NDS_SHEET, NdsButton',
    sheetMarkup({
      rootAttrs: ' [defaultOpen]="true"',
      contentAttrs: ' side="bottom"',
      triggerLabel: 'Abrir ações',
      title: 'Ações rápidas',
      description: 'Escolha uma das ações disponíveis para este item.',
      body: `        <div ndsSheetBody>
          <div class="nds-cluster" data-spacing="md">
            <button ndsButton variant="outline">Compartilhar</button>
            <button ndsButton variant="outline">Duplicar</button>
            <button ndsButton variant="destructive">Excluir</button>
          </div>
        </div>`,
      footer: `        <div ndsSheetFooter>
          <button ndsSheetClose ndsButton variant="outline">Fechar</button>
        </div>`,
    }),
  );
}
