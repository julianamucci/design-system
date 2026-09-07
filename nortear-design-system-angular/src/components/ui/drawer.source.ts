/**
 * Transforms do painel Code do Drawer, e os rótulos que ele publica.
 *
 * Módulo à parte porque a guarda `source-snippets.test.ts` só alcança o que é
 * exportado de um `*.source.ts`: construtor inline não é chamável por ela, e o
 * texto que o leitor copia ficava sem portão. Exportar do próprio `.stories.ts`
 * não serve — export que não é story vira story fantasma na barra lateral.
 *
 * `LABEL` mora aqui, e não na story, porque o construtor fecha sobre ele. A
 * story o importa de volta: o mesmo texto alimenta o snippet, a demonstração e
 * as asserções de nome e descrição acessíveis, sem valor duplicado em dois
 * lugares.
 *
 * SÃO QUATRO ARQUIVOS DE STORY mostrando o mesmo componente, e até esta rodada
 * só o Playground tinha construtor: as outras DOZE stories imprimiam o template
 * CRU no painel Code — `{{ interpolação }}` contra o objeto de props que o
 * renderer do Angular monta, `(openChange)="isOpen = $event"` escrito contra um
 * campo comum que componente nenhum tem, e o `[defaultOpen]="true"` que existe
 * só para a foto do Chromatic sair com o painel aberto. Quem lê a docs page
 * copia o snippet, não o preview.
 *
 * O que é ANDAIME e por isso não entra em snippet nenhum:
 *
 *  · `{{ tituloPainel }}`, `{{ rotuloGatilho }}` e companhia — nomes de campos
 *    do objeto de `props` do renderer. O snippet escreve o texto por extenso,
 *    resolvido do conteúdo compartilhado;
 *  · `[defaultOpen]="true"` das stories de direção, de composição e da
 *    NotDismissible. Ali ele existe para a captura visual, e não porque um
 *    drawer de produção nasça aberto. Só aparece onde abrir na montagem É o
 *    assunto — a story Open;
 *  · `(openChange)="isOpen = $event"` e `(click)="isOpen = true"` da story
 *    controlada. Atribuição a campo comum só redesenha porque quem agenda a
 *    detecção ali é o próprio evento do renderer; num componente de verdade o
 *    estado mora num SINAL, e é o par `[open]`/`(openChange)` com `set` que os
 *    snippets publicam;
 *  · `(openChange)="onOpenChange($event)"` do Playground, que é o espião da
 *    `play`. Quem ensina o par controlado é a story Controlled, com estado de
 *    verdade.
 *
 * O que os snippets ensinam, e é a lição do componente:
 *
 *  · o miolo mora num `<ng-template ndsDrawerContent>`, e só é instanciado
 *    quando o painel abre — nó projetado pertence à view de quem consome, e o
 *    portal o removeria do DOM sem destruir as diretivas;
 *  · o par `ndsDrawerTitle` + `ndsDrawerDescription` não é enfeite de layout: o
 *    primitivo liga `aria-labelledby`/`aria-describedby` aos ids REAIS deles, e
 *    é daí que sai o nome acessível do diálogo. Sem título, o painel modal abre
 *    anônimo — o defeito silencioso deste componente;
 *  · o rodapé com `ndsDrawerClose` é a saída explícita, e ela é obrigatória
 *    onde o descarte por ponteiro está desligado;
 *  · a ALÇA não se escreve: o componente a desenha sozinho, `aria-hidden`, sem
 *    foco, e o CSS compartilhado só a mostra na direção de baixo. Escrevê-la no
 *    snippet ensinaria markup que o componente já entrega — e uma parada de
 *    tabulação que não faz nada;
 *  · `direction` só aparece quando difere de `bottom`, e `modal` só quando está
 *    desligado: documentação que repete valor padrão ensina ruído.
 *
 * UMA STORY NÃO GANHA CONSTRUTOR PRÓPRIO, e a exclusão se declara aqui:
 * `States/DragToDismiss` reusa `drawerPlaygroundSource`. O gesto de arraste não
 * liga prop nenhuma — ele vem do motor de pointer que o componente já monta —,
 * e o template daquela story é exatamente o drawer canônico, fechado, com
 * gatilho, cabeçalho e rodapé. Um construtor próprio seria uma segunda cópia do
 * mesmo texto, com a chance de as duas divergirem; o `drawer.source.test.ts`
 * cobra a igualdade, para que a reutilização continue verdadeira.
 */
import type { DrawerDirection } from './drawer';
import { useTranslation, type TranslationOverrides } from '@/lib/i18n';
import { stripHtml } from '@/lib/strip-html';
import drawerTranslations from '@shared/content/drawer/translations.json';

/**
 * Os quatro rótulos de demonstração que o conteúdo compartilhado não traz.
 *
 * São os MESMOS de `LABELS_DRAWER` em `DrawerDocs.ts` — as stories de
 * composição os leem de lá, e o painel Code precisa publicar o mesmo texto que
 * o preview mostra ao lado. A tabela é repetida aqui, e não importada, porque
 * este módulo roda no projeto `unit` do vitest: node puro, sem o compilador do
 * Angular. Importar a docs page traria um `@Component` para um ambiente que não
 * sabe compilá-lo, e derrubaria junto a varredura inteira do
 * `source-snippets.test.ts`. O `drawer.source.test.ts` fixa os quatro textos,
 * para que a divergência apareça como falha e não como silêncio.
 */
const DEMO_LABELS: TranslationOverrides = {
  'pt-BR': {
    'demonstration.labels.confirm': 'Salvar alterações',
    'demonstration.labels.destroy': 'Excluir',
    'demonstration.labels.fieldName': 'Nome',
    'demonstration.labels.destroyMessage': 'Você pode desfazer esta ação nos próximos 30 dias.',
  },
  en: {
    'demonstration.labels.confirm': 'Save changes',
    'demonstration.labels.destroy': 'Delete',
    'demonstration.labels.fieldName': 'Name',
    'demonstration.labels.destroyMessage': 'You can undo this action within the next 30 days.',
  },
  es: {
    'demonstration.labels.confirm': 'Guardar cambios',
    'demonstration.labels.destroy': 'Eliminar',
    'demonstration.labels.fieldName': 'Nombre',
    'demonstration.labels.destroyMessage': 'Puedes deshacer esta acción en los próximos 30 días.',
  },
};

const { t } = useTranslation(drawerTranslations as Record<string, unknown>, DEMO_LABELS);

// O conteúdo compartilhado do Drawer não tem um bloco completo de rótulos de
// demonstração (o do Sheet tem). Os textos do painel saem da tabela de UX
// writing, que é justamente onde o conteúdo diz como cada elemento deve ser
// escrito — o exemplo "bom" de cada linha É o rótulo canônico, nos três idiomas.
export const LABEL = {
  trigger: () => t('usage.uxWriting.table.trigger.good'),
  title: () => t('usage.uxWriting.table.title.good'),
  description: () => t('usage.uxWriting.table.description.good'),
  close: () => t('usage.uxWriting.table.close.good'),
  confirm: () => t('demonstration.labels.confirm'),
  destroy: () => t('demonstration.labels.destroy'),
  field: () => t('demonstration.labels.fieldName'),
  destroyMessage: () => t('demonstration.labels.destroyMessage'),
};

export type DrawerArgs = {
  direction: DrawerDirection;
  modal: boolean;
  defaultOpen: boolean;
  triggerLabel: string;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * Rótulo do botão que abre a story controlada.
 *
 * Não vem do conteúdo compartilhado, de propósito: a story o declara como texto
 * fixo, porque ele nomeia o mecanismo da demonstração e não uma ação de
 * produto. O snippet repete o mesmo texto que o preview mostra.
 */
const EXTERNAL_TRIGGER = 'Abrir pelo estado externo';

/** O título que cada story de direção mostra, do conteúdo compartilhado. */
function directionTitle(direction: DrawerDirection): string {
  return stripHtml(t(`demonstration.labels.${direction}`));
}

const IMPORTS = `import { NDS_DRAWER } from '@/components/ui/drawer';
import { NdsButton } from '@/components/ui/button';`;

/** O formulário curto precisa de mais duas peças, e elas se importam à parte. */
const IMPORTS_WITH_FIELD = `${IMPORTS}
import { NdsInput } from '@/components/ui/input';
import { NdsLabel } from '@/components/ui/label';`;

/** O componente que se escreve: import, template e — quando há estado — corpo. */
function example(o: {
  imports?: string;
  componentImports?: string;
  template: string;
  body?: string;
}): string {
  const imports = o.imports ?? IMPORTS;
  const componentImports = o.componentImports ?? '[...NDS_DRAWER, NdsButton]';

  // Crase escapada: este texto vive dentro de um template literal, e uma crase
  // crua fecharia a string no meio do snippet.
  return `${imports}

@Component({
  imports: ${componentImports},
  template: \`
${o.template}
  \`,
})
export class Exemplo {${o.body ? `\n${o.body}\n` : ''}}`;
}

/** Recua um bloco inteiro, preservando linha em branco. */
function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line ? pad + line : line))
    .join('\n');
}

/**
 * O painel inteiro: raiz, gatilho e o miolo no `ng-template`.
 *
 * `trigger: null` é a story controlada, e só ela: sem gatilho interno, quem
 * abre é o botão de fora, e é isso que o modo controlado torna possível.
 */
function panel(o: {
  root?: string;
  trigger?: string | null;
  title: string;
  description: string;
  body?: string;
  footer?: string;
}): string {
  const blocks: string[] = [];

  if (o.trigger !== null) {
    blocks.push(
      `      <button ndsDrawerTrigger ndsButton variant="outline">${o.trigger ?? LABEL.trigger()}</button>`,
    );
  }

  const inner = [
    `        <div ndsDrawerHeader>
          <h2 ndsDrawerTitle>${o.title}</h2>
          <p ndsDrawerDescription>${o.description}</p>
        </div>`,
  ];
  if (o.body) inner.push(o.body);
  if (o.footer) inner.push(o.footer);

  blocks.push(`      <ng-template ndsDrawerContent>
${inner.join('\n\n')}
      </ng-template>`);

  return `    <nds-drawer${o.root ?? ''}>
${blocks.join('\n\n')}
    </nds-drawer>`;
}

/**
 * Rodapé com a saída explícita e — quando houver — a ação principal à direita.
 *
 * A ordem de leitura é a das stories: cancelar primeiro, ação depois. O
 * `ndsDrawerClose` não escreve `data-slot` próprio, porque o mesmo botão é um
 * `ndsButton` e duas diretivas ligando o mesmo atributo não têm vencedor
 * definido — em teste, procure pelo nome acessível.
 */
function footerWithClose(action?: string): string {
  const buttons = [
    `          <button ndsDrawerClose ndsButton variant="outline">${LABEL.close()}</button>`,
  ];
  if (action) buttons.push(action);

  return `        <div ndsDrawerFooter>
${buttons.join('\n')}
        </div>`;
}

// ─── Playground ───────────────────────────────────────────────────────────────

/**
 * O painel Code imprime o `template` da story literalmente — com os bindings
 * ligados aos args. `transform` devolve o uso real, com os valores atuais dos
 * controls (armadilha 3 do CLAUDE.md deste stack).
 */
export function drawerPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<DrawerArgs> } = {},
): string {
  const {
    direction = 'bottom',
    modal = true,
    defaultOpen = false,
    triggerLabel = LABEL.trigger(),
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet: documentação que repete valor
  // padrão ensina ruído.
  const root = [
    direction === 'bottom' ? '' : `direction="${direction}"`,
    defaultOpen ? '[defaultOpen]="true"' : '',
    modal ? '' : '[modal]="false"',
  ]
    .filter(Boolean)
    .join(' ');

  return example({
    template: panel({
      root: root ? ` ${root}` : '',
      trigger: triggerLabel,
      title: LABEL.title(),
      description: LABEL.description(),
      footer: footerWithClose(),
    }),
  });
}

// ─── Direções ─────────────────────────────────────────────────────────────────

/**
 * Mesmo painel nas quatro direções — o que muda é `direction` e o título.
 *
 * `bottom` é o padrão do componente, e por isso não se escreve. As outras três
 * entram como atributo simples: `direction` é `input<DrawerDirection>('bottom')`
 * sem transformação, e o valor é texto.
 */
function directionPanel(direction: DrawerDirection): string {
  return example({
    template: panel({
      root: direction === 'bottom' ? '' : ` direction="${direction}"`,
      title: directionTitle(direction),
      description: LABEL.description(),
      footer: footerWithClose(),
    }),
  });
}

/**
 * Padrão mobile-first: entra por baixo, com teto de 80% da altura da tela.
 *
 * É a única direção em que a alça aparece — e ela continua fora do snippet,
 * porque quem a desenha é o componente.
 */
export function drawerBottomSource(): string {
  return directionPanel('bottom');
}

/** Entra por cima — notificação rica e seletor rápido, de conteúdo curto. */
export function drawerTopSource(): string {
  return directionPanel('top');
}

/** Painel lateral à esquerda — onde a pessoa espera encontrar o menu. */
export function drawerLeftSource(): string {
  return directionPanel('left');
}

/** Painel lateral à direita — a alternativa de desktop para edição e filtros. */
export function drawerRightSource(): string {
  return directionPanel('right');
}

/**
 * Corpo mais alto que o painel.
 *
 * Quem rola é o `ndsDrawerBody`, não o painel: a folha compartilhada lhe dá
 * `flex: 1 1 auto`, `min-height: 0` e `overflow: auto`, e é isso que faz o teto
 * de altura apertar o conteúdo em vez de empurrar o rodapé — com as ações
 * dentro — para fora da tela.
 *
 * O `aria-label` é o único atributo que se escreve à mão, e ele não é opcional:
 * `tabindex="0"` vem do próprio componente, para que quem navega por teclado
 * alcance a rolagem (WCAG 2.1.1), e parada de teclado precisa de papel — que a
 * diretiva só emite quando existe nome. Sem o par, o nome seria descartado pelo
 * leitor de tela.
 */
export function drawerWithScrollSource(): string {
  const title = stripHtml(t('variants.items.withScroll.name'));
  const paragraph = stripHtml(t('variants.items.withScroll.use'));

  return example({
    template: panel({
      title,
      description: LABEL.description(),
      body: `        <div ndsDrawerBody class="nds-stack" data-spacing="sm" aria-label="${title}">
          @for (n of paragraphs; track n) {
            <p class="nds-text-body nds-text-muted-foreground">{{ n }}. ${paragraph}</p>
          }
        </div>`,
      footer: footerWithClose(),
    }),
    body: '  readonly paragraphs = Array.from({ length: 30 }, (_, i) => i + 1);',
  });
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Estado inicial, e o padrão do componente: nenhuma prop.
 *
 * Fechado, o painel nem existe no DOM — quem o mantém montado é a transição de
 * saída, e só enquanto ela dura. O gatilho anuncia que existe um diálogo por
 * trás dele (`aria-haspopup="dialog"`, escrito pela diretiva) sem prometer que
 * já está aberto.
 *
 * O rodapé fica de fora porque a story ao lado não o tem: o assunto ali é o que
 * o estado fechado NÃO monta. A saída explícita aparece no snippet logo abaixo,
 * e Escape e véu continuam fechando este painel de qualquer forma.
 */
export function drawerClosedSource(): string {
  return example({
    template: panel({
      title: LABEL.title(),
      description: LABEL.description(),
    }),
  });
}

/**
 * Aberto na montagem.
 *
 * Aqui `defaultOpen` É o assunto — nas stories de direção e de composição ele
 * só existe para a captura visual, e por isso fica de fora daqueles snippets.
 * É o modo NÃO-controlado: o componente guarda o próprio estado, e o valor só
 * diz por onde ele começa.
 */
export function drawerOpenSource(): string {
  return example({
    template: panel({
      root: ' [defaultOpen]="true"',
      title: LABEL.title(),
      description: LABEL.description(),
      footer: footerWithClose(),
    }),
  });
}

/**
 * Estado do lado de fora: o par `[open]` + `(openChange)`.
 *
 * O componente não decide nada sozinho, e a volta é obrigatória — ligar só a
 * primeira ponta prenderia o painel ao valor inicial, e ele reabriria no ciclo
 * de detecção seguinte a cada tentativa de fechar.
 *
 * O estado mora num SINAL, e não num campo comum como na story: ali quem agenda
 * o redesenho é o próprio evento do renderer, e num componente de verdade é a
 * escrita no sinal que o faz. Sem `ndsDrawerTrigger`: quem abre é o botão de
 * fora, e é isso que o modo controlado torna possível.
 */
export function drawerControlledSource(): string {
  const inner = panel({
    root: ' [open]="isOpen()" (openChange)="isOpen.set($event)"',
    trigger: null,
    title: LABEL.title(),
    description: LABEL.description(),
    footer: footerWithClose(),
  });

  return example({
    template: `    <div class="nds-stack" data-spacing="sm">
      <button ndsButton variant="outline" (click)="isOpen.set(true)">${EXTERNAL_TRIGGER}</button>

${indent(inner, 2)}
    </div>`,
    body: '  readonly isOpen = signal(false);',
  });
}

/**
 * Sem dispensa por ponteiro: clique fora e perda de foco deixam de fechar.
 *
 * Escape CONTINUA fechando, e é diferença deliberada deste stack — o primitivo
 * não oferece desligar o teclado, e um painel modal que engole Escape é
 * armadilha de teclado (WCAG 2.1.2). Com o descarte por ponteiro desligado, o
 * botão do rodapé deixa de ser cortesia: é a saída que sobra junto com Escape,
 * e um snippet sem ele ensinaria a prender quem usa ponteiro.
 */
export function drawerNotDismissibleSource(): string {
  return example({
    template: panel({
      root: ' [disablePointerDismissal]="true"',
      title: LABEL.title(),
      description: LABEL.description(),
      footer: footerWithClose(),
    }),
  });
}

// ─── Composições ──────────────────────────────────────────────────────────────

/**
 * Formulário curto no corpo e o par de ações no rodapé.
 *
 * O campo é achado pelo RÓTULO, e é o `for` casando com o `id` que sustenta
 * isso: sem o par, o campo fica sem nome acessível dentro de um painel modal, e
 * quem usa leitor de tela ouve "editar texto" e nada mais.
 *
 * Este corpo não leva `aria-label`: sem nome a diretiva não emite papel nenhum,
 * e nome em elemento sem papel é atributo proibido — o axe acusa
 * `aria-prohibited-attr`. O rótulo do campo já diz o que há ali dentro.
 */
export function drawerWithFormSource(): string {
  return example({
    imports: IMPORTS_WITH_FIELD,
    componentImports: '[...NDS_DRAWER, NdsButton, NdsInput, NdsLabel]',
    template: panel({
      title: LABEL.title(),
      description: LABEL.description(),
      body: `        <div ndsDrawerBody class="nds-stack" data-spacing="sm">
          <label ndsLabel for="drawer-comp-nome">${LABEL.field()}</label>
          <input ndsInput id="drawer-comp-nome" name="nome" />
        </div>`,
      footer: footerWithClose(`          <button ndsButton>${LABEL.confirm()}</button>`),
    }),
  });
}

/**
 * Confirmação reversível: mensagem curta e par de ações.
 *
 * A consequência fica ESCRITA na descrição, que é também a descrição acessível
 * do diálogo — subentendê-la deixaria quem usa leitor de tela sem ela. A ação
 * principal carrega a variante destrutiva, e quem escreve a cor é a variante,
 * nunca uma classe à mão.
 *
 * Vale para confirmação de baixo risco; se a ação for realmente bloqueante, o
 * componente é o AlertDialog.
 */
export function drawerWithConfirmationSource(): string {
  return example({
    template: panel({
      title: stripHtml(t('variants.compositions.withConfirmation.name')),
      description: LABEL.destroyMessage(),
      footer: footerWithClose(
        `          <button ndsButton variant="destructive">${LABEL.destroy()}</button>`,
      ),
    }),
  });
}
