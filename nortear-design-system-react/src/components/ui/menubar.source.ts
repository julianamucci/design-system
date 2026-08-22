/**
 * Transforms do painel Code do Menubar.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta da barra — `contain: layout`, `minHeight`,
 * `position: relative` — é andaime de captura, para o painel portalizado ter
 * contra o que se posicionar dentro do quadro do Storybook. Nada disso é do
 * componente, e por isso nada disso entra no snippet.
 *
 * Duas outras marcas de andaime também ficam de fora: `modal={false}` e o
 * `defaultOpen` que quase toda story usa só para o Chromatic fotografar o painel
 * aberto. O painel aberto não muda a MARCAÇÃO que se copia — só a story que
 * trata do estado inicial ensina `defaultOpen`, e é a de estado aberto.
 */
import { attrs, jsxSnippet, propBool, type SourceTransform } from '@/lib/story-source';

export type MenubarArgs = {
  modal: boolean;
  loopFocus: boolean;
};

/** Bloco de import do menubar, sempre em ordem alfabética das peças usadas. */
function importingMenubar(...parts: string[]): string {
  const lista = [...parts].sort();
  return `import {\n${lista.map((part) => `  ${part},`).join('\n')}\n} from "@/components/ui/menubar";`;
}

/**
 * Um menu da barra: gatilho mais painel.
 *
 * `MenubarMenu` é o par de gatilho e painel — a barra é a lista deles, e é por
 * isso que a `<Menubar>` nunca recebe item nenhum diretamente.
 */
function menu(rotulo: string, miolo: string, aberto = false): string {
  return `  <MenubarMenu${aberto ? ' defaultOpen' : ''}>
    <MenubarTrigger>${rotulo}</MenubarTrigger>
    <MenubarContent>
${miolo}
    </MenubarContent>
  </MenubarMenu>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na barra fechada, que é o padrão do
 * componente e o uso canônico.
 *
 * `modal` e `loopFocus` nascem LIGADOS no primitivo, então só aparecem quando a
 * story os desliga: repetir valor padrão ensina ruído a quem copia.
 *
 * `onOpenChange` NÃO é interpolado: o Storybook o entrega como espião, e o corpo
 * do mock apareceria no painel como se fosse código do design system.
 */
export const menubarSource: SourceTransform<MenubarArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const raiz = attrs(
    propBool('modal', args.modal, true),
    propBool('loopFocus', args.loopFocus, true),
  );

  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarShortcut',
      'MenubarTrigger',
    ),
    `<Menubar${raiz}>
${menu(
  'Arquivo',
  `      <MenubarItem>
        Novo <MenubarShortcut>⌘N</MenubarShortcut>
      </MenubarItem>
      <MenubarItem>
        Abrir <MenubarShortcut>⌘O</MenubarShortcut>
      </MenubarItem>`,
)}
${menu(
  'Editar',
  `      <MenubarItem>
        Desfazer <MenubarShortcut>⌘Z</MenubarShortcut>
      </MenubarItem>
      <MenubarItem>
        Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut>
      </MenubarItem>`,
)}
</Menubar>`,
  );
};

/**
 * Item neutro: a ênfase padrão, e por isso SEM atributo nenhum. A ausência de
 * `variant` é o assunto da story — é o que faz o item herdar a cor do painel em
 * vez de carregar cor semântica.
 */
export function menubarItemNeutralSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Abrir</MenubarItem>
      <MenubarItem>Salvar</MenubarItem>`,
)}
</Menubar>`,
  );
}

/**
 * Item destrutivo: a cor de perigo é o que separa "Descartar alterações" de
 * "Salvar". O separador acima dele não é enfeite — é a distância que evita o
 * clique errado por vizinhança.
 */
export function menubarItemDestructiveSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarSeparator',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarItem>Salvar</MenubarItem>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Descartar alterações</MenubarItem>`,
)}
</Menubar>`,
  );
}

/**
 * Aberto por estado inicial. `defaultOpen` mora no MENU, não na barra: cada par
 * de gatilho e painel governa a própria abertura, e é o que permite abrir um
 * sem que os vizinhos saibam.
 */
export function menubarOpenSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Abrir</MenubarItem>`,
  true,
)}
${menu('Editar', `      <MenubarItem>Desfazer</MenubarItem>`)}
</Menubar>`,
  );
}

/**
 * Item bloqueado. O primitivo publica `aria-disabled`, e não o atributo
 * `disabled`: o item continua alcançável pela seta para ser ANUNCIADO como
 * indisponível, em vez de sumir sem explicação de quem navega por teclado.
 */
export function menubarItemBloqueadoSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Salvar</MenubarItem>
      <MenubarItem disabled>Enviar para revisão</MenubarItem>`,
)}
</Menubar>`,
  );
}

/**
 * Item marcado. `defaultChecked` liga a linha na montagem; a AUSÊNCIA da prop é
 * o estado desmarcado — escrever `defaultChecked={false}` só repetiria o padrão.
 *
 * O `MenubarLabel` vem sempre dentro de um `MenubarGroup`: nesta stack o rótulo
 * é quem vira o `aria-labelledby` do grupo, e sem o grupo ancestral ele lança em
 * tempo de render.
 */
export function menubarItemCheckedSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarGroup',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Exibir',
  `      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem defaultChecked>Régua</MenubarCheckboxItem>
        <MenubarCheckboxItem>Grade</MenubarCheckboxItem>
      </MenubarGroup>`,
)}
</Menubar>`,
  );
}

/**
 * Submenu. `MenubarSub` empilha outro par de gatilho e painel DENTRO do painel,
 * e o pai continua aberto: é isso que distingue submenu de troca de menu.
 */
export function menubarSubmenuSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarSub',
      'MenubarSubContent',
      'MenubarSubTrigger',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarItem>Novo</MenubarItem>
      <MenubarSub>
        <MenubarSubTrigger>Exportar</MenubarSubTrigger>
        <MenubarSubContent>
          <MenubarItem>PDF</MenubarItem>
          <MenubarItem>CSV</MenubarItem>
          <MenubarItem>PNG</MenubarItem>
        </MenubarSubContent>
      </MenubarSub>`,
)}
</Menubar>`,
  );
}

/**
 * Alternadores independentes: cada linha vale por si, e marcar uma não fecha o
 * menu — quem marca uma quer marcar a próxima.
 */
export function selectionMenubarBoxesSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarGroup',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Exibir',
  `      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem defaultChecked>Régua</MenubarCheckboxItem>
        <MenubarCheckboxItem>Barra lateral</MenubarCheckboxItem>
        <MenubarCheckboxItem>Grade</MenubarCheckboxItem>
      </MenubarGroup>`,
)}
</Menubar>`,
  );
}

/**
 * Escolha única. O grupo é quem guarda o valor — os itens só declaram o seu —, e
 * por isso a marcação se transfere sozinha de um para o outro.
 */
export function menubarChoiceUnicaSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarRadioGroup',
      'MenubarRadioItem',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Aparência',
  `      <MenubarRadioGroup defaultValue="light">
        <MenubarLabel>Tema</MenubarLabel>
        <MenubarRadioItem value="light">Claro</MenubarRadioItem>
        <MenubarRadioItem value="dark">Escuro</MenubarRadioItem>
        <MenubarRadioItem value="system">Do sistema</MenubarRadioItem>
      </MenubarRadioGroup>`,
)}
</Menubar>`,
  );
}

/**
 * A barra completa de um editor: as quatro categorias clássicas convivendo, com
 * grupo rotulado, separador, ação destrutiva, atalhos e alternadores. É a única
 * composição que mostra as peças CONVIVENDO — cada uma sozinha esconde o custo
 * de arrumar a hierarquia dentro de um painel só.
 */
export function menubarEditorSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarGroup',
      'MenubarItem',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarSeparator',
      'MenubarShortcut',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarGroup>
        <MenubarLabel>Documento</MenubarLabel>
        <MenubarItem>
          Novo <MenubarShortcut>⌘N</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Abrir <MenubarShortcut>⌘O</MenubarShortcut>
        </MenubarItem>
      </MenubarGroup>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Descartar alterações</MenubarItem>`,
)}
${menu(
  'Editar',
  `      <MenubarItem>
        Desfazer <MenubarShortcut>⌘Z</MenubarShortcut>
      </MenubarItem>
      <MenubarItem>
        Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut>
      </MenubarItem>`,
)}
${menu(
  'Exibir',
  `      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem defaultChecked>Régua</MenubarCheckboxItem>
        <MenubarCheckboxItem>Grade</MenubarCheckboxItem>
      </MenubarGroup>`,
)}
${menu(
  'Ajuda',
  `      <MenubarItem>Documentação</MenubarItem>
      <MenubarItem>Atalhos de teclado</MenubarItem>`,
)}
</Menubar>`,
  );
}
