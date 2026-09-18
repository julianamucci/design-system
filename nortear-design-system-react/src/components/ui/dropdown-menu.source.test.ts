import { describe, expect, it } from 'vitest';
import {
  dropdownMenuWithShortcutsSource,
  dropdownMenuWithCheckboxSource,
  dropdownMenuWithRadioSource,
  dropdownMenuWithLabelSource,
  dropdownMenuWithSubmenuSource,
  dropdownMenuControlledSource,
  dropdownMenuItemDisabledSource,
  dropdownMenuItemDestructiveSource,
  dropdownMenuItemDefaultSource,
  dropdownMenuCheckboxIndeterminateSource,
  dropdownMenuSnippet,
  dropdownMenuSource,
  type DropdownMenuActionEntry,
} from './dropdown-menu.source';

const ALL = [
  dropdownMenuSource,
  dropdownMenuItemDefaultSource,
  dropdownMenuItemDestructiveSource,
  dropdownMenuItemDisabledSource,
  dropdownMenuControlledSource,
  dropdownMenuWithLabelSource,
  dropdownMenuWithCheckboxSource,
  dropdownMenuWithRadioSource,
  dropdownMenuWithSubmenuSource,
  dropdownMenuWithShortcutsSource,
  dropdownMenuCheckboxIndeterminateSource,
  () => dropdownMenuSnippet(),
];

/** Todo rótulo tem que estar dentro de um grupo — ver a regra do primitivo. */
function groupLabelInside(output: string): boolean {
  if (!output.includes('<DropdownMenuLabel>')) return true;
  const abertura = Math.max(
    output.indexOf('<DropdownMenuGroup>'),
    output.indexOf('<DropdownMenuRadioGroup'),
  );
  return abertura !== -1 && abertura < output.indexOf('<DropdownMenuLabel>');
}

describe('dropdownMenuSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const output = dropdownMenuSource();
    expect(output).toContain('} from "@/components/ui/dropdown-menu";');
    expect(output).toContain('import { Button } from "@/components/ui/button";');
  });

  it('o gatilho entrega o próprio botão por asChild', () => {
    expect(dropdownMenuSource()).toContain('<DropdownMenuTrigger asChild>');
  });

  it('omite side e align quando são o padrão do Content', () => {
    const output = dropdownMenuSource(undefined, { args: { side: 'bottom', align: 'start' } });
    expect(output).toContain('<DropdownMenuContent>');
    expect(output).not.toContain('side=');
    expect(output).not.toContain('align=');
  });

  it('escreve side e align no CONTENT, que é onde eles moram', () => {
    const output = dropdownMenuSource(undefined, { args: { side: 'top', align: 'end' } });
    expect(output).toContain('<DropdownMenuContent side="top" align="end">');
    expect(output).toContain('<DropdownMenu>');
  });

  it('escreve modal e defaultOpen na RAIZ, e só quando diferem do padrão', () => {
    const atDefaults = dropdownMenuSource(undefined, { args: { modal: true, defaultOpen: false } });
    expect(atDefaults).toContain('<DropdownMenu>');

    const trocado = dropdownMenuSource(undefined, { args: { modal: false, defaultOpen: true } });
    expect(trocado).toContain('<DropdownMenu defaultOpen modal={false}>');
  });

  it('não deixa o espião de onOpenChange virar código', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const output = dropdownMenuSource(undefined, { args: { onOpenChange: spy } as never });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).not.toContain('onOpenChange');
  });
});

describe('variantes do item', () => {
  it('a forma mínima não repete o variant padrão', () => {
    const output = dropdownMenuItemDefaultSource();
    expect(output).toContain('<DropdownMenuItem>Perfil</DropdownMenuItem>');
    expect(output).not.toContain('variant="default"');
    // Nem grupo nem rótulo: é a forma mínima que a story mostra.
    expect(output).not.toContain('DropdownMenuGroup');
  });

  it('a destrutiva marca a ação irreversível ao lado de uma neutra', () => {
    const output = dropdownMenuItemDestructiveSource();
    expect(output).toContain('<DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>');
    expect(output).toContain('<DropdownMenuItem>Perfil</DropdownMenuItem>');
  });

  it('o item desabilitado leva disabled, e só ele', () => {
    const output = dropdownMenuItemDisabledSource();
    expect(output).toContain('<DropdownMenuItem disabled>Arquivar</DropdownMenuItem>');
    expect(output).toContain('<DropdownMenuItem>Editar</DropdownMenuItem>');
    // O bloqueio é do componente: nada de `aria-disabled` escrito à mão.
    expect(output).not.toContain('aria-disabled');
  });
});

describe('estados', () => {
  it('o modo controlado ensina o par open + onOpenChange com estado de verdade', () => {
    const output = dropdownMenuControlledSource();
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('const [aberto, setAberto] = useState(false);');
    expect(output).toContain('<DropdownMenu open={aberto} onOpenChange={setAberto}>');
  });
});

describe('composições', () => {
  it('o rótulo mora dentro do grupo em todos os snippets', () => {
    for (const fn of ALL) {
      expect(groupLabelInside(fn()), `${fn.name}: rótulo fora do grupo`).toBe(true);
    }
  });

  it('dois grupos rotulados, separados por um divisor', () => {
    const output = dropdownMenuWithLabelSource();
    expect(output.match(/<DropdownMenuGroup>/g)).toHaveLength(2);
    expect(output).toContain('<DropdownMenuSeparator />');
    expect(output).toContain('<DropdownMenuLabel>Suporte</DropdownMenuLabel>');
  });

  it('os alternadores são independentes: cada um com o seu estado', () => {
    const output = dropdownMenuWithCheckboxSource();
    expect(output).toContain('<DropdownMenuCheckboxItem checked={nome} onCheckedChange={setNome}>');
    expect(output).toContain('<DropdownMenuCheckboxItem checked={email} onCheckedChange={setEmail}>');
    expect(output).toContain('<DropdownMenuCheckboxItem checked={funcao} onCheckedChange={setFuncao}>');
    expect(output).toContain('const [nome, setNome] = useState(true);');
    expect(output).toContain('const [funcao, setFuncao] = useState(false);');
  });

  it('são TRÊS colunas, como na story e no vanilla, que é a referência', () => {
    // O painel Code acompanha o preview item a item: um snippet com duas
    // colunas ao lado de um menu com três ensina um menu que não existe.
    const output = dropdownMenuWithCheckboxSource();
    expect(output.match(/<DropdownMenuCheckboxItem /g)).toHaveLength(3);
    expect(output).toContain('Função');
  });

  it('na escolha única o valor mora no GRUPO, não em cada item', () => {
    const output = dropdownMenuWithRadioSource();
    expect(output).toContain('<DropdownMenuRadioGroup value={tema} onValueChange={setTema}>');
    expect(output).toContain('<DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>');
    expect(output).not.toContain('checked=');
  });

  it('a escolha única nasce em "Claro", que é o que a story mostra marcado', () => {
    // A deriva medida no vanilla foi esta: prévia marcando um item e snippet
    // marcando outro, sem portão ligando os dois.
    expect(dropdownMenuWithRadioSource()).toContain('const [tema, setTema] = useState("light");');
  });

  it('o submenu é o trio Sub / SubTrigger / SubContent', () => {
    const output = dropdownMenuWithSubmenuSource();
    expect(output).toContain('<DropdownMenuSub>');
    expect(output).toContain('<DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>');
    expect(output).toContain('<DropdownMenuSubContent>');
    // A seta indicadora vem do componente — acrescentar ícone aqui duplicaria.
    expect(output).not.toContain('ChevronRight');
  });

  it('o atalho fica dentro do item e não some para o leitor de tela', () => {
    const output = dropdownMenuWithShortcutsSource();
    expect(output).toContain('<DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>');
    const item = output.slice(output.indexOf('Copiar'));
    expect(item.indexOf('<DropdownMenuShortcut>')).toBeLessThan(
      item.indexOf('</DropdownMenuItem>'),
    );
    expect(output).not.toContain('aria-hidden');
  });
});

describe('estado misto', () => {
  it('os três estados lado a lado, e o misto pela prop do wrapper', () => {
    const output = dropdownMenuCheckboxIndeterminateSource();
    expect(output).toContain('<DropdownMenuCheckboxItem checked={false} indeterminate>');
    expect(output).toContain('<DropdownMenuCheckboxItem checked>Régua</DropdownMenuCheckboxItem>');
    expect(output).toContain('<DropdownMenuCheckboxItem checked={false}>Grade</DropdownMenuCheckboxItem>');
    // O `mixed` é o wrapper que escreve: ensinar o atributo à mão contornaria a prop.
    expect(output).not.toContain('aria-checked');
  });
});

describe('dropdownMenuSnippet — o menu como dado', () => {
  const rename: DropdownMenuActionEntry = { kind: 'item', label: 'Rename', value: 'rename' };

  it('imprime os rótulos exatamente como chegam, no idioma de quem lê', () => {
    // O defeito era o código em português ao lado da prévia em inglês.
    const output = dropdownMenuSnippet({
      triggerLabel: 'Edit',
      entries: [
        { kind: 'item', label: 'Undo', value: 'undo', shortcut: 'Ctrl+Z' },
        { kind: 'separator' },
        { kind: 'item', label: 'Delete account', value: 'delete-account', destructive: true },
      ],
    });
    expect(output).toContain('<Button variant="outline">Edit</Button>');
    expect(output).toContain('    <DropdownMenuItem>\n      Undo\n      <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>');
    expect(output).toContain('<DropdownMenuItem variant="destructive">Delete account</DropdownMenuItem>');
    expect(output).not.toMatch(/Editar|Desfazer|Excluir/);
    // Item de ação não tem `value`: o id estável é do evento, não do snippet.
    expect(output).not.toContain('value=');
  });

  it('a escolha única sai como UM grupo nomeado pelo rótulo, com o estado antes', () => {
    const output = dropdownMenuSnippet({
      triggerLabel: 'Theme',
      entries: [
        {
          kind: 'radio-group',
          label: 'Appearance',
          value: 'theme',
          selected: 'light',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ],
        },
      ],
    });
    expect(output).toContain(
      'function DropdownMenuWithState() {\n'
        + '  const [theme, setTheme] = useState("light");\n\n'
        + '  return (\n'
        + '    <DropdownMenu>',
    );
    expect(output).toContain(
      '<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>\n'
        + '          <DropdownMenuLabel>Appearance</DropdownMenuLabel>\n'
        + '          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>',
    );
    expect(output).not.toContain('DropdownMenuGroup');
  });

  it('a marcação nomeia o estado pelo id estável, e o rótulo mora no grupo', () => {
    const output = dropdownMenuSnippet({
      entries: [
        {
          kind: 'group',
          label: 'Visible columns',
          items: [{ kind: 'checkbox', label: 'Email', value: 'column-email', checked: false }],
        },
      ],
    });
    expect(output).toContain('const [columnEmail, setColumnEmail] = useState(false);');
    expect(output).toContain('<DropdownMenuCheckboxItem checked={columnEmail} onCheckedChange={setColumnEmail}>');
    expect(groupLabelInside(output)).toBe(true);
  });

  it('o trecho se cola: importa as peças que usa, e o useState só quando há estado', () => {
    const withoutState = dropdownMenuSnippet({
      entries: [rename, { kind: 'submenu', label: 'Export', items: [{ kind: 'item', label: 'PDF', value: 'pdf' }] }],
    });
    expect(withoutState.startsWith(
      'import {\n'
        + '  DropdownMenu,\n'
        + '  DropdownMenuContent,\n'
        + '  DropdownMenuItem,\n'
        + '  DropdownMenuSub,\n'
        + '  DropdownMenuSubContent,\n'
        + '  DropdownMenuSubTrigger,\n'
        + '  DropdownMenuTrigger,\n'
        + '} from "@/components/ui/dropdown-menu";\n'
        + 'import { Button } from "@/components/ui/button";\n\n'
        + '<DropdownMenu>',
    )).toBe(true);
    expect(withoutState).not.toContain('useState');
    expect(withoutState).not.toContain('DropdownMenuShortcut');
  });

  it('sem entradas, publica o menu canônico do meta', () => {
    const output = dropdownMenuSnippet();
    expect(output).toContain('<DropdownMenuLabel>Conta</DropdownMenuLabel>');
    expect(output).toContain('<DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>');
  });

  it('rótulo com chave ou sinal de tag vira string, e o trecho continua compilando', () => {
    const output = dropdownMenuSnippet({ entries: [{ kind: 'item', label: 'A <b> {x}', value: 'a' }] });
    expect(output).toContain('<DropdownMenuItem>{"A <b> {x}"}</DropdownMenuItem>');
  });
});

describe('guardas do painel', () => {
  it('nenhum snippet carrega o andaime do canvas da story', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
      expect(output).not.toContain('{...rootArgs}');
      expect(output).not.toContain('minHeight');
      expect(output).not.toContain('style={{');
    }
  });

  it('o `modal={false}` das capturas do Chromatic não vaza para os snippets', () => {
    for (const fn of ALL) {
      expect(fn()).not.toContain('modal={false}');
    }
  });
});
