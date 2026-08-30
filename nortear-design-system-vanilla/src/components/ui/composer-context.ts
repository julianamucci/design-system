import {
  AppWindow,
  File,
  Folder,
  FolderGit2,
  SquareDashedText,
} from 'lucide';
import { createButton } from './button';
import {
  isContextRemovable,
  type ContextItem,
  type ContextKind,
} from '@shared/primitives/chat-protocol';

/**
 * As etiquetas do que vai junto com a pergunta sem ser carga.
 *
 * Desenho em `nds/composer.css`, no bloco de contexto, que também guarda as
 * cinco decisões de acessibilidade. O vocabulário — `ContextItem`,
 * `ContextKind`, `isContextRemovable` — vem de
 * `@shared/primitives/chat-protocol`.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: contexto não é anexo, ainda que a geometria
 * seja quase a mesma. O anexo é CARGA — sobe, tem bytes, tem progresso e pode
 * falhar no meio, e por isso a fila de anexos desenha estado e barra. O
 * contexto é REFERÊNCIA: aponta para o que já está lá, não sobe nada e não tem
 * o que esperar. É por isso que aqui não há `state` nem `progress`: não existe
 * espera para comunicar, e uma barra parada seria uma barra mentindo.
 *
 * O QUE O COMPONENTE NÃO FAZ: decidir o que entra na pergunta, o quanto um
 * item abrange, ou tirar coisa alguma. Ele desenha a lista que recebe e avisa
 * que alguém pediu para tirar um item. Quem consome monta a pergunta e decide —
 * mesma divisão de `approval` no `chat-thread`.
 */

/** Nós do lucide, na forma `[tag, atributos]` do pacote agnóstico. */
type LucideIconNode = [string, Record<string, string>];

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * O ícone de cada espécie.
 *
 * Ele é DECORATIVO, e a espécie viaja em texto no nome acessível do item
 * (decisão 2 da folha): o ícone é a única pista visual de que aquilo é um
 * trecho e não o arquivo inteiro, e pista que só existe em desenho não chega a
 * quem ouve (WCAG 1.1.1).
 *
 * O mapa é `Record<ContextKind, …>` de propósito: espécie nova no vocabulário
 * compartilhado reprova a compilação aqui, em vez de cair num ícone genérico
 * que ninguém repara que está errado.
 */
const KIND_ICONS: Record<ContextKind, LucideIconNode[]> = {
  selection: SquareDashedText as unknown as LucideIconNode[],
  file: File as unknown as LucideIconNode[],
  directory: Folder as unknown as LucideIconNode[],
  page: AppWindow as unknown as LucideIconNode[],
  repository: FolderGit2 as unknown as LucideIconNode[],
};

/**
 * Monta um ícone do lucide por `createElementNS`.
 *
 * Mesma decisão do `alert.ts` e do `breadcrumb.ts`: os nós vêm da lista
 * `[tag, attrs]` do pacote agnóstico `lucide`, e não de um `d` copiado à mão —
 * copiado, ele congela na versão do dia e some do radar quando o pacote muda o
 * desenho. Construir nós é imune a XSS: não há `innerHTML` no caminho.
 */
function createIconLucide(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

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

export interface ComposerContextOptions {
  items: ContextItem[];
  labels: ComposerContextLabels;
  /** Alguém pediu para tirar. Tirar de verdade é de quem monta a pergunta. */
  onRemove?: (item: ContextItem) => void;
}

export function createComposerContext(
  options: ComposerContextOptions,
): HTMLUListElement {
  const { items, labels, onRemove } = options;

  // `<ul>`: é o que faz o leitor de tela dizer QUANTOS itens a pergunta leva
  // antes de percorrê-los, e aqui a contagem é a informação — saber que são
  // sete arquivos muda o que se pergunta. Uma pilha de `div` não anuncia nada.
  const list = document.createElement('ul');
  list.dataset.slot = 'composer-context';
  list.className = 'nds-composer-context';
  list.setAttribute('aria-label', labels.list);

  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'nds-composer-context-item';
    li.dataset.slot = 'composer-context-item';
    li.dataset.kind = item.kind;
    if (item.id) li.dataset.contextId = item.id;
    if (item.automatic) li.dataset.automatic = 'true';

    // O ícone é DESENHO, e sai do que é lido em voz.
    const icon = createIconLucide(KIND_ICONS[item.kind]);
    icon.setAttribute('class', 'nds-composer-context-icon');
    li.appendChild(icon);

    // A espécie em TEXTO, dentro do item (decisão 2 da folha). Ela não vai
    // num `aria-label` do `<li>`: rótulo em item de lista SUBSTITUI o conteúdo
    // no anúncio, e o recorte — que é o que separa um pedaço do todo — sairia
    // junto. Escondida do olho, presente para o ouvido, e na frente do nome
    // porque é assim que a frase se lê: "Trecho relatorio.ts, linhas 12–48".
    const kind = document.createElement('span');
    kind.className = 'nds-sr-only';
    kind.textContent = labels.kind[item.kind];
    li.appendChild(kind);

    const label = document.createElement('span');
    label.className = 'nds-composer-context-label';
    label.textContent = item.label;
    li.appendChild(label);

    // O recorte, quando o item é um PEDAÇO. Sem ele, um trecho seria o nome de
    // um arquivo repetido.
    if (item.detail) {
      const detail = document.createElement('span');
      detail.className = 'nds-composer-context-detail';
      detail.textContent = item.detail;
      li.appendChild(detail);
    }

    // A decisão 3 da folha, e a máquina dela mora no protocolo: contexto
    // automático não ganha botão de remover — ele voltaria na próxima
    // pergunta, e botão que desfaz o que se refaz sozinho é armadilha. A marca
    // ocupa o lugar do botão, e é TEXTO: a moldura tracejada sozinha não
    // descreve estado (WCAG 1.4.1).
    if (isContextRemovable(item)) {
      // O nome acessível leva o NOME DO ITEM: uma lista de botões chamados
      // "Remover" é um botão só para quem navega por audição (decisão 4).
      const remove = createButton({
        label: '×',
        variant: 'ghost',
        size: 'icon-sm',
        'aria-label': labels.remove.replace('{label}', item.label),
        onClick: () => onRemove?.(item),
      });
      remove.dataset.slot = 'composer-context-remove';
      li.appendChild(remove);
    } else {
      const mark = document.createElement('span');
      mark.className = 'nds-composer-context-detail';
      mark.dataset.slot = 'composer-context-automatic';
      mark.textContent = labels.automatic;
      li.appendChild(mark);
    }

    list.appendChild(li);
  }

  return list;
}
