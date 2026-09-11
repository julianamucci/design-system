import { describe, expect, it } from 'vitest';
import {
  menubarCheckboxIndeterminateSource,
  menubarChoiceUnicaSource,
  menubarControlledSource,
  menubarEditorSource,
  menubarItemBloqueadoSource,
  menubarItemCheckedSource,
  menubarItemDestructiveSource,
  menubarItemNeutralSource,
  menubarOpenSource,
  menubarSnippet,
  menubarSource,
  menubarSubmenuSource,
  selectionMenubarBoxesSource,
  type MenubarActionEntry,
} from './menubar.source';

const ALL = [
  menubarSource,
  menubarItemNeutralSource,
  menubarItemDestructiveSource,
  menubarOpenSource,
  menubarItemBloqueadoSource,
  menubarItemCheckedSource,
  menubarSubmenuSource,
  selectionMenubarBoxesSource,
  menubarChoiceUnicaSource,
  menubarEditorSource,
  menubarControlledSource,
  menubarCheckboxIndeterminateSource,
  () => menubarSnippet(),
];

/**
 * Todo `MenubarLabel` tem que estar dentro de um grupo: nesta stack o rótulo é o
 * `Menu.GroupLabel` da base-ui, e sem um grupo ancestral ele LANÇA em tempo de
 * render — a barra inteira deixa de existir.
 */
function labelsInsideGroups(output: string): boolean {
  let depth = 0;
  for (const [tag] of output.matchAll(/<\/?Menubar(?:Group|RadioGroup)\b|<MenubarLabel\b/g)) {
    if (tag === '<MenubarLabel') {
      if (depth === 0) return false;
    } else if (tag.startsWith('</')) {
      depth -= 1;
    } else {
      depth += 1;
    }
  }
  return true;
}

describe('menubarSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const output = menubarSource();
    expect(output).toContain('} from "@/components/ui/menubar";');
    expect(output).not.toContain('@base-ui');
  });

  it('omite modal e loopFocus quando são o padrão do primitivo', () => {
    const output = menubarSource(undefined, { args: { modal: true, loopFocus: true } });
    expect(output).toContain('<Menubar>');
    expect(output).not.toContain('modal');
    expect(output).not.toContain('loopFocus');
  });

  it('escreve modal e loopFocus quando a story os desliga', () => {
    const output = menubarSource(undefined, { args: { modal: false, loopFocus: false } });
    expect(output).toContain('<Menubar modal={false} loopFocus={false}>');
  });

  it('não deixa o espião de onOpenChange virar código', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const output = menubarSource(undefined, { args: { onOpenChange: spy } as never });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).not.toContain('onOpenChange');
  });

  it('a barra é a lista de menus: a <Menubar> nunca recebe item direto', () => {
    const output = menubarSource();
    const withoutMenus = output.replace(/<MenubarMenu>[\s\S]*?<\/MenubarMenu>/g, '');
    expect(withoutMenus).not.toContain('<MenubarItem');
  });
});

describe('variantes e estados', () => {
  it('o item neutro não repete o variant padrão', () => {
    const output = menubarItemNeutralSource();
    expect(output).toContain('<MenubarItem>Novo</MenubarItem>');
    expect(output).not.toContain('variant=');
  });

  it('o destrutivo vem separado do neutro por um divisor', () => {
    const output = menubarItemDestructiveSource();
    expect(output).toContain('<MenubarItem variant="destructive">');
    expect(output.indexOf('<MenubarSeparator />')).toBeLessThan(output.indexOf('variant="destructive"'));
  });

  it('defaultOpen mora no MENU, não na barra', () => {
    const output = menubarOpenSource();
    expect(output).toContain('<MenubarMenu defaultOpen>');
    expect(output).not.toContain('<Menubar defaultOpen');
  });

  it('o bloqueio é o `disabled` do item, sem aria escrito à mão', () => {
    const output = menubarItemBloqueadoSource();
    expect(output).toContain('<MenubarItem disabled>');
    expect(output).not.toContain('aria-disabled');
  });

  it('o marcado usa defaultChecked, e o desmarcado é a AUSÊNCIA da prop', () => {
    const output = menubarItemCheckedSource();
    expect(output).toContain('<MenubarCheckboxItem defaultChecked>');
    expect(output).not.toContain('defaultChecked={false}');
  });

  it('o misto é a prop do wrapper, ao lado dos outros dois estados', () => {
    const output = menubarCheckboxIndeterminateSource();
    expect(output).toContain('<MenubarCheckboxItem checked={false} indeterminate>');
    expect(output).toContain('<MenubarCheckboxItem checked>Régua</MenubarCheckboxItem>');
    expect(output).toContain('<MenubarCheckboxItem checked={false}>Grade</MenubarCheckboxItem>');
    expect(output).not.toContain('aria-checked');
  });

  it('o controlado liga os DOIS lados do par open / onOpenChange', () => {
    const output = menubarControlledSource();
    expect(output).toContain('const [open, setOpen] = useState(false);');
    expect(output).toContain('<MenubarMenu open={open} onOpenChange={setOpen}>');
  });
});

describe('composições', () => {
  it('o rótulo mora dentro de um grupo em todos os snippets', () => {
    for (const fn of ALL) {
      expect(labelsInsideGroups(fn()), `${fn.name}: rótulo fora do grupo`).toBe(true);
    }
  });

  it('o submenu é o trio Sub / SubTrigger / SubContent, sem ícone à mão', () => {
    const output = menubarSubmenuSource();
    expect(output).toContain('<MenubarSub>');
    expect(output).toContain('<MenubarSubTrigger>Exportar</MenubarSubTrigger>');
    expect(output).toContain('<MenubarSubContent>');
    expect(output).not.toContain('ChevronRight');
  });

  it('na escolha única o valor mora no GRUPO', () => {
    const output = menubarChoiceUnicaSource();
    expect(output).toContain('<MenubarRadioGroup defaultValue="light">');
    expect(output).not.toContain('checked');
  });

  it('a barra do editor traz as quatro categorias clássicas', () => {
    const output = menubarEditorSource();
    for (const label of ['Arquivo', 'Editar', 'Exibir', 'Ajuda']) {
      expect(output).toContain(`<MenubarTrigger>${label}</MenubarTrigger>`);
    }
  });

  it('os alternadores são três linhas independentes', () => {
    expect(selectionMenubarBoxesSource().match(/<MenubarCheckboxItem/g)).toHaveLength(3);
  });
});

describe('menubarSnippet — a barra como dado', () => {
  const save: MenubarActionEntry = { kind: 'item', label: 'Save', value: 'save', shortcut: 'Ctrl+S' };

  it('imprime os rótulos exatamente como chegam, no idioma de quem lê', () => {
    // O defeito era o código em português ao lado da prévia em inglês.
    const output = menubarSnippet({
      menus: [
        {
          label: 'File',
          entries: [save, { kind: 'separator' }, { kind: 'item', label: 'Delete file', value: 'delete-file', destructive: true }],
        },
      ],
    });
    expect(output).toContain('<MenubarTrigger>File</MenubarTrigger>');
    expect(output).toContain('Save <MenubarShortcut>Ctrl+S</MenubarShortcut>');
    expect(output).toContain('<MenubarItem variant="destructive">Delete file</MenubarItem>');
    expect(output).not.toMatch(/Arquivo|Salvar|Excluir/);
    // Item de ação não tem `value`: o id estável é do evento, não do snippet.
    expect(output).not.toContain('value=');
  });

  it('um menu por gatilho, na ordem da lista, e só ele recebe itens', () => {
    const output = menubarSnippet({
      menus: [
        { label: 'File', entries: [save] },
        { label: 'Edit', entries: [{ kind: 'item', label: 'Copy', value: 'copy' }] },
      ],
    });
    expect(output.match(/<MenubarMenu>/g)).toHaveLength(2);
    expect(output.indexOf('File')).toBeLessThan(output.indexOf('Edit'));
  });

  it('o submenu aninha outro submenu quando a lista pede', () => {
    const output = menubarSnippet({
      menus: [
        {
          label: 'File',
          entries: [
            {
              kind: 'submenu',
              label: 'Export',
              items: [{ kind: 'submenu', label: 'Format', items: [{ kind: 'item', label: 'PDF', value: 'pdf' }] }],
            },
          ],
        },
      ],
    });
    expect(output.match(/<MenubarSub>/g)).toHaveLength(2);
    expect(output).toContain('<MenubarSubTrigger>Format</MenubarSubTrigger>');
  });

  it('marcação e escolha única ganham o estado num componente, antes da barra', () => {
    const output = menubarSnippet({
      menus: [
        {
          label: 'View',
          entries: [
            {
              kind: 'group',
              label: 'Appearance',
              items: [{ kind: 'checkbox', label: 'Show ruler', value: 'show-ruler', checked: true }],
            },
          ],
        },
        {
          label: 'Tools',
          entries: [
            {
              kind: 'radio-group',
              value: 'theme',
              selected: 'system-theme',
              options: [
                { label: 'Light theme', value: 'light-theme' },
                { label: 'System theme', value: 'system-theme' },
              ],
            },
          ],
        },
      ],
    });
    expect(output.startsWith('import { useState } from "react";\nimport {\n')).toBe(true);
    expect(output).toContain(
      'function MenubarWithState() {\n'
        + '  const [showRuler, setShowRuler] = useState(true);\n'
        + '  const [theme, setTheme] = useState("system-theme");\n\n'
        + '  return (\n'
        + '    <Menubar>',
    );
    expect(output).toContain('<MenubarCheckboxItem checked={showRuler} onCheckedChange={setShowRuler}>');
    expect(output).toContain('<MenubarRadioGroup value={theme} onValueChange={setTheme}>');
    // O grupo de escolha única sem rótulo não importa o rótulo à toa.
    expect(output.match(/<MenubarLabel>/g)).toHaveLength(1);
    expect(labelsInsideGroups(output)).toBe(true);
  });

  it('o import traz só as peças usadas, e o useState só quando há estado', () => {
    const output = menubarSnippet({ menus: [{ label: 'File', entries: [{ kind: 'item', label: 'New', value: 'new' }] }] });
    expect(output.startsWith(
      'import {\n'
        + '  Menubar,\n'
        + '  MenubarContent,\n'
        + '  MenubarItem,\n'
        + '  MenubarMenu,\n'
        + '  MenubarTrigger,\n'
        + '} from "@/components/ui/menubar";\n\n'
        + '<Menubar>',
    )).toBe(true);
    expect(output).not.toContain('useState');
    expect(output).not.toContain('MenubarShortcut');
  });

  it('sem menus, publica a barra canônica do meta', () => {
    const output = menubarSnippet();
    expect(output).toContain('<MenubarTrigger>Arquivo</MenubarTrigger>');
    expect(output).toContain('<MenubarTrigger>Editar</MenubarTrigger>');
  });
});

describe('guardas do painel', () => {
  it('nenhum snippet carrega o andaime do canvas da story', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
      expect(output).not.toContain('minHeight');
      expect(output).not.toContain('contain');
      expect(output).not.toContain('style={{');
    }
  });

  it('o `modal={false}` das capturas do Chromatic não vaza para os snippets', () => {
    for (const fn of ALL) {
      expect(fn()).not.toContain('modal={false}');
    }
  });
});
