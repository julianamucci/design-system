import { describe, expect, it } from 'vitest';
import {
  dropdownMenuSnippet,
  dropdownMenuSource,
  dropdownMenuSourceWith,
} from './dropdown-menu.source';

describe('dropdownMenuSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = dropdownMenuSnippet();
    expect(code).toContain(
      "import { createDropdownMenu } from '@/components/ui/dropdown-menu';",
    );
    expect(code).toContain('createDropdownMenu({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="menu"');
    expect(code).not.toContain('aria-haspopup');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = dropdownMenuSnippet();
    // bottom/start/4/modal são os padrões, e documentação não ensina a repetir
    // o valor que a fábrica já assume.
    expect(code).not.toContain('side:');
    expect(code).not.toContain('align:');
    expect(code).not.toContain('sideOffset');
    expect(code).not.toContain('modal');
    expect(code).not.toContain('defaultOpen');
    expect(code).not.toContain('onOpenChange');
    // `item` é o tipo padrão do item, e `default` a ênfase padrão.
    expect(code).not.toContain("type: 'item'");
    expect(code).not.toContain("variant: 'default'");
  });

  it('mostra lado, encosto e vão quando eles saem do padrão', () => {
    const code = dropdownMenuSnippet({ side: 'top', align: 'end', sideOffset: 12, modal: false });
    expect(code).toContain("side: 'top'");
    expect(code).toContain("align: 'end'");
    expect(code).toContain('sideOffset: 12');
    expect(code).toContain('modal: false');
    // O vão padrão continua fora quando ninguém o muda.
    expect(dropdownMenuSnippet({ sideOffset: 4 })).not.toContain('sideOffset');
  });

  it('a lista é dado: cada tipo de item aparece com a chave que o define', () => {
    const code = dropdownMenuSnippet({
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
    expect(code).toContain("{ type: 'label', label: 'Colunas visíveis' }");
    expect(code).toContain(
      "{ type: 'checkbox', label: 'Nome', value: 'nome', indeterminate: true }",
    );
    expect(code).toContain(
      "{ type: 'radio', label: 'Claro', value: 'light', group: 'tema', checked: true }",
    );
    expect(code).toContain("{ type: 'separator' }");
    expect(code).toContain("variant: 'destructive'");
    expect(code).toContain("shortcut: 'Ctrl C'");
    expect(code).toContain('disabled: true');
  });

  it('o item de ação simples não repete o tipo padrão', () => {
    expect(dropdownMenuSnippet({ items: [{ label: 'Perfil', value: 'profile' }] })).toContain(
      "{ label: 'Perfil', value: 'profile' }",
    );
  });

  it('não vaza helper de story', () => {
    const code = dropdownMenuSnippet();
    expect(code).not.toContain('buildMenuEl');
    expect(code).not.toContain('buildBase');
    expect(code).not.toContain('montar(');
    expect(code).not.toContain('wrap(');
  });

  it('ignora um callback que não seja escrito como texto', () => {
    const code = dropdownMenuSnippet({ onOpenChange: (() => {}) as unknown as string });
    expect(code).not.toContain('onOpenChange');
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
    const code = transform('', { args: { side: 'bottom', triggerLabel: 'Abrir menu' } });
    expect(code).toContain("side: 'top'");
    expect(code).toContain("{ label: 'Renomear', value: 'rename' }");
    expect(code).not.toContain("label: 'Perfil'");
  });
});
