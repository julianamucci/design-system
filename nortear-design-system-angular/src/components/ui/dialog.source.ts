/**
 * Transforms do painel Code do Dialog.
 *
 * Vive fora do `.stories.ts` porque é assim que ele entra na varredura do
 * `source-snippets.test.ts`, que CHAMA cada export e lê o texto publicado.
 * Enquanto o construtor era função local, o que o leitor copia não tinha portão
 * nenhum — nem a checagem de import, nem a de andaime vazado.
 *
 * SÃO QUATRO ARQUIVOS DE STORY mostrando o mesmo componente, e até esta rodada
 * só o Playground tinha construtor: as outras QUATORZE imprimiam o template CRU
 * no painel Code — `{{ labels.title }}` contra o objeto de props que o renderer
 * do Angular monta, `(openChange)="isOpen = $event; onOpenChange($event)"`
 * escrito contra um campo comum que componente nenhum tem, e o
 * `[defaultOpen]="true"` que existe só para a foto do Chromatic sair com o
 * painel aberto. Quem lê a docs page copia o snippet, não o preview.
 *
 * O que é ANDAIME e por isso não entra em snippet nenhum:
 *
 *  · `{{ labels.* }}`, `{{ paragrafos }}`, `{{ clausulas }}` e `{{ src }}` —
 *    nomes de campos do objeto de `props` do renderer. O snippet escreve o
 *    texto por extenso, e o que é lista vira membro da classe do exemplo;
 *  · `[defaultOpen]="true"` das stories de variante e de composição. Ali ele
 *    existe para a captura visual, e não porque um diálogo de produção nasça
 *    aberto. Só aparece onde abrir na montagem É o assunto — a story Open;
 *  · `(openChange)="onOpenChange($event)"` do Playground, que é o espião da
 *    `play`, e `(openChange)="isOpen = $event"` da story controlada, que só
 *    redesenha porque quem agenda a detecção ali é o próprio evento do
 *    renderer. Num componente de verdade o estado mora num SINAL, e é o par
 *    `[open]`/`(openChange)` com `set` que o snippet publica;
 *  · `[closeLabel]="labels.close"`, que toda story escreve e vale `Fechar` — o
 *    MESMO valor que `closeLabel` já tem por padrão no `NdsDialogContent` e no
 *    `NdsDialogFooter`. Publicá-lo ensinaria a reescrever o padrão; as outras
 *    stacks também não publicam o rótulo do X.
 *
 * O que os snippets ensinam, e é a lição do componente:
 *
 *  · o par `ndsDialogTitle` + `ndsDialogDescription` não é enfeite de layout: o
 *    primitivo liga `aria-labelledby`/`aria-describedby` aos ids REAIS deles, e
 *    é daí que sai o nome acessível do diálogo. Sem título, o painel modal abre
 *    anônimo — o defeito silencioso deste componente;
 *  · o miolo mora num `<ng-template ndsDialogPortal>`, e o portal é o que isola
 *    o painel de `overflow` e `transform` de qualquer ancestral. Fechado, nada
 *    do conteúdo existe no DOM;
 *  · o X do canto é do COMPONENTE (`showCloseButton`, ligado por padrão) e não
 *    se escreve à mão. O que se escreve é a saída explícita do rodapé, e a
 *    ordem dela é a da guideline 04: no DOM o secundário primeiro (`Cancelar`),
 *    a ação primária por último. A folha faz o resto — `.nds-dialog-footer` é
 *    `column-reverse` no estreito e `row` + `justify-end` a partir de 40rem;
 *  · as DUAS rotas de rolagem, que é onde este componente se escreve errado: na
 *    rota A quem rola é o corpo (`.nds-dialog-body-scroll` mais `tabindex="0"`,
 *    `role="group"` e nome — parada de teclado precisa de papel e de nome); na
 *    rota B o par `scroll` do véu e do painel, com o painel DENTRO do véu,
 *    porque rolagem de um elemento só alcança o que está dentro dele.
 *
 * O QUE NÃO ENTRA EM SNIPPET NENHUM porque é do AlertDialog, e não daqui:
 * `role="alertdialog"`, o véu que não fecha por clique e o foco inicial no
 * Cancelar. Este diálogo fecha por clique no véu, se anuncia como `dialog` e
 * deixa o foco onde o primitivo o põe. Confirmação irreversível é outro
 * componente, e publicar aqui uma prop que o imite ensinaria API inexistente.
 *
 * DUAS STORIES NÃO GANHAM CONSTRUTOR PRÓPRIO, e as exclusões se declaram aqui:
 *
 *  · `Variants/Default` — é o diálogo canônico, e o `[defaultOpen]="true"` dela
 *    é a captura do Chromatic, que não entra em snippet;
 *  · `States/Closed` — fechado é o PADRÃO do componente, e a story não escreve
 *    prop nenhuma.
 *
 * As duas reusam `dialogPlaygroundSource` com os controls no padrão, porque o
 * texto seria idêntico letra por letra: uma segunda cópia só criaria a chance
 * de as duas divergirem. O `dialog.source.test.ts` cobra a PREMISSA — se o
 * Playground passar a escrever atributo por padrão, ou perder o rodapé, o reuso
 * deixa de bater com as duas stories e reprova nomeando.
 */
import { LABELS } from './dialog.fixtures';

export type DialogArgs = {
  defaultOpen: boolean;
  modal: boolean;
  showCloseButton: boolean;
  triggerLabel: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * Os textos que as stories escrevem À MÃO no próprio template.
 *
 * Só `LABELS` vem do conteúdo compartilhado; estes não estão lá, e o painel
 * Code precisa publicar o MESMO texto que o preview mostra ao lado. A tabela é
 * repetida aqui, e não importada da story, porque este módulo roda no projeto
 * `unit` do vitest: node puro, sem o compilador do Angular. Importar um
 * `.stories.ts` traria o renderer do Storybook para um ambiente que não o
 * carrega, e derrubaria junto a varredura inteira do `source-snippets.test.ts`.
 * O `dialog.source.test.ts` fixa cada um destes textos, para que a divergência
 * entre as duas cópias apareça como falha e não como silêncio.
 */
const DEMO = {
  destructiveTrigger: 'Remover item',
  destructiveTitle: 'Remover item da lista',
  destructiveDescription: 'O item sai desta lista e continua disponível no catálogo.',
  destructiveAction: 'Remover item',

  inviteTrigger: 'Enviar convite',
  inviteTitle: 'Enviar convite',
  // `&#64;` e não `@`: em texto de template do Angular o arroba abre bloco de
  // controle, e é assim que a story o escreve.
  inviteDescription: 'O convite vai para ana&#64;exemplo.com. Você pode reenviar depois.',
  inviteAction: 'Enviar convite',

  formName: 'Nome',
  formNameValue: 'Ana Ribeiro',
  formEmail: 'E-mail',
  formEmailValue: 'ana@exemplo.com',

  profileName: 'Nome completo',
  profileNameValue: 'Maria Silva',
  profileUsername: 'Nome de usuário',
  profileUsernameValue: '@mariasilva',

  mediaTrigger: 'Ver capa',
  mediaTitle: 'Capa do artigo',
  mediaDescription: 'Padrão geométrico em tons de cinza, usado como capa da publicação.',
  mediaAlt: 'Padrão geométrico em tons de cinza',
  // Caminho de arquivo, e não o SVG em data URI da story: aquele existe para a
  // story não depender de rede, e publicá-lo encheria o painel de base64 sem
  // ensinar nada.
  mediaSrc: '/capa-do-artigo.jpg',

  bodyClause: 'o corpo é a única região que rola, e o cabeçalho e o rodapé ficam parados enquanto o texto passa por baixo deles.',
  overlayClause: 'o painel entra no fluxo do overlay, e o cabeçalho sobe junto com o conteúdo em vez de ficar parado no topo do painel.',
};

const IMPORTS = `import { NDS_DIALOG } from '@/components/ui/dialog';
import { NdsButton } from '@/components/ui/button';`;

/** O formulário curto precisa de mais duas peças, e elas se importam à parte. */
const IMPORTS_WITH_FIELD = `${IMPORTS}
import { NdsInput } from '@/components/ui/input';
import { NdsLabel } from '@/components/ui/label';`;

/** A pré-visualização de mídia precisa da caixa de proporção. */
const IMPORTS_WITH_MEDIA = `${IMPORTS}
import { NdsAspectRatio } from '@/components/ui/aspect-ratio';`;

/** O componente que se escreve: import, template e — quando há estado — corpo. */
function example(o: {
  imports?: string;
  componentImports?: string;
  template: string;
  body?: string;
}): string {
  const imports = o.imports ?? IMPORTS;
  const componentImports = o.componentImports ?? '[...NDS_DIALOG, NdsButton]';

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
 * O painel: cabeçalho obrigatório e, depois dele, o que a story mostrar.
 *
 * O cabeçalho não é opcional em nenhum snippet, e não é escolha de layout: o
 * `aria-labelledby` do painel aponta para o id REAL do título.
 */
function content(o: {
  attrs?: string;
  title: string;
  description: string;
  after?: string;
}): string {
  const blocks = [
    `          <div ndsDialogHeader>
            <h2 ndsDialogTitle>${o.title}</h2>
            <p ndsDialogDescription>${o.description}</p>
          </div>`,
  ];
  if (o.after) blocks.push(o.after);

  return `        <div ndsDialogContent${o.attrs ?? ''}>
${blocks.join('\n\n')}
        </div>`;
}

/**
 * Raiz, gatilho e o miolo teleportado.
 *
 * `nested` é a ROTA B: o painel vira FILHO do véu, que passa a ser a área de
 * rolagem. Com os dois como irmãos — o arranjo da rota A — as classes chegam e
 * o véu não tem o que rolar.
 */
function panel(o: {
  root?: string;
  trigger?: string;
  content: string;
  nested?: true;
}): string {
  const inner = o.nested
    ? `        <div ndsDialogOverlay scroll>
${indent(o.content, 2)}
        </div>`
    : `        <div ndsDialogOverlay></div>

${o.content}`;

  return `    <div ndsDialog${o.root ?? ''}>
      <button ndsDialogTrigger ndsButton variant="outline">${o.trigger ?? LABELS.trigger}</button>

      <ng-template ndsDialogPortal>
${inner}
      </ng-template>
    </div>`;
}

/**
 * Rodapé de ações, na ordem da guideline 04.
 *
 * No DOM o secundário vem PRIMEIRO e a ação primária por último — é a ordem de
 * leitura e de foco, e é sobre ela que a folha trabalha (`column-reverse` no
 * estreito põe a primária em cima; `row` + `justify-end` no largo a põe à
 * direita). Inverter aqui inverteria a tela.
 *
 * O `ndsDialogClose` não escreve `data-slot` próprio, porque o mesmo botão é um
 * `ndsButton` e duas diretivas ligando o mesmo atributo não têm vencedor
 * definido — em teste, procure pelo nome acessível.
 */
function footer(o: { action?: string; cancel?: boolean; attrs?: string } = {}): string {
  const buttons: string[] = [];
  if (o.cancel !== false) {
    buttons.push(
      `            <button ndsDialogClose ndsButton variant="outline">${LABELS.cancel}</button>`,
    );
  }
  if (o.action) buttons.push(o.action);

  return `          <div ndsDialogFooter${o.attrs ?? ''}>
${buttons.join('\n')}
          </div>`;
}

/** A ação primária: sem `variant`, que `default` é o padrão do botão. */
function action(label: string, variant?: 'destructive'): string {
  const attrs = variant ? ` variant="${variant}"` : '';
  return `            <button ndsButton${attrs}>${label}</button>`;
}

/** O par cabeçalho + rodapé canônico, que quase toda story mostra. */
function defaultAfter(): string {
  return footer({ action: action(LABELS.action) });
}

// ─── Playground ───────────────────────────────────────────────────────────────

/**
 * Ver a nota em separator.stories.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos args e com as interpolações
 * de `labels`. O `transform` devolve o uso real, com os valores atuais.
 *
 * Serve TRÊS stories — ver a declaração das duas exclusões no topo do arquivo.
 */
export function dialogPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<DialogArgs> } = {},
): string {
  const {
    defaultOpen = false,
    modal = true,
    showCloseButton = true,
    triggerLabel = LABELS.trigger,
  } = ctx.args ?? {};

  // Só o que difere do padrão entra no snippet — documentação que repete valor
  // default ensina ruído.
  const root = [defaultOpen ? '[defaultOpen]="true"' : '', modal ? '' : '[modal]="false"']
    .filter(Boolean)
    .join(' ');

  return example({
    template: panel({
      root: root ? ` ${root}` : '',
      trigger: triggerLabel,
      content: content({
        attrs: showCloseButton ? '' : ' [showCloseButton]="false"',
        title: LABELS.title,
        description: LABELS.description,
        after: defaultAfter(),
      }),
    }),
  });
}

// ─── Variantes ────────────────────────────────────────────────────────────────

/**
 * Formulário curto no corpo.
 *
 * O campo é achado pelo RÓTULO, e é o `for` casando com o `id` que sustenta
 * isso: sem o par, o campo fica sem nome acessível dentro de um painel modal, e
 * quem usa leitor de tela ouve "editar texto" e nada mais.
 *
 * O corpo não leva `tabindex` nem papel: aqui ele não rola, e parada de
 * tabulação que não faz nada é ruído para quem navega por teclado. Quem rola é
 * a variante de baixo.
 *
 * O `form` envolve o corpo E o rodapé, pela mesma razão da composição de edição
 * de perfil: é o que faz o Enter em qualquer campo disparar a ação primária. Um
 * `type="submit"` fora de `form` não submete nada — a story publicava
 * exatamente isso, e o snippet ensinava a repetir.
 */
export function dialogWithFormSource(): string {
  const body = `            <div ndsDialogBody class="nds-stack" data-spacing="md">
              <div class="nds-stack" data-spacing="xs">
                <label ndsLabel for="dlg-nome">${DEMO.formName}</label>
                <input ndsInput id="dlg-nome" name="name" value="${DEMO.formNameValue}" />
              </div>
              <div class="nds-stack" data-spacing="xs">
                <label ndsLabel for="dlg-email">${DEMO.formEmail}</label>
                <input ndsInput id="dlg-email" name="email" type="email" value="${DEMO.formEmailValue}" />
              </div>
            </div>`;

  const formFooter = indent(
    footer({
      action: `            <button ndsButton type="submit">${LABELS.action}</button>`,
    }),
    2,
  );

  const form = `          <form (submit)="$event.preventDefault()">
${body}

${formFooter}
          </form>`;

  return example({
    imports: IMPORTS_WITH_FIELD,
    componentImports: '[...NDS_DIALOG, NdsButton, NdsInput, NdsLabel]',
    template: panel({
      content: content({
        title: LABELS.title,
        description: LABELS.description,
        after: form,
      }),
    }),
  });
}

/**
 * ROTA A — quem rola é o CORPO, com cabeçalho e rodapé parados.
 *
 * Três atributos andam juntos, e nenhum deles vem do componente: a classe de
 * rolagem, o `tabindex="0"` (sem ele quem navega só por teclado não alcança a
 * caixa, WCAG 2.1.1) e o par `role="group"` + `aria-label` — parada de
 * tabulação precisa de papel, e papel sem nome não diz o que é.
 */
export function dialogWithScrollContentSource(): string {
  const body = `          <div
            ndsDialogBody
            class="nds-dialog-body-scroll nds-stack"
            data-spacing="sm"
            tabindex="0"
            role="group"
            aria-label="${LABELS.title}"
          >
            @for (n of clauses; track n) {
              <p>Cláusula {{ n }}: ${DEMO.bodyClause}</p>
            }
          </div>`;

  return example({
    template: panel({
      content: content({
        title: LABELS.title,
        description: LABELS.description,
        after: `${body}\n\n${defaultAfter()}`,
      }),
    }),
    body: '  readonly clauses = Array.from({ length: 20 }, (_, i) => i + 1);',
  });
}

/**
 * ROTA B — quem rola é o VÉU, e o painel entra no fluxo dele.
 *
 * Os dois `scroll` andam juntos E o painel tem de estar DENTRO do véu: rolagem
 * de um elemento só alcança o que está dentro dele. Com os dois como irmãos as
 * classes chegam e não produzem rolagem nenhuma — medido contra a folha
 * compartilhada.
 *
 * Aqui o corpo NÃO leva classe de rolagem, nem `tabindex`, nem papel: não há
 * região rolável aninhada para alcançar, e quem rola já está na ordem natural
 * da página.
 */
export function dialogWithScrollingOverlaySource(): string {
  const body = `          <div ndsDialogBody class="nds-stack" data-spacing="sm">
            @for (n of clauses; track n) {
              <p>Cláusula {{ n }}: ${DEMO.overlayClause}</p>
            }
          </div>`;

  return example({
    template: panel({
      nested: true,
      content: content({
        attrs: ' scroll',
        title: LABELS.title,
        description: LABELS.description,
        after: `${body}\n\n${defaultAfter()}`,
      }),
    }),
    body: '  readonly clauses = Array.from({ length: 20 }, (_, i) => i + 1);',
  });
}

/**
 * Sem rodapé: nada a confirmar, e o X do canto é a única saída visível.
 *
 * O X vem do componente — `showCloseButton` nasce ligado —, então o snippet não
 * escreve nada para tê-lo. Escape e clique no véu continuam fechando.
 */
export function dialogNoFooterSource(): string {
  return example({
    template: panel({
      content: content({
        title: LABELS.title,
        description: LABELS.description,
      }),
    }),
  });
}

/**
 * Ação destrutiva, mas reversível — e por isso ainda é um Dialog.
 *
 * Quem escreve a cor de perigo é a variante do botão, nunca uma classe à mão. A
 * consequência fica ESCRITA na descrição, que é também a descrição acessível do
 * diálogo.
 *
 * Se a operação fosse irreversível, o componente seria o AlertDialog: lá o
 * papel é `alertdialog`, o clique no véu não dispensa e o foco inicial vai para
 * o Cancelar. Nada disso se liga aqui.
 */
export function dialogWithDestructiveActionSource(): string {
  return example({
    template: panel({
      trigger: DEMO.destructiveTrigger,
      content: content({
        title: DEMO.destructiveTitle,
        description: DEMO.destructiveDescription,
        after: footer({ action: action(DEMO.destructiveAction, 'destructive') }),
      }),
    }),
  });
}

/**
 * O fechar sai do canto e vai para o rodapé.
 *
 * `showCloseButton` existe nos DOIS lugares e faz coisas diferentes: no painel
 * ele desenha o X do canto (ligado por padrão), no rodapé ele acrescenta um
 * botão de fechar ao lado das ações (desligado por padrão). Desligar um e ligar
 * o outro é a composição inteira desta variante.
 *
 * O rótulo do botão do rodapé não se escreve: `closeLabel` já vale `Fechar`.
 */
export function dialogCustomCloseInFooterSource(): string {
  return example({
    template: panel({
      content: content({
        attrs: ' [showCloseButton]="false"',
        title: LABELS.title,
        description: LABELS.description,
        after: footer({
          cancel: false,
          attrs: ' [showCloseButton]="true"',
          action: action(LABELS.action),
        }),
      }),
    }),
  });
}

/**
 * Confirmação de operação reversível: a ação primária fica neutra.
 *
 * Variante destrutiva aqui gritaria perigo onde não há — o convite pode ser
 * reenviado, e a descrição diz isso.
 */
export function dialogConfirmEmailSource(): string {
  return example({
    template: panel({
      trigger: DEMO.inviteTrigger,
      content: content({
        title: DEMO.inviteTitle,
        description: DEMO.inviteDescription,
        after: footer({ action: action(DEMO.inviteAction) }),
      }),
    }),
  });
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Aberto na montagem.
 *
 * Aqui `defaultOpen` É o assunto — nas stories de variante e de composição ele
 * só existe para a captura visual, e por isso fica de fora daqueles snippets.
 * É o modo NÃO-controlado: o componente guarda o próprio estado, e o valor só
 * diz por onde ele começa.
 */
export function dialogOpenSource(): string {
  return example({
    template: panel({
      root: ' [defaultOpen]="true"',
      content: content({
        title: LABELS.title,
        description: LABELS.description,
        after: defaultAfter(),
      }),
    }),
  });
}

/**
 * Sem o X do canto.
 *
 * Escape CONTINUA fechando, e o rodapé mantém o Cancelar: nunca se tira toda
 * saída de teclado de um painel modal — sem elas o diálogo vira armadilha de
 * teclado (WCAG 2.1.2).
 */
export function dialogWithCloseButtonHiddenSource(): string {
  return example({
    template: panel({
      content: content({
        attrs: ' [showCloseButton]="false"',
        title: LABELS.title,
        description: LABELS.description,
        after: defaultAfter(),
      }),
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
 * escrita no sinal que o faz.
 */
export function dialogControlledSource(): string {
  return example({
    template: panel({
      root: ' [open]="isOpen()" (openChange)="isOpen.set($event)"',
      content: content({
        title: LABELS.title,
        description: LABELS.description,
        after: defaultAfter(),
      }),
    }),
    body: '  readonly isOpen = signal(false);',
  });
}

// ─── Composições ──────────────────────────────────────────────────────────────

/**
 * Edição de dados conhecidos, sem sair da página.
 *
 * O que separa esta composição de um painel com dois botões soltos é o `form`:
 * ele envolve o corpo E o rodapé, para que o Enter em qualquer campo dispare o
 * envio — e é por isso que a ação primária escreve `type="submit"`, que é o
 * único lugar em que o tipo difere do padrão.
 *
 * O Cancelar NÃO escreve `type="button"`, embora a story o faça. Medido no
 * primitivo: o `RdxButtonDirective` que vem com o `ndsButton` liga
 * `[attr.type]` com padrão `button`, e o `RdxDialogClose` fixa o mesmo valor
 * como atributo de host. O tipo já é `button` sem que ninguém escreva nada, e
 * publicá-lo ensinaria a repetir o padrão — o cuidado a mais da story é
 * cinto-e-suspensório, não requisito.
 */
export function dialogProfileEditSource(): string {
  const body = `            <div ndsDialogBody class="nds-grid" data-spacing="md">
              <div class="nds-stack" data-spacing="sm">
                <label ndsLabel for="profile-name">${DEMO.profileName}</label>
                <input ndsInput id="profile-name" name="name" value="${DEMO.profileNameValue}" />
              </div>
              <div class="nds-stack" data-spacing="sm">
                <label ndsLabel for="profile-username">${DEMO.profileUsername}</label>
                <input ndsInput id="profile-username" name="username" value="${DEMO.profileUsernameValue}" />
              </div>
            </div>`;

  const formFooter = `            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">${LABELS.cancel}</button>
              <button ndsButton type="submit">${LABELS.action}</button>
            </div>`;

  const form = `          <form (submit)="$event.preventDefault()">
${body}

${formFooter}
          </form>`;

  return example({
    imports: IMPORTS_WITH_FIELD,
    componentImports: '[...NDS_DIALOG, NdsButton, NdsInput, NdsLabel]',
    template: panel({
      content: content({
        title: LABELS.title,
        description: LABELS.description,
        after: form,
      }),
    }),
  });
}

/**
 * Ver uma mídia em tamanho real, sem nada a confirmar.
 *
 * Sem rodapé: a única intenção é ver, e o X do canto é a saída. O `alt` carrega
 * a informação do diálogo — vazio ali apagaria o conteúdo inteiro para quem usa
 * leitor de tela, e a descrição do cabeçalho diz o mesmo em texto corrido.
 */
export function dialogMediaPreviewSource(): string {
  const body = `          <div ndsDialogBody>
            <div ndsAspectRatio [ratio]="16 / 9">
              <img src="${DEMO.mediaSrc}" alt="${DEMO.mediaAlt}" />
            </div>
          </div>`;

  return example({
    imports: IMPORTS_WITH_MEDIA,
    componentImports: '[...NDS_DIALOG, NdsButton, NdsAspectRatio]',
    template: panel({
      trigger: DEMO.mediaTrigger,
      content: content({
        title: DEMO.mediaTitle,
        description: DEMO.mediaDescription,
        after: body,
      }),
    }),
  });
}
