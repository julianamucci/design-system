import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { AppWindow, File, Folder, FolderGit2, SquareDashedText } from 'lucide';
import {
  isContextRemovable,
  type ContextItem,
  type ContextKind,
} from '@shared/primitives/chat-protocol';
import { NdsButton } from './button';

// ─── ComposerContext ──────────────────────────────────────────────────────────
//
// As etiquetas do que vai junto com a pergunta sem ser carga.
//
// Desenho em docs/shared/styles/nds/composer.css, no bloco de contexto, que
// também guarda as cinco decisões de acessibilidade. O vocabulário —
// `ContextItem`, `ContextKind`, `isContextRemovable` — vem de
// `@shared/primitives/chat-protocol`.
//
// A DECISÃO QUE GOVERNA A PEÇA: contexto não é anexo, ainda que a geometria
// seja quase a mesma. O anexo é CARGA — sobe, tem bytes, tem progresso e pode
// falhar no meio, e por isso a fila de anexos desenha estado e barra. O contexto
// é REFERÊNCIA: aponta para o que já está lá, não sobe nada e não tem o que
// esperar. É por isso que aqui não há `state` nem `progress`: não existe espera
// para comunicar, e uma barra parada seria uma barra mentindo.
//
// O QUE O COMPONENTE NÃO FAZ: decidir o que entra na pergunta, o quanto um item
// abrange, ou tirar coisa alguma. Ele desenha a lista que recebe e avisa que
// alguém pediu para tirar um item. Quem consome monta a pergunta e decide —
// mesma divisão de `approval` no `chat-thread`.
//
// A RAIZ É A PRÓPRIA LISTA, e é por isso que o seletor é de atributo. A lista
// entra direto na moldura do campo; um seletor de elemento
// (`<nds-composer-context>`) somaria uma caixa entre a moldura e a lista, e essa
// caixa quebraria a coluna do `.nds-composer-field` — além de pôr um elemento
// sem papel entre a lista e os seus itens, que é justamente o que a decisão 1 da
// folha existe para evitar. Mesma escolha do `ul[ndsComposerAttachments]`, do
// `button[ndsButton]` e do `div[ndsProgressIndicator]`.
//
// A DIVERGÊNCIA DE API que se REGISTRA em vez de se "alinhar": o retorno é um
// `output()`, e não um callback passado como propriedade. É o caminho desta
// stack, e é o mesmo que `removeAttachment` e `dismissQuote` já usam.

/** Nós do lucide, na forma `[tag, atributos]` do pacote agnóstico. */
type LucideIconNode = [string, Record<string, string>];

/**
 * O ícone de cada espécie.
 *
 * Ele é DECORATIVO, e a espécie viaja em texto no nome acessível do item
 * (decisão 2 da folha): o ícone é a única pista visual de que aquilo é um trecho
 * e não o arquivo inteiro, e pista que só existe em desenho não chega a quem
 * ouve (WCAG 1.1.1).
 *
 * O mapa é `Record<ContextKind, …>` de propósito: espécie nova no vocabulário
 * compartilhado reprova a compilação aqui, em vez de cair num ícone genérico que
 * ninguém repara que está errado.
 */
const KIND_ICONS: Record<ContextKind, LucideIconNode[]> = {
  selection: SquareDashedText as unknown as LucideIconNode[],
  file: File as unknown as LucideIconNode[],
  directory: Folder as unknown as LucideIconNode[],
  page: AppWindow as unknown as LucideIconNode[],
  repository: FolderGit2 as unknown as LucideIconNode[],
};

/**
 * Ícone decorativo da espécie.
 *
 * `@Directive`, e não template: cada ícone do lucide é uma lista `[tag, attrs]`
 * com tag variável (`path`/`rect`/`circle`), e template Angular exige tag
 * estática — então os filhos nascem de `createElementNS` num `effect`. Mesma
 * escolha do `NdsAlertIcon`, e imune a XSS: não há `innerHTML` no caminho.
 *
 * `aria-hidden` fixo: a palavra da espécie já está no item, em texto.
 */
@Directive({
  selector: 'svg[ndsComposerContextIcon]',
  standalone: true,
  host: {
    class: 'nds-composer-context-icon',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  },
})
export class NdsComposerContextIcon {
  readonly kind = input.required<ContextKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of KIND_ICONS[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [key, value] of Object.entries(attrs)) child.setAttribute(key, value);
        svg.appendChild(child);
      }
    });
  }
}

/** O texto da lista. Sem padrão em inglês escondido. */
export interface ComposerContextLabels {
  /** Nome acessível da lista. */
  list: string;
  /** Nome do botão de remover. `{label}` vira o nome do item. */
  remove: string;
  /** A palavra de cada espécie. É ela que o leitor de tela recebe. */
  kind: Record<ContextKind, string>;
  /** A marca do que entrou sem ninguém pedir. É texto, e não só a cor. */
  automatic: string;
}

@Component({
  selector: 'ul[ndsComposerContext]',
  standalone: true,
  imports: [NdsButton, NdsComposerContextIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-composer-context',
    '[attr.data-slot]': '"composer-context"',
    // A lista tem NOME PRÓPRIO: é o que faz o leitor de tela dizer QUANTOS itens
    // a pergunta leva antes de percorrê-los, e aqui a contagem é a informação —
    // saber que são sete arquivos muda o que se pergunta.
    '[attr.aria-label]': 'labels().list',
  },
  template: `
    @for (row of rows(); track row.key) {
      <li
        class="nds-composer-context-item"
        data-slot="composer-context-item"
        [attr.data-kind]="row.item.kind"
        [attr.data-context-id]="row.item.id ?? null"
        [attr.data-automatic]="row.automatic"
      >
        <!-- O ícone é DESENHO, e sai do que é lido em voz. -->
        <svg ndsComposerContextIcon [kind]="row.item.kind"></svg>

        <!-- A espécie em TEXTO, dentro do item (decisão 2 da folha). Ela não vai
             num aria-label do item de lista: rótulo ali SUBSTITUI o conteúdo no
             anúncio, e o recorte — que é o que separa um pedaço do todo —
             sairia junto. Escondida do olho, presente para o ouvido, e na
             frente do nome porque é assim que a frase se lê. -->
        <span class="nds-sr-only">{{ row.kindWord }}</span>

        <span class="nds-composer-context-label">{{ row.item.label }}</span>

        <!-- O recorte, quando o item é um PEDAÇO. Sem ele, um trecho seria o
             nome de um arquivo repetido. -->
        @if (row.item.detail) {
          <span class="nds-composer-context-detail">{{ row.item.detail }}</span>
        }

        <!-- A decisão 3 da folha, e a máquina dela mora no protocolo: contexto
             automático não ganha botão de remover — ele voltaria na próxima
             pergunta, e botão que desfaz o que se refaz sozinho é armadilha. A
             marca ocupa o lugar do botão, e é TEXTO: a moldura tracejada sozinha
             não descreve estado (WCAG 1.4.1). -->
        @if (row.removable) {
          <!-- O nome acessível leva o NOME DO ITEM: uma lista de botões chamados
               "Remover" é um botão só para quem navega por audição (decisão 4). -->
          <button
            ndsButton
            type="button"
            variant="ghost"
            size="icon-sm"
            class="nds-composer-context-remove"
            data-slot="composer-context-remove"
            [attr.aria-label]="row.removeLabel"
            (click)="removeContext.emit(row.item)"
          >×</button>
        } @else {
          <span
            class="nds-composer-context-detail"
            data-slot="composer-context-automatic"
          >{{ labels().automatic }}</span>
        }
      </li>
    }
  `,
})
export class NdsComposerContext {
  /** As referências desenhadas, na ordem em que chegam. */
  readonly items = input.required<ContextItem[]>();
  /** O texto da interface. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ComposerContextLabels>();

  /**
   * Alguém pediu para tirar, e o item vai junto.
   *
   * Tirar de verdade é de quem monta a pergunta: só ele sabe o que sobra sem
   * aquele item. O componente avisa e devolve o controle.
   */
  readonly removeContext = output<ContextItem>();

  /**
   * Cada linha já resolvida: a palavra da espécie, o nome do botão e quem pode
   * ser tirado.
   *
   * Resolver aqui, e não em chamada de método no template, é o que impede a
   * pergunta ao protocolo de rodar a cada detecção de mudanças.
   */
  protected readonly rows = computed(() => {
    const labels = this.labels();
    return this.items().map((item, index) => ({
      key: item.id ?? `${index}-${item.label}`,
      item,
      kindWord: labels.kind[item.kind],
      // A decisão de quem pode ser tirado sai do vocabulário compartilhado, e
      // não de um `if (item.automatic)` escrito aqui: cinco stacks escreveriam
      // cinco versões da mesma regra, e uma delas discordaria.
      removable: isContextRemovable(item),
      removeLabel: labels.remove.replace('{label}', item.label),
      automatic: item.automatic ? 'true' : null,
    }));
  });
}
