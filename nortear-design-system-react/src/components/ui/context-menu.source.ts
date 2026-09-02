/**
 * Transforms do painel Code do ContextMenu.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O andaime que o painel imprimia era o `<AreaGatilho>` do módulo de fixtures —
 * uma tag sem origem para quem copiava. O que ela embrulhava é o
 * `ContextMenuTrigger` com o vocabulário de classe da área de clique direito, e
 * é isso que os snippets escrevem por extenso.
 */
import { childText, jsxSnippet, type SourceTransform } from '@/lib/story-source';

export type ContextMenuArgs = {
  triggerLabel: string;
};

const LABEL_DEFAULT = 'Clique com o botão direito aqui';

/**
 * A moldura tracejada da área de clique direito.
 *
 * O ContextMenu não tem botão: o que a pessoa vê é o próprio conteúdo. Numa
 * demonstração ele precisa de uma moldura que diga onde clicar, e as duas
 * classes de borda são necessárias — `nds-border-default` traz largura e cor,
 * `nds-border-dashed` só troca o estilo. Num produto real o gatilho embrulha o
 * conteúdo (um cartão, uma linha de lista) e dispensa a moldura.
 *
 * Sem altura fixa: o quadro nasce do `nds-p-8` e cresce junto quando a pessoa
 * aumenta a fonte do navegador (WCAG 1.4.4).
 */
const CLASSES_DA_AREA =
  'nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-border-default nds-border-dashed nds-text-body nds-text-muted-foreground nds-cursor-default';

function area(label: string): string {
  return `  <ContextMenuTrigger
    className="${CLASSES_DA_AREA}"
    data-align="center"
    data-justify="center"
  >
    ${label}
  </ContextMenuTrigger>`;
}

function importDe(...parts: string[]): string {
  return `import {
${parts.map((part) => `  ${part},`).join('\n')}
} from "@/components/ui/context-menu";`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo.
 *
 * Ensina o arranjo canônico: a área que responde ao gesto, um grupo de ações
 * com atalho, o divisor e a ação destrutiva. O atalho fica DENTRO do item e sem
 * `aria-hidden`, porque "Excluir, Delete" é o nome útil — escondido, o atalho só
 * existe para quem enxerga.
 */
export const contextMenuSource: SourceTransform<ContextMenuArgs> = (_gerado, ctx) => {
  const label = childText(ctx?.args?.triggerLabel, LABEL_DEFAULT);
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(label)}
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuItem>
        Editar
        <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem>Duplicar</ContextMenuItem>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir
      <ContextMenuShortcut>Delete</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  );
};

/**
 * Com marcação: `ContextMenuCheckboxItem` é de DOIS estados — `checked` é
 * booleano, o payload da mudança é booleano, e não existe terceiro valor para
 * anunciar como misto. O estado vive fora do menu, que só avisa a troca.
 */
export function contextMenuWithMarkupSource(): string {
  return jsxSnippet(
    `${importDe(
  'ContextMenu',
  'ContextMenuCheckboxItem',
  'ContextMenuContent',
  'ContextMenuGroup',
  'ContextMenuLabel',
  'ContextMenuTrigger',
)}
import { useState } from "react";`,
    `function MenuDeVisualizacao() {
  const [grade, setGrade] = useState(false);
  const [reguas, setReguas] = useState(true);

  return (
    <ContextMenu>
${area(LABEL_DEFAULT).replace(/^/gm, '    ')}
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Visualização</ContextMenuLabel>
          <ContextMenuCheckboxItem
            checked={grade}
            onCheckedChange={(valor) => setGrade(valor)}
          >
            Mostrar grade
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={reguas}
            onCheckedChange={(valor) => setReguas(valor)}
          >
            Mostrar réguas
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}`,
  );
}

/**
 * Com escolha única: quem guarda o valor é o `ContextMenuRadioGroup`, e cada
 * opção declara o seu `value`. É o papel do grupo que faz o leitor de tela
 * anunciar "opção 2 de 3" em vez de três marcações independentes.
 */
export function contextMenuWithChoiceUnicaSource(): string {
  return jsxSnippet(
    `${importDe(
  'ContextMenu',
  'ContextMenuContent',
  'ContextMenuGroup',
  'ContextMenuLabel',
  'ContextMenuRadioGroup',
  'ContextMenuRadioItem',
  'ContextMenuTrigger',
)}
import { useState } from "react";`,
    `function MenuDeZoom() {
  const [zoom, setZoom] = useState("100");

  return (
    <ContextMenu>
${area(LABEL_DEFAULT).replace(/^/gm, '    ')}
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Zoom</ContextMenuLabel>
          <ContextMenuRadioGroup value={zoom} onValueChange={(valor) => setZoom(valor)}>
            <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}`,
  );
}

/**
 * Com submenu: as três peças andam juntas — `Sub` guarda o estado, `SubTrigger`
 * é o item que abre e `SubContent` é o painel filho. O sub-gatilho já anuncia
 * `aria-haspopup="menu"` sozinho, e o painel nasce à direita do item.
 */
export function contextMenuWithSubmenuSource(): string {
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSub',
      'ContextMenuSubContent',
      'ContextMenuSubTrigger',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(LABEL_DEFAULT)}
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Por e-mail</ContextMenuItem>
        <ContextMenuItem>Por link</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  </ContextMenuContent>
</ContextMenu>`,
  );
}

/**
 * Item desabilitado: `disabled` no item, e não no menu.
 *
 * A atenuação é o sinal que sobra quando o contraste falha, mas quem anuncia o
 * estado é o markup — a folha também tira o item do alcance do ponteiro, então
 * não há caminho nenhum que o execute.
 */
export function contextMenuItemDisabledSource(): string {
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(LABEL_DEFAULT)}
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuItem>
        Editar
        <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem disabled>Duplicar</ContextMenuItem>
      <ContextMenuItem>Renomear</ContextMenuItem>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive" disabled>
      Excluir
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  );
}

/**
 * Item recuado: `inset` alinha o rótulo com os itens que têm indicador à
 * esquerda. Só a borda esquerda é empurrada — a caixa continua terminando onde
 * as outras terminam, senão o menu ganharia um degrau à direita.
 */
export function contextMenuItemRecuadoSource(): string {
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuItem',
      'ContextMenuLabel',
      'ContextMenuSeparator',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(LABEL_DEFAULT)}
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel inset>Arquivo</ContextMenuLabel>
      <ContextMenuItem>Editar</ContextMenuItem>
      <ContextMenuItem inset>Duplicar</ContextMenuItem>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuItem inset variant="destructive">
      Excluir
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  );
}

/**
 * Composição completa: marcação e escolha única convivendo no mesmo menu, com
 * rótulo por bloco e divisor entre eles.
 *
 * Vale como snippet próprio porque a convivência é o assunto — cada peça
 * isolada já aparece nas outras composições, e nenhuma delas mostra a ordem em
 * que os blocos se sucedem.
 */
export function contextMenuCompletoSource(): string {
  return jsxSnippet(
    `${importDe(
  'ContextMenu',
  'ContextMenuCheckboxItem',
  'ContextMenuContent',
  'ContextMenuGroup',
  'ContextMenuItem',
  'ContextMenuLabel',
  'ContextMenuRadioGroup',
  'ContextMenuRadioItem',
  'ContextMenuSeparator',
  'ContextMenuShortcut',
  'ContextMenuSub',
  'ContextMenuSubContent',
  'ContextMenuSubTrigger',
  'ContextMenuTrigger',
)}
import { useState } from "react";`,
    `function MenuDoCanvas() {
  const [grade, setGrade] = useState(true);
  const [zoom, setZoom] = useState("100");

  return (
    <ContextMenu>
${area(LABEL_DEFAULT).replace(/^/gm, '    ')}
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Ações</ContextMenuLabel>
          <ContextMenuItem>
            Editar
            <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Por e-mail</ContextMenuItem>
              <ContextMenuItem>Por link</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Visualização</ContextMenuLabel>
          <ContextMenuCheckboxItem
            checked={grade}
            onCheckedChange={(valor) => setGrade(valor)}
          >
            Mostrar grade
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Zoom</ContextMenuLabel>
          <ContextMenuRadioGroup value={zoom} onValueChange={(valor) => setZoom(valor)}>
            <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          Excluir
          <ContextMenuShortcut>Delete</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}`,
  );
}
