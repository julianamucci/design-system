<script lang="ts" module>
  // ─── ComposerAttachments ───────────────────────────────────────────────────
  //
  // A fila de arquivos que vai junto com a mensagem.
  //
  // Desenho em `nds/composer.css`, no bloco de anexos, que também guarda as
  // cinco decisões de acessibilidade. O vocabulário — `Attachment`,
  // `AttachmentState` — vem de `@shared/primitives/chat-protocol`, e a conversão
  // de bytes de `@shared/primitives/file-size`.
  //
  // A DECISÃO QUE GOVERNA A PEÇA: a barra de progresso é DECORATIVA, e o estado
  // é TEXTO. A barra muda a cada instante, e é a mesma armadilha do contador de
  // caracteres e do relógio do media player — número que se reanuncia torna a
  // tela impossível de ouvir. Quem lê com leitor de tela recebe a palavra, que é
  // o que decide o que fazer: "Enviando" pede paciência, "Falhou" pede ação.
  //
  // O QUE O COMPONENTE NÃO FAZ: subir arquivo, decidir o que pode ser anexado,
  // ou remover coisa alguma. Ele desenha a fila que recebe e avisa que alguém
  // pediu para remover. Quem consome sobe, valida e decide — mesma divisão de
  // `approval` no `chat-thread`.
  import type { AttachmentState } from '@shared/primitives/chat-protocol';
  import type { FileSizeUnit } from '@shared/primitives/file-size';

  /**
   * O vocabulário da fila.
   *
   * A conversão de bytes é compartilhada pelas cinco stacks; o que mora aqui é
   * só o TEXTO, porque unidade e estado são texto de interface e têm três
   * idiomas.
   */
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
</script>

<script lang="ts">
  import { formatFileSize } from '@shared/primitives/file-size';
  import type { Attachment } from '@shared/primitives/chat-protocol';
  import { Button } from '@/components/ui/button';

  const {
    attachments,
    labels,
    onRemove,
  }: {
    attachments: Attachment[];
    labels: ComposerAttachmentLabels;
    /** Alguém pediu para remover. Remover de verdade é de quem consome. */
    onRemove?: (attachment: Attachment) => void;
  } = $props();

  /**
   * O tamanho já escrito: número no idioma da página, unidade em palavra.
   *
   * A conta vem do primitivo; o texto, dos rótulos. Sem tamanho não há frase —
   * quem produz o dado nem sempre sabe quanto o arquivo tem, e "0 B" seria uma
   * informação inventada.
   */
  function sizeText(attachment: Attachment): string | null {
    if (attachment.size === undefined) return null;
    const { value, unit } = formatFileSize(attachment.size);
    return `${value.toLocaleString()} ${labels.unit[unit]}`;
  }

  /**
   * O texto de apoio junta tamanho e ESTADO.
   *
   * É por ele que quem ouve sabe o que está acontecendo — a barra não fala.
   */
  function metaText(attachment: Attachment): string {
    return [sizeText(attachment), labels.state[attachment.state]].filter(Boolean).join(' · ');
  }

  /** O nome acessível leva o NOME DO ARQUIVO. */
  function removeLabel(attachment: Attachment): string {
    return labels.remove.replace('{name}', attachment.name);
  }

  /**
   * A fração já em porcentagem, LIMITADA entre zero e cheia.
   *
   * Progresso fora da faixa é dado de quem sobe o arquivo, e uma barra que
   * estoura a moldura é defeito de desenho, não informação.
   */
  function progressValue(attachment: Attachment): string {
    const clamped = Math.min(Math.max(attachment.progress ?? 0, 0), 1);
    return `${Math.round(clamped * 100)}%`;
  }
</script>

<!--
  `<ul>`: é o que faz o leitor de tela anunciar quantos anexos há antes de
  percorrê-los. Uma pilha de `div` não anuncia nada.
-->
<ul
  data-slot="composer-attachments"
  class="nds-composer-attachments"
  aria-label={labels.list}
>
  {#each attachments as attachment, index (attachment.id ?? index)}
    <li
      class="nds-composer-attachment"
      data-slot="composer-attachment"
      data-state={attachment.state}
      data-attachment-id={attachment.id}
      aria-busy={attachment.state === 'uploading' ? 'true' : undefined}
    >
      <span class="nds-composer-attachment-name">{attachment.name}</span>
      <span class="nds-composer-attachment-meta">{metaText(attachment)}</span>

      <!--
        Decorativa: o estado já está escrito no texto de apoio, e uma barra que
        se anuncia a cada quadro é o defeito que esta peça existe para evitar.
      -->
      {#if attachment.state === 'uploading'}
        <span class="nds-composer-attachment-bar" aria-hidden="true">
          <!--
            Custom property, e não largura em `style`: o valor é dado de runtime,
            e a folha é quem decide como ele vira desenho.
          -->
          <span
            class="nds-composer-attachment-bar-fill"
            style="--nds-attachment-progress: {progressValue(attachment)}"
          ></span>
        </span>
      {/if}

      <!--
        Uma fila de três botões chamados "Remover" é indistinguível por audição:
        o nome acessível leva o nome do arquivo.
      -->
      <Button
        data-slot="composer-attachment-remove"
        variant="ghost"
        size="icon-sm"
        aria-label={removeLabel(attachment)}
        onclick={() => onRemove?.(attachment)}
      >
        ×
      </Button>
    </li>
  {/each}
</ul>
