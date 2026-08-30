import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { formatFileSize, type FileSizeUnit } from '@shared/primitives/file-size';
import type { Attachment, AttachmentState } from '@shared/primitives/chat-protocol';
import { NdsButton } from './button';

// ─── ComposerAttachments ──────────────────────────────────────────────────────
//
// A fila de arquivos que vai junto com a mensagem.
//
// Desenho em docs/shared/styles/nds/composer.css, no bloco de anexos, que
// também guarda as cinco decisões de acessibilidade. O vocabulário —
// `Attachment`, `AttachmentState` — vem de `@shared/primitives/chat-protocol`, e
// a conversão de bytes de `@shared/primitives/file-size`.
//
// A DECISÃO QUE GOVERNA A PEÇA: a barra de progresso é DECORATIVA, e o estado é
// TEXTO. A barra muda a cada instante, e é a mesma armadilha do contador de
// caracteres e do relógio do media player — número que se reanuncia torna a
// tela impossível de ouvir. Quem lê com leitor de tela recebe a palavra, que é
// o que decide o que fazer: "Enviando" pede paciência, "Falhou" pede ação.
//
// O QUE O COMPONENTE NÃO FAZ: subir arquivo, decidir o que pode ser anexado, ou
// remover coisa alguma. Ele desenha a fila que recebe e avisa que alguém pediu
// para remover. Quem consome sobe, valida e decide — mesma divisão de
// `approval` no `chat-thread`.
//
// A RAIZ É A PRÓPRIA LISTA, e é por isso que o seletor é de atributo. No Vanilla
// a fábrica devolve um `<ul>` que entra direto na moldura do campo; um seletor
// de elemento (`<nds-composer-attachments>`) somaria uma caixa entre a moldura e
// a lista, e essa caixa quebraria a coluna do `.nds-composer-field` — além de
// pôr um elemento sem papel entre a lista e os seus itens, que é justamente o
// que a decisão 3 existe para evitar. Mesma escolha do `button[ndsButton]` e do
// `div[ndsProgressIndicator]`.
//
// A DIVERGÊNCIA DE API que se REGISTRA em vez de se "alinhar": o retorno é um
// `output()`, e não um callback passado como propriedade. É o caminho desta
// stack, e é o mesmo que `submitted` e `stopped` já usam no composer.

/** O texto da fila. Sem padrão em inglês escondido. */
export interface ComposerAttachmentLabels {
  /** Nome acessível da fila. */
  list: string;
  /** Nome do botão de remover. `{name}` vira o nome do arquivo. */
  remove: string;
  /** A palavra de cada estado. É ela que o leitor de tela recebe. */
  state: Record<AttachmentState, string>;
  /** A palavra de cada unidade de tamanho. */
  unit: Record<FileSizeUnit, string>;
}

/**
 * O tamanho já escrito: número no idioma da página, unidade em palavra.
 *
 * A conta vem do primitivo; o texto, dos rótulos. Sem tamanho não há frase —
 * quem produz o dado nem sempre sabe quanto o arquivo tem, e "0 B" seria uma
 * informação inventada.
 */
function sizeText(attachment: Attachment, labels: ComposerAttachmentLabels): string | null {
  if (attachment.size === undefined) return null;
  const { value, unit } = formatFileSize(attachment.size);
  return `${value.toLocaleString()} ${labels.unit[unit]}`;
}

/**
 * A fração já limitada e em porcentagem.
 *
 * Progresso fora da faixa não estoura a barra: quem produz o dado pode mandar
 * qualquer número, e uma barra que passa da moldura vira defeito visual sem
 * nenhum aviso.
 *
 * String com unidade, e não número: `[style.--custom]` com valor numérico faz o
 * Angular anexar "px" à propriedade personalizada — a mesma nota do
 * `NdsProgressIndicator` e do `NdsAspectRatio`.
 */
function progressCss(attachment: Attachment): string {
  const clamped = Math.min(Math.max(attachment.progress ?? 0, 0), 1);
  return `${Math.round(clamped * 100)}%`;
}

@Component({
  selector: 'ul[ndsComposerAttachments]',
  standalone: true,
  imports: [NdsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-composer-attachments',
    '[attr.data-slot]': '"composer-attachments"',
    // A lista tem NOME PRÓPRIO: é o que faz o leitor de tela anunciar quantos
    // anexos há antes de percorrê-los. Uma pilha de `div` não anuncia nada.
    '[attr.aria-label]': 'labels().list',
  },
  template: `
    @for (row of items(); track row.key) {
      <li
        class="nds-composer-attachment"
        data-slot="composer-attachment"
        [attr.data-state]="row.attachment.state"
        [attr.data-attachment-id]="row.attachment.id ?? null"
        [attr.aria-busy]="row.busy"
      >
        <span class="nds-composer-attachment-name">{{ row.attachment.name }}</span>

        <!-- O texto de apoio junta tamanho e ESTADO. É por ele que quem ouve
             sabe o que está acontecendo — a barra não fala. -->
        <span class="nds-composer-attachment-meta">{{ row.meta }}</span>

        @if (row.progress !== null) {
          <!-- Decorativa: o estado já está escrito no texto de apoio, e uma
               barra que se anuncia a cada quadro é o defeito que esta peça
               existe para evitar. -->
          <span class="nds-composer-attachment-bar" aria-hidden="true">
            <!-- Propriedade personalizada, e não largura em estilo embutido: o
                 valor é dado de runtime, e a folha é quem decide como ele vira
                 desenho. -->
            <span
              class="nds-composer-attachment-bar-fill"
              [style.--nds-attachment-progress]="row.progress"
            ></span>
          </span>
        }

        <!-- O nome acessível leva o NOME DO ARQUIVO: uma fila de três botões
             chamados "Remover" é indistinguível por audição. -->
        <button
          ndsButton
          type="button"
          variant="ghost"
          size="icon-sm"
          data-slot="composer-attachment-remove"
          [attr.aria-label]="row.removeLabel"
          (click)="removeAttachment.emit(row.attachment)"
        >×</button>
      </li>
    }
  `,
})
export class NdsComposerAttachments {
  /** Os arquivos desenhados, na ordem em que chegam. */
  readonly attachments = input.required<Attachment[]>();
  /** O texto da interface. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ComposerAttachmentLabels>();

  /**
   * Alguém pediu para remover, e o anexo vai junto.
   *
   * Remover de verdade é de quem consome: quem sobe o arquivo é quem sabe se dá
   * para cancelar. O que FALHOU fica na fila — tirar sozinho esconderia o
   * problema de quem precisa decidir o que fazer com ele.
   */
  readonly removeAttachment = output<Attachment>();

  /**
   * Cada item já resolvido: o texto de apoio, o nome do botão e a fração.
   *
   * Resolver aqui, e não em chamada de método no template, é o que impede a
   * conversão de bytes de rodar a cada detecção de mudanças.
   */
  protected readonly items = computed(() => {
    const labels = this.labels();
    return this.attachments().map((attachment, index) => ({
      key: attachment.id ?? `${index}-${attachment.name}`,
      attachment,
      meta: [sizeText(attachment, labels), labels.state[attachment.state]]
        .filter(Boolean)
        .join(' · '),
      removeLabel: labels.remove.replace('{name}', attachment.name),
      // Ocupado enquanto sobe, e NÃO região viva: o progresso não se anuncia.
      busy: attachment.state === 'uploading' ? 'true' : null,
      // A barra só existe enquanto sobe: barra sem progresso seria barra
      // mentindo, e é o que separa `pending` de `uploading`.
      progress: attachment.state === 'uploading' ? progressCss(attachment) : null,
    }));
  });
}
