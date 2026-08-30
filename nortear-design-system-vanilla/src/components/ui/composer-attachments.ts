import { createButton } from './button';
import { formatFileSize, type FileSizeUnit } from '@shared/primitives/file-size';
import type { Attachment, AttachmentState } from '@shared/primitives/chat-protocol';

/**
 * A fila de arquivos que vai junto com a mensagem.
 *
 * Desenho em `nds/composer.css`, no bloco de anexos, que também guarda as cinco
 * decisões de acessibilidade. O vocabulário — `Attachment`, `AttachmentState` —
 * vem de `@shared/primitives/chat-protocol`, e a conversão de bytes de
 * `@shared/primitives/file-size`.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: a barra de progresso é DECORATIVA, e o estado é
 * TEXTO. A barra muda a cada instante, e é a mesma armadilha do contador de
 * caracteres e do relógio do media player — número que se reanuncia torna a
 * tela impossível de ouvir. Quem lê com leitor de tela recebe a palavra, que é
 * o que decide o que fazer: "Enviando" pede paciência, "Falhou" pede ação.
 *
 * O QUE O COMPONENTE NÃO FAZ: subir arquivo, decidir o que pode ser anexado,
 * ou remover coisa alguma. Ele desenha a fila que recebe e avisa que alguém
 * pediu para remover. Quem consome sobe, valida e decide — mesma divisão de
 * `approval` no `chat-thread`.
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

export interface ComposerAttachmentsOptions {
  attachments: Attachment[];
  labels: ComposerAttachmentLabels;
  /** Alguém pediu para remover. Remover de verdade é de quem consome. */
  onRemove?: (attachment: Attachment) => void;
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

export function createComposerAttachments(
  options: ComposerAttachmentsOptions,
): HTMLUListElement {
  const { attachments, labels, onRemove } = options;

  // `<ul>`: é o que faz o leitor de tela anunciar quantos anexos há antes de
  // percorrê-los. Uma pilha de `div` não anuncia nada.
  const list = document.createElement('ul');
  list.dataset.slot = 'composer-attachments';
  list.className = 'nds-composer-attachments';
  list.setAttribute('aria-label', labels.list);

  for (const attachment of attachments) {
    const item = document.createElement('li');
    item.className = 'nds-composer-attachment';
    item.dataset.slot = 'composer-attachment';
    item.dataset.state = attachment.state;
    if (attachment.id) item.dataset.attachmentId = attachment.id;
    // Ocupado enquanto sobe, e NÃO região viva: o progresso não se anuncia.
    if (attachment.state === 'uploading') item.setAttribute('aria-busy', 'true');

    const name = document.createElement('span');
    name.className = 'nds-composer-attachment-name';
    name.textContent = attachment.name;
    item.appendChild(name);

    // O texto de apoio junta tamanho e ESTADO. É por ele que quem ouve sabe
    // o que está acontecendo — a barra não fala.
    const meta = document.createElement('span');
    meta.className = 'nds-composer-attachment-meta';
    meta.textContent = [sizeText(attachment, labels), labels.state[attachment.state]]
      .filter(Boolean)
      .join(' · ');
    item.appendChild(meta);

    if (attachment.state === 'uploading') {
      const bar = document.createElement('span');
      bar.className = 'nds-composer-attachment-bar';
      // Decorativa: o estado já está escrito no texto de apoio, e uma barra que
      // se anuncia a cada quadro é o defeito que esta peça existe para evitar.
      bar.setAttribute('aria-hidden', 'true');

      const fill = document.createElement('span');
      fill.className = 'nds-composer-attachment-bar-fill';
      // Custom property, e não largura em `style`: o valor é dado de runtime, e
      // a folha é quem decide como ele vira desenho.
      const pct = Math.round(Math.min(Math.max(attachment.progress ?? 0, 0), 1) * 100);
      fill.style.setProperty('--nds-attachment-progress', `${pct}%`);
      bar.appendChild(fill);
      item.appendChild(bar);
    }

    // O nome acessível leva o NOME DO ARQUIVO: uma fila de três botões
    // chamados "Remover" é indistinguível por audição.
    const remove = createButton({
      label: '×',
      variant: 'ghost',
      size: 'icon-sm',
      'aria-label': labels.remove.replace('{name}', attachment.name),
      onClick: () => onRemove?.(attachment),
    });
    remove.dataset.slot = 'composer-attachment-remove';
    item.appendChild(remove);

    list.appendChild(item);
  }

  return list;
}
