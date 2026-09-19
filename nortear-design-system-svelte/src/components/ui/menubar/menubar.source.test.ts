import { describe, expect, it } from 'vitest';
import {
  menubarCheckboxCheckedSource,
  menubarCheckboxIndeterminateSource,
  menubarControlledSource,
  menubarDefaultSource,
  menubarDestructiveSource,
  menubarEntriesSource,
  menubarItemDisabledSource,
  menubarPanelScrollsSource,
  menubarSource,
  menubarWithCheckboxSource,
  menubarWithRadioSource,
  menubarWithShortcutsSource,
  menubarWithSubmenuSource,
} from './menubar.source';

describe('menubarSource', () => {
  it('sem args, entrega a barra canônica com as quatro categorias clássicas', () => {
    expect(menubarSource()).toBe(
      `<script lang="ts">
  import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
  } from "@/components/ui/menubar";
</script>

<Menubar>
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Abrir</MenubarItem>
      <MenubarItem>Salvar</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer</MenubarItem>
      <MenubarItem>Refazer</MenubarItem>
      <MenubarItem>Copiar</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="view">
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Aproximar</MenubarItem>
      <MenubarItem>Afastar</MenubarItem>
      <MenubarItem>Tela cheia</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="help">
    <MenubarTrigger>Ajuda</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Documentação</MenubarItem>
      <MenubarItem>Atalhos de teclado</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
    );
  });

  it('o menu aberto ao montar declara o estado de fora, por bind:value', () => {
    const output = menubarSource('', { args: { defaultValue: 'file' } });
    expect(output).toContain('let menuAberto = $state("file");');
    expect(output).toContain('<Menubar bind:value={menuAberto}>');
  });

  it('só escreve loop quando o valor difere do padrão', () => {
    expect(menubarSource('', { args: { loop: true } })).not.toContain('loop');
    expect(menubarSource('', { args: { loop: false } })).toContain('loop={false}');
  });

  it('a ênfase de perigo chega a cada item da demonstração padrão', () => {
    expect(menubarSource()).not.toContain('variant=');
    const output = menubarSource('', { args: { variant: 'destructive' } });
    expect(output.match(/<MenubarItem variant="destructive">/g)).toHaveLength(11);
  });

  it('a ficha de perigo separa a ação irreversível das demais', () => {
    const output = menubarSource('', { args: { demonstration: 'destructive' } });
    expect(output).toContain('<MenubarSeparator />');
    expect(output).toContain('<MenubarItem variant="destructive">Descartar alterações</MenubarItem>');
  });

  it('os atalhos aparecem dentro do item, e não em coluna separada', () => {
    const output = menubarSource('', { args: { demonstration: 'shortcuts' } });
    expect(output).toContain('<MenubarShortcut>Ctrl+Z</MenubarShortcut>');
    expect(output.match(/<MenubarShortcut>/g)).toHaveLength(3);
  });

  it('o submenu aninha o próprio painel dentro do item', () => {
    const output = menubarSource('', { args: { demonstration: 'submenu' } });
    expect(output).toContain('<MenubarSubTrigger>Exportar</MenubarSubTrigger>');
    expect(output).toContain('<MenubarSubContent>');
  });

  it('os alternadores vinculam um estado por linha, sob um cabeçalho que nomeia o grupo', () => {
    const output = menubarSource('', { args: { demonstration: 'checkbox' } });
    expect(output).toContain('let regua = $state(true);');
    expect(output).toContain('<MenubarCheckboxItem bind:checked={regua}>Régua</MenubarCheckboxItem>');
    expect(output).toContain('<MenubarLabel>Mostrar na tela</MenubarLabel>');
  });

  it('o estado misto é escrito por prop própria, ao lado do marcado e do vazio', () => {
    const output = menubarSource('', { args: { demonstration: 'indeterminate' } });
    expect(output).toContain('<MenubarCheckboxItem indeterminate>Colunas</MenubarCheckboxItem>');
    expect(output).toContain('<MenubarCheckboxItem checked>Régua</MenubarCheckboxItem>');
    expect(output).toContain('<MenubarCheckboxItem>Grade</MenubarCheckboxItem>');
  });

  it('a escolha única guarda o valor no grupo, e não em cada opção', () => {
    const output = menubarSource('', { args: { demonstration: 'radio' } });
    expect(output).toContain('let tema = $state("light");');
    expect(output).toContain('<MenubarRadioGroup bind:value={tema}>');
    expect(output.match(/<MenubarRadioItem value="/g)).toHaveLength(3);
  });

  it('o item bloqueado usa a prop, sem sumir da lista', () => {
    const output = menubarSource('', { args: { demonstration: 'itemDisabled' } });
    expect(output).toContain('<MenubarItem disabled>Enviar para revisão</MenubarItem>');
  });

  it('a barra de editor junta as quatro categorias com grupos, atalhos e alternadores', () => {
    const output = menubarSource('', { args: { demonstration: 'editor' } });
    expect(output.match(/<MenubarMenu value="/g)).toHaveLength(4);
    expect(output).toContain('<MenubarLabel>Documento</MenubarLabel>');
    expect(output).toContain('let grade = $state(false);');
  });

  it('nenhuma composição importa peça que não usa', () => {
    // O bloco de import é copiado inteiro: um nome a mais quebra a compilação de
    // quem cola o snippet só depois, no primeiro build.
    const output = menubarSource('', { args: { demonstration: 'itemDisabled' } });
    expect(output).not.toContain('MenubarShortcut');
    expect(output).not.toContain('MenubarSeparator');
  });
});

describe('menubarEntriesSource — o código dos cards de Variantes', () => {
  it('um MenubarMenu por gatilho, com os rótulos que recebeu', () => {
    const output = menubarEntriesSource({
      menus: [
        {
          value: 'file',
          triggerLabel: 'File',
          entries: [
            { type: 'item', label: 'New', value: 'new', shortcut: 'Ctrl+N' },
            { type: 'item', label: 'Save', value: 'save', shortcut: 'Ctrl+S' },
          ],
        },
        {
          value: 'help',
          triggerLabel: 'Help',
          entries: [{ type: 'item', label: 'About', value: 'about' }],
        },
      ],
    });
    expect(output.match(/<MenubarMenu value="/g)).toHaveLength(2);
    expect(output).toContain('<MenubarTrigger>File</MenubarTrigger>');
    expect(output).toContain('<MenubarShortcut>Ctrl+S</MenubarShortcut>');
    expect(output).toContain('<MenubarItem>About</MenubarItem>');
    expect(output).not.toMatch(/Arquivo|Novo|Salvar/);
    // Nada liga estado: nem declaração, nem peça de marcação no import.
    expect(output).not.toContain('$state');
    expect(output).not.toContain('MenubarCheckboxItem');
  });

  it('a variante destrutiva e a divisória saem da lista, não de um literal ao lado', () => {
    const output = menubarEntriesSource({
      menus: [
        {
          value: 'file',
          triggerLabel: 'File',
          entries: [
            { type: 'item', label: 'Save', value: 'save' },
            { type: 'separator' },
            { type: 'item', label: 'Delete file', value: 'delete-file', variant: 'destructive' },
          ],
        },
      ],
    });
    expect(output).toContain('<MenubarSeparator />');
    expect(output).toContain('<MenubarItem variant="destructive">Delete file</MenubarItem>');
  });

  it('a marcação declara a variável que liga, com o estado da lista', () => {
    const output = menubarEntriesSource({
      menus: [
        {
          value: 'view',
          triggerLabel: 'View',
          entries: [
            {
              type: 'group',
              label: 'Panels',
              items: [
                { type: 'checkbox', label: 'Sidebar', value: 'sidebar', checked: true },
                { type: 'checkbox', label: 'Grid', value: 'grid', checked: false },
              ],
            },
          ],
        },
      ],
    });
    expect(output).toContain('let sidebar = $state(true);');
    expect(output).toContain('let grid = $state(false);');
    expect(output).toContain('<MenubarLabel>Panels</MenubarLabel>');
    expect(output).toContain('<MenubarCheckboxItem bind:checked={grid}>');
  });
});

// ─── Overrides por story ──────────────────────────────────────────────────────
//
// A tabela é a LISTA FECHADA dos builders de story deste módulo, e ela é
// cobrada nos dois sentidos logo abaixo: todo export terminado em `Source` tem
// caso aqui ou exceção declarada, e todo caso aqui produz um snippet sem
// andaime. É o que o `source-snippets.test.ts` do repositório ensinou por
// contraexemplo — contagem gerada a partir de uma lista encolhe em silêncio
// quando um nome sai dela.

const OVERRIDES: Array<{ name: string; build: () => string; contains: string[] }> = [
  {
    name: 'menubarDefaultSource',
    build: menubarDefaultSource,
    contains: ['<MenubarItem>Novo</MenubarItem>'],
  },
  {
    name: 'menubarDestructiveSource',
    build: menubarDestructiveSource,
    contains: ['<MenubarItem variant="destructive">Descartar alterações</MenubarItem>'],
  },
  {
    name: 'menubarItemDisabledSource',
    build: menubarItemDisabledSource,
    contains: ['<MenubarItem disabled>Enviar para revisão</MenubarItem>'],
  },
  {
    name: 'menubarCheckboxCheckedSource',
    build: menubarCheckboxCheckedSource,
    contains: ['<MenubarCheckboxItem bind:checked={regua}>Régua</MenubarCheckboxItem>'],
  },
  {
    name: 'menubarCheckboxIndeterminateSource',
    build: menubarCheckboxIndeterminateSource,
    contains: ['<MenubarCheckboxItem indeterminate>Colunas</MenubarCheckboxItem>'],
  },
  {
    name: 'menubarWithShortcutsSource',
    build: menubarWithShortcutsSource,
    contains: ['<MenubarShortcut>Ctrl+Z</MenubarShortcut>'],
  },
  {
    name: 'menubarWithSubmenuSource',
    build: menubarWithSubmenuSource,
    contains: ['<MenubarSubTrigger>Exportar</MenubarSubTrigger>'],
  },
  {
    name: 'menubarWithCheckboxSource',
    build: menubarWithCheckboxSource,
    contains: ['<MenubarLabel>Mostrar na tela</MenubarLabel>'],
  },
  {
    name: 'menubarWithRadioSource',
    build: menubarWithRadioSource,
    contains: ['<MenubarRadioGroup bind:value={tema}>'],
  },
  {
    name: 'menubarPanelScrollsSource',
    build: menubarPanelScrollsSource,
    // Nada declara rolagem: quem recorta e rola é a folha. O que o snippet
    // precisa ter é ALTURA — o primeiro e o último item da lista.
    contains: ['<MenubarItem>Ação 1</MenubarItem>', '<MenubarItem>Ação 60</MenubarItem>'],
  },
];

describe('os overrides de story escrevem a composição SEM o andaime da foto', () => {
  it.each(OVERRIDES)('$name', ({ build, contains }) => {
    const output = build();
    for (const snippet of contains) expect(output).toContain(snippet);
    // A barra que se abre sozinha é andaime do Chromatic, não lição: nenhum
    // override publica o `bind:value` da raiz nem o estado que o alimenta.
    expect(output).not.toContain('bind:value={menuAberto}');
    expect(output).not.toContain('let menuAberto');
  });
});

describe('menubarControlledSource — a barra comandada de fora', () => {
  // Este export ficava sem caso nenhum: `--only soltos` não o alcança, o teste
  // não o citava, e o painel de `States/ControlledOpen` era a única coisa que o
  // exercitava — no navegador, onde a saída do painel nem chega ao DOM.
  it('a ligação é de MÃO DUPLA, e o botão de fora entra no trecho', () => {
    const output = menubarControlledSource();
    expect(output).toContain('let menuAberto = $state("");');
    expect(output).toContain('<Menubar bind:value={menuAberto}>');
    // Sem o caminho de volta a barra abriria e nunca mais fecharia, nem por
    // Escape — armadilha de teclado (WCAG 2.1.2). O `bind:` é o caminho de
    // volta, e o botão externo é o assunto da story.
    expect(output).toContain('onclick={() => (menuAberto = "file")}');
    expect(output).toContain('Abrir Arquivo');
  });

  it('importa só as peças que usa', () => {
    const output = menubarControlledSource();
    expect(output).toContain('  MenubarItem,');
    expect(output).not.toContain('MenubarCheckboxItem');
    expect(output).not.toContain('MenubarSeparator');
  });
});

describe('cobertura — todo construtor deste módulo tem caso', () => {
  /**
   * Exceções DECLARADAS, com o motivo. Lista fechada de propósito: quem não
   * entra aqui e não tem caso reprova, que é o que dá dentes à convenção.
   */
  const WITHOUT_OWN_CASE = new Map<string, string>([
    [
      'menubarSource',
      'é a transform do META, e o bloco de cima já a exercita composição por composição',
    ],
    [
      'menubarEntriesSource',
      'é o construtor dos cards de Variantes da docs page, e tem bloco próprio abaixo',
    ],
  ]);

  it('nenhum export terminado em Source fica fora da tabela nem das exceções', async () => {
    const mod = await import('./menubar.source');
    const builders = Object.keys(mod).filter((key) => key.endsWith('Source'));
    // O filtro por sufixo é o mesmo que já encolheu em silêncio no
    // `source-snippets.test.ts` quando um nome mudou de forma: a contagem
    // abaixo é o que impede isso de se repetir aqui.
    expect(builders.length).toBeGreaterThan(0);

    const covered = new Set([
      ...OVERRIDES.map((o) => o.name),
      'menubarControlledSource',
      ...WITHOUT_OWN_CASE.keys(),
    ]);
    const undeclared = builders.filter((key) => !covered.has(key));
    expect(
      undeclared,
      'construtor de snippet sem caso e sem exceção declarada — cubra ou declare '
        + 'em WITHOUT_OWN_CASE, com o motivo',
    ).toEqual([]);
  });

  it('e nenhuma exceção declarada sobrevive ao export que ela justifica', async () => {
    const mod = await import('./menubar.source');
    for (const [name, reason] of WITHOUT_OWN_CASE) {
      expect(
        Object.keys(mod),
        `a exceção de ${name} (${reason}) perdeu a premissa: o export não existe mais`,
      ).toContain(name);
    }
  });
});
