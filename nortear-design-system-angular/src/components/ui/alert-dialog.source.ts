/**
 * Transforms do painel Code do AlertDialog.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * estes construtores sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * Até esta rodada só o Playground e o HeadingH3 tinham construtor: as outras
 * doze stories imprimiam o template CRU no painel Code — `[defaultOpen]="true"`
 * da captura, `data-testid` da `play`, `(click)="onConfirmSpy()"` do espião e o
 * svg desenhado à mão. Quem lê a docs page copia o snippet, não o preview.
 *
 * O que é ANDAIME e por isso não entra em snippet nenhum:
 *
 *  · `[defaultOpen]="true"` das stories de estado e de variante — elas nascem
 *    abertas para a captura visual e para a `play` achar o painel, e um
 *    diálogo de confirmação de produção nasce fechado, comandado pelo gatilho.
 *    A exceção é o Playground: lá o trecho acompanha os controls, e quem liga
 *    `defaultOpen` o vê no snippet; no padrão, desligado, nada se emite;
 *  · `data-testid`, os espiões e o `(openChange)` que os alimenta;
 *  · o `{{ campo }}` contra o objeto de `props` do renderer — o snippet escreve
 *    o texto por extenso.
 *
 * O que os snippets ensinam, e é o contrato do componente: o título é o nome
 * acessível e a descrição, opcional, diz o que a ação custa; a saída segura vem
 * ANTES da confirmação no DOM; a ação de negócio roda no método da classe, e
 * quem fecha o diálogo é o primitivo. Papel de alerta, modalidade, os vínculos
 * `aria-*` e o foco inicial no Cancelar são do componente — escritos à mão,
 * ensinariam API que não existe.
 *
 * SEIS STORIES REUSAM O CONSTRUTOR CANÔNICO, e a exclusão se declara aqui:
 * Closed, Open, Confirmed e Cancelled (estados) e Destructive e Responsive (variantes)
 * mostram a MESMA composição com os mesmos rótulos, e o que muda entre elas é o
 * que acontece na tela — abrir, confirmar, cancelar, o ponto de quebra. Uma
 * cópia por story só criaria a chance de divergirem. O teste ao lado cobra a
 * lista.
 */
import {
  LONG_DESCRIPTION,
  WITHOUT_DESCRIPTION_LABELS,
  destructiveLabels,
  neutralLabels,
  type AlertDialogLabels,
} from './alert-dialog.fixtures';

/** Severidade da confirmação: escolhe a variante do Button do gatilho e da ação. */
export type AlertDialogTone = 'destructive' | 'default';

export type AlertDialogArgs = {
  defaultOpen: boolean;
  /** Só documentação na aba API Reference: o Playground não controla o estado. */
  open?: boolean;
  panelClass: string;
  tone: AlertDialogTone;
  showMedia: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
};

type ButtonVariant = 'destructive' | 'outline' | 'default';

type Composition = Omit<AlertDialogLabels, 'description'> & {
  /** Sem descrição (`''`), o parágrafo sai — e com ele o `aria-describedby`. */
  description: string;
  tone?: AlertDialogTone;
  /** Variante do gatilho; por padrão acompanha o `tone`. */
  triggerVariant?: ButtonVariant;
  media?: boolean;
  mediaClass?: string;
  panelClass?: string;
  /** Só o Playground passa, e só quando o control está ligado. */
  defaultOpen?: boolean;
  /**
   * Nível do cabeçalho do título. Padrão `h2`; a diretiva casa de `h1` a `h6`,
   * porque o nível certo depende da hierarquia da página em volta.
   */
  titleTag?: string;
  /** O método da classe que a ação chama. */
  actionMethod?: string;
};

/** `default` é o padrão do `ndsButton`: escrevê-lo ensinaria a repetir o padrão. */
function variantAttr(variant: ButtonVariant): string {
  return variant === 'default' ? '' : ` variant="${variant}"`;
}

function imports(media: boolean): { lines: string; list: string } {
  const lines = `import { NDS_ALERT_DIALOG } from '@/components/ui/alert-dialog';
import { NdsButton } from '@/components/ui/button';`;
  return media
    ? {
        lines: `${lines}\nimport { NdsAlertIcon } from '@/components/ui/alert';`,
        list: 'NDS_ALERT_DIALOG, NdsButton, NdsAlertIcon',
      }
    : { lines, list: 'NDS_ALERT_DIALOG, NdsButton' };
}

/**
 * O miolo: cabeçalho e rodapé dentro do `ng-template` do painel.
 *
 * A caixa de mídia é o PRIMEIRO filho do cabeçalho — é dessa ordem que sai a
 * leitura ícone → título → descrição. O `:has()` da folha não depende dela: é a
 * PRESENÇA da mídia que ele lê, em qualquer posição. O ícone é o
 * `svg[ndsAlertIcon]`, que já sai da árvore de acessibilidade sozinho.
 */
function panelContent(o: Composition, indent: string): string {
  const tone = o.tone ?? 'destructive';
  const tag = o.titleTag ?? 'h2';
  const method = o.actionMethod ?? 'deleteAccount';
  const media = o.media
    ? `
    <div ndsAlertDialogMedia${o.mediaClass ? ` class="${o.mediaClass}"` : ''}>
      <svg ndsAlertIcon kind="warning"></svg>
    </div>`
    : '';
  const description = o.description
    ? `
    <p ndsAlertDialogDescription>${o.description}</p>`
    : '';

  return `<ng-template ndsAlertDialogContent>
  <div ndsAlertDialogHeader>${media}
    <${tag} ndsAlertDialogTitle>${o.title}</${tag}>${description}
  </div>

  <div ndsAlertDialogFooter>
    <button ndsAlertDialogCancel ndsButton variant="outline">${o.cancelLabel}</button>
    <button ndsAlertDialogAction ndsButton${variantAttr(tone)} (click)="${method}()">
      ${o.actionLabel}
    </button>
  </div>
</ng-template>`
    .split('\n')
    .map((line) => (line ? indent + line : line))
    .join('\n');
}

/** O componente que se escreve: import, template e o método da ação. */
function example(o: Composition): string {
  const tone = o.tone ?? 'destructive';
  const method = o.actionMethod ?? 'deleteAccount';
  const { lines, list } = imports(o.media === true);
  const root = `<nds-alert-dialog${o.defaultOpen ? ' [defaultOpen]="true"' : ''}${
    o.panelClass ? ` panelClass="${o.panelClass}"` : ''
  }>`;

  // Crase escapada: este texto vive dentro de um template literal, e uma crase
  // crua fecharia a string no meio do snippet.
  return `${lines}

@Component({
  imports: [${list}],
  template: \`
    ${root}
      <button ndsAlertDialogTrigger ndsButton${variantAttr(o.triggerVariant ?? tone)}>
        ${o.triggerLabel}
      </button>

${panelContent(o, '      ')}
    </nds-alert-dialog>
  \`,
})
export class Example {
  ${method}(): void {
    // A ação roda aqui; quem fecha o diálogo é o primitivo.
  }
}`;
}

/** O texto de um arg de controle, com queda para o padrão quando não veio. */
function text(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * O Playground, lido dos controls.
 *
 * `tone` vira a variante do Button em DOIS lugares, gatilho e ação — é o
 * acoplamento que a story demonstra. `description` vazia tira o parágrafo (D4),
 * e `showMedia` põe a caixa do ícone com o import dela. `defaultOpen` só entra
 * quando quem lê o liga — o trecho acompanha os controls, e o padrão
 * (desligado) não emite nada.
 */
export function alertDialogPlaygroundSource(
  _generated?: string,
  ctx: { args?: Partial<AlertDialogArgs> } = {},
): string {
  const args = ctx.args ?? {};
  const labels = destructiveLabels();
  return example({
    tone: args.tone === 'default' ? 'default' : 'destructive',
    defaultOpen: args.defaultOpen === true,
    media: args.showMedia === true,
    panelClass: text(args.panelClass, '').trim(),
    triggerLabel: text(args.triggerLabel, labels.triggerLabel),
    title: text(args.title, labels.title),
    description: text(args.description, labels.description),
    cancelLabel: text(args.cancelLabel, labels.cancelLabel),
    actionLabel: text(args.actionLabel, labels.actionLabel),
  });
}

/**
 * A confirmação destrutiva canônica — gatilho e ação na variante destrutiva,
 * rótulos de `demonstration.labels`.
 *
 * Serve Closed, Open, Confirmed, Cancelled, Destructive e Responsive (ver o
 * cabeçalho).
 * O Cancelar não escreve `(click)`: fechar sem executar é o que ele já faz, e é
 * justamente o que a story Cancelled prova.
 */
export function alertDialogDestructiveSource(): string {
  return example(destructiveLabels());
}

/**
 * Estado do lado de fora: o par `[open]` + `(openChange)`, sem gatilho
 * interno — o botão que abre vive fora da raiz, e é a ele que o foco volta.
 *
 * A volta é obrigatória: ligar só `[open]` prenderia o painel ao valor inicial,
 * e o Escape e o Cancelar pediriam para fechar a um pai que não escuta. O
 * estado mora num SINAL, e não num campo comum como na story — ali quem agenda
 * o redesenho é o próprio evento do renderer.
 */
export function alertDialogControlledSource(): string {
  const labels = destructiveLabels();
  const { lines, list } = imports(false);
  return `${lines}

@Component({
  imports: [${list}],
  template: \`
    <button ndsButton variant="destructive" (click)="isOpen.set(true)">
      ${labels.triggerLabel}
    </button>

    <nds-alert-dialog [open]="isOpen()" (openChange)="isOpen.set($event)">
${panelContent(labels, '      ')}
    </nds-alert-dialog>
  \`,
})
export class Example {
  readonly isOpen = signal(false);

  deleteAccount(): void {
    // A ação roda aqui; quem fecha o diálogo é o primitivo.
  }
}`;
}

/**
 * Confirmação neutra: a ação fica na variante padrão do Button, e o gatilho em
 * `outline`. Vermelho é reservado ao irreversível — usá-lo em "sair da conta"
 * gastaria o sinal.
 */
export function alertDialogNeutralSource(): string {
  return example({
    ...neutralLabels(),
    tone: 'default',
    triggerVariant: 'outline',
    actionMethod: 'signOut',
  });
}

/**
 * A caixa de mídia no topo do cabeçalho. No estreito a folha centraliza a
 * CAIXA do ícone; o texto do cabeçalho já centraliza por conta própria.
 */
export function alertDialogWithMediaSource(): string {
  return example({ ...destructiveLabels(), media: true });
}

/**
 * A AUSÊNCIA da descrição é o assunto: sem ela o painel deixa de declarar
 * `aria-describedby` em vez de apontar para um id inexistente. Uma transform que
 * só encurtasse o texto ensinaria o contrário.
 */
export function alertDialogWithoutDescriptionSource(): string {
  return example({
    ...WITHOUT_DESCRIPTION_LABELS,
    description: '',
    actionMethod: 'discardDraft',
  });
}

/** Descrição de duas frases: o painel cresce em altura, e a largura não muda. */
export function alertDialogLongDescriptionSource(): string {
  return example({ ...destructiveLabels(), description: LONG_DESCRIPTION });
}

/**
 * Extensibilidade por classe: o painel recebe a sua pela entrada `panelClass`
 * da raiz — ele é portalado, e classe posta em `<nds-alert-dialog>` ficaria no
 * host, na página. As peças internas recebem no próprio `class`.
 */
export function alertDialogExtraClassSource(): string {
  return example({
    ...destructiveLabels(),
    media: true,
    mediaClass: 'nds-shrink-0',
    panelClass: 'nds-overflow-hidden',
  });
}

/**
 * O título num nível diferente de `h2`.
 *
 * Aberto de dentro de uma seção que já está em `h2`, o painel entra em `h3`
 * para não repetir o degrau. Nada mais muda — o `aria-labelledby` sai do id
 * REAL do título, e não da tag.
 */
export function alertDialogHeadingH3Source(): string {
  return example({ ...destructiveLabels(), titleTag: 'h3' });
}
