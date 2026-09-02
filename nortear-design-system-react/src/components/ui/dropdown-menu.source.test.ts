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
  dropdownMenuSource,
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
];

/** Todo rótulo tem que estar dentro de um grupo — ver a regra do primitivo. */
function groupLabelInside(saida: string): boolean {
  if (!saida.includes('<DropdownMenuLabel>')) return true;
  const abertura = Math.max(
    saida.indexOf('<DropdownMenuGroup>'),
    saida.indexOf('<DropdownMenuRadioGroup'),
  );
  return abertura !== -1 && abertura < saida.indexOf('<DropdownMenuLabel>');
}

describe('dropdownMenuSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const saida = dropdownMenuSource();
    expect(saida).toContain('} from "@/components/ui/dropdown-menu";');
    expect(saida).toContain('import { Button } from "@/components/ui/button";');
  });

  it('o gatilho entrega o próprio botão por asChild', () => {
    expect(dropdownMenuSource()).toContain('<DropdownMenuTrigger asChild>');
  });

  it('omite side e align quando são o padrão do Content', () => {
    const saida = dropdownMenuSource(undefined, { args: { side: 'bottom', align: 'start' } });
    expect(saida).toContain('<DropdownMenuContent>');
    expect(saida).not.toContain('side=');
    expect(saida).not.toContain('align=');
  });

  it('escreve side e align no CONTENT, que é onde eles moram', () => {
    const saida = dropdownMenuSource(undefined, { args: { side: 'top', align: 'end' } });
    expect(saida).toContain('<DropdownMenuContent side="top" align="end">');
    expect(saida).toContain('<DropdownMenu>');
  });

  it('escreve modal e defaultOpen na RAIZ, e só quando diferem do padrão', () => {
    const atDefaults = dropdownMenuSource(undefined, { args: { modal: true, defaultOpen: false } });
    expect(atDefaults).toContain('<DropdownMenu>');

    const trocado = dropdownMenuSource(undefined, { args: { modal: false, defaultOpen: true } });
    expect(trocado).toContain('<DropdownMenu defaultOpen modal={false}>');
  });

  it('não deixa o espião de onOpenChange virar código', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = dropdownMenuSource(undefined, { args: { onOpenChange: spy } as never });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).not.toContain('onOpenChange');
  });
});

describe('variantes do item', () => {
  it('a forma mínima não repete o variant padrão', () => {
    const saida = dropdownMenuItemDefaultSource();
    expect(saida).toContain('<DropdownMenuItem>Perfil</DropdownMenuItem>');
    expect(saida).not.toContain('variant="default"');
    // Nem grupo nem rótulo: é a forma mínima que a story mostra.
    expect(saida).not.toContain('DropdownMenuGroup');
  });

  it('a destrutiva marca a ação irreversível ao lado de uma neutra', () => {
    const saida = dropdownMenuItemDestructiveSource();
    expect(saida).toContain('<DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>');
    expect(saida).toContain('<DropdownMenuItem>Perfil</DropdownMenuItem>');
  });

  it('o item desabilitado leva disabled, e só ele', () => {
    const saida = dropdownMenuItemDisabledSource();
    expect(saida).toContain('<DropdownMenuItem disabled>Arquivar</DropdownMenuItem>');
    expect(saida).toContain('<DropdownMenuItem>Editar</DropdownMenuItem>');
    // O bloqueio é do componente: nada de `aria-disabled` escrito à mão.
    expect(saida).not.toContain('aria-disabled');
  });
});

describe('estados', () => {
  it('o modo controlado ensina o par open + onOpenChange com estado de verdade', () => {
    const saida = dropdownMenuControlledSource();
    expect(saida).toContain('import { useState } from "react";');
    expect(saida).toContain('const [aberto, setAberto] = useState(false);');
    expect(saida).toContain('<DropdownMenu open={aberto} onOpenChange={setAberto}>');
  });
});

describe('composições', () => {
  it('o rótulo mora dentro do grupo em todos os snippets', () => {
    for (const fn of ALL) {
      expect(groupLabelInside(fn()), `${fn.name}: rótulo fora do grupo`).toBe(true);
    }
  });

  it('dois grupos rotulados, separados por um divisor', () => {
    const saida = dropdownMenuWithLabelSource();
    expect(saida.match(/<DropdownMenuGroup>/g)).toHaveLength(2);
    expect(saida).toContain('<DropdownMenuSeparator />');
    expect(saida).toContain('<DropdownMenuLabel>Suporte</DropdownMenuLabel>');
  });

  it('os alternadores são independentes: cada um com o seu estado', () => {
    const saida = dropdownMenuWithCheckboxSource();
    expect(saida).toContain('<DropdownMenuCheckboxItem checked={nome} onCheckedChange={setNome}>');
    expect(saida).toContain('<DropdownMenuCheckboxItem checked={email} onCheckedChange={setEmail}>');
    expect(saida).toContain('const [nome, setNome] = useState(true);');
  });

  it('na escolha única o valor mora no GRUPO, não em cada item', () => {
    const saida = dropdownMenuWithRadioSource();
    expect(saida).toContain('<DropdownMenuRadioGroup value={tema} onValueChange={setTema}>');
    expect(saida).toContain('<DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>');
    expect(saida).not.toContain('checked=');
  });

  it('o submenu é o trio Sub / SubTrigger / SubContent', () => {
    const saida = dropdownMenuWithSubmenuSource();
    expect(saida).toContain('<DropdownMenuSub>');
    expect(saida).toContain('<DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>');
    expect(saida).toContain('<DropdownMenuSubContent>');
    // A seta indicadora vem do componente — acrescentar ícone aqui duplicaria.
    expect(saida).not.toContain('ChevronRight');
  });

  it('o atalho fica dentro do item e não some para o leitor de tela', () => {
    const saida = dropdownMenuWithShortcutsSource();
    expect(saida).toContain('<DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>');
    const item = saida.slice(saida.indexOf('Copiar'));
    expect(item.indexOf('<DropdownMenuShortcut>')).toBeLessThan(
      item.indexOf('</DropdownMenuItem>'),
    );
    expect(saida).not.toContain('aria-hidden');
  });
});

describe('guardas do painel', () => {
  it('nenhum snippet carrega o andaime do canvas da story', () => {
    for (const fn of ALL) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
      expect(saida).not.toContain('{...rootArgs}');
      expect(saida).not.toContain('minHeight');
      expect(saida).not.toContain('style={{');
    }
  });

  it('o `modal={false}` das capturas do Chromatic não vaza para os snippets', () => {
    for (const fn of ALL) {
      expect(fn()).not.toContain('modal={false}');
    }
  });
});
