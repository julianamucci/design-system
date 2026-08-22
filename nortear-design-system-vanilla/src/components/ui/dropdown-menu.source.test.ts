import { describe, expect, it } from 'vitest';
import {
  dropdownMenuSnippet,
  dropdownMenuSource,
  dropdownMenuSourceWith,
} from './dropdown-menu.source';

describe('dropdownMenuSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = dropdownMenuSnippet();
    expect(código).toContain(
      "import { createDropdownMenu } from '@/components/ui/dropdown-menu';",
    );
    expect(código).toContain('createDropdownMenu({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="menu"');
    expect(código).not.toContain('aria-haspopup');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = dropdownMenuSnippet();
    // bottom/start/4/modal são os padrões, e documentação não ensina a repetir
    // o valor que a fábrica já assume.
    expect(código).not.toContain('side:');
    expect(código).not.toContain('align:');
    expect(código).not.toContain('sideOffset');
    expect(código).not.toContain('modal');
    expect(código).not.toContain('defaultOpen');
    expect(código).not.toContain('onOpenChange');
    // `item` é o tipo padrão do item, e `default` a ênfase padrão.
    expect(código).not.toContain("type: 'item'");
    expect(código).not.toContain("variant: 'default'");
  });

  it('mostra lado, encosto e vão quando eles saem do padrão', () => {
    const código = dropdownMenuSnippet({ side: 'top', align: 'end', sideOffset: 12, modal: false });
    expect(código).toContain("side: 'top'");
    expect(código).toContain("align: 'end'");
    expect(código).toContain('sideOffset: 12');
    expect(código).toContain('modal: false');
    // O vão padrão continua fora quando ninguém o muda.
    expect(dropdownMenuSnippet({ sideOffset: 4 })).not.toContain('sideOffset');
  });

  it('a lista é dado: cada tipo de item aparece com a chave que o define', () => {
    const código = dropdownMenuSnippet({
      items: [
        { type: 'label', label: 'Colunas visíveis' },
        { type: 'checkbox', label: 'Nome', value: 'nome', indeterminate: true },
        { type: 'radio', label: 'Claro', value: 'light', group: 'tema', checked: true },
        { type: 'separator' },
        { label: 'Excluir conta', value: 'delete', variant: 'destructive' },
        { label: 'Copiar', value: 'copy', shortcut: 'Ctrl C' },
        { label: 'Arquivar', value: 'archive', disabled: true },
      ],
    });
    expect(código).toContain("{ type: 'label', label: 'Colunas visíveis' }");
    expect(código).toContain(
      "{ type: 'checkbox', label: 'Nome', value: 'nome', indeterminate: true }",
    );
    expect(código).toContain(
      "{ type: 'radio', label: 'Claro', value: 'light', group: 'tema', checked: true }",
    );
    expect(código).toContain("{ type: 'separator' }");
    expect(código).toContain("variant: 'destructive'");
    expect(código).toContain("shortcut: 'Ctrl C'");
    expect(código).toContain('disabled: true');
  });

  it('o item de ação simples não repete o tipo padrão', () => {
    expect(dropdownMenuSnippet({ items: [{ label: 'Perfil', value: 'profile' }] })).toContain(
      "{ label: 'Perfil', value: 'profile' }",
    );
  });

  it('não vaza helper de story', () => {
    const código = dropdownMenuSnippet();
    expect(código).not.toContain('buildMenuEl');
    expect(código).not.toContain('buildBase');
    expect(código).not.toContain('montar(');
    expect(código).not.toContain('wrap(');
  });

  it('ignora um callback que não seja escrito como texto', () => {
    const código = dropdownMenuSnippet({ onOpenChange: (() => {}) as unknown as string });
    expect(código).not.toContain('onOpenChange');
  });
});

describe('dropdownMenuSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = dropdownMenuSource('<ul role="menu">', {});
    const withArgs = dropdownMenuSource('<ul role="menu">', {
      args: { side: 'top', align: 'end', triggerLabel: 'Abrir para cima' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("side: 'top'");
    expect(withArgs).toContain("align: 'end'");
    expect(withArgs).toContain("label: 'Abrir para cima'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(dropdownMenuSource('<ul role="menu" data-side="bottom">', {})).not.toContain(
      'data-side=',
    );
  });
});

describe('dropdownMenuSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = dropdownMenuSourceWith({
      side: 'top',
      items: [{ label: 'Renomear', value: 'rename' }],
    });
    const código = transform('', { args: { side: 'bottom', triggerLabel: 'Abrir menu' } });
    expect(código).toContain("side: 'top'");
    expect(código).toContain("{ label: 'Renomear', value: 'rename' }");
    expect(código).not.toContain("label: 'Perfil'");
  });
});
