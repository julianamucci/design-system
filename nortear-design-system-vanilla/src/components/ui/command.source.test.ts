import { describe, expect, it } from 'vitest';
import {
  commandEmDialogSnippet,
  commandEmPopoverSnippet,
  commandSnippet,
  commandSource,
  commandSourceWith,
} from './command.source';

describe('commandSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = commandSnippet();
    expect(código).toContain("import { createCommand } from '@/components/ui/command';");
    expect(código).toContain('createCommand({');
    expect(código).toContain("document.querySelector('#app')?.append(paleta);");
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="listbox"');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = commandSnippet();
    expect(código).not.toContain('placeholder');
    expect(código).not.toContain('emptyMessage');
    expect(código).not.toContain('onSelect');
  });

  it('mostra os textos quando a story os troca', () => {
    const código = commandSnippet({
      placeholder: 'Buscar componente...',
      emptyMessage: 'Nenhum resultado encontrado.',
    });
    expect(código).toContain("placeholder: 'Buscar componente...'");
    expect(código).toContain("emptyMessage: 'Nenhum resultado encontrado.'");
  });

  it('agrupa os itens por padrão e desagrupa quando o control pede', () => {
    expect(commandSnippet()).toContain("group: 'Componentes'");
    expect(commandSnippet({ showGroups: false })).not.toContain('group:');
  });

  it('mostra as chaves de item que a story exercita', () => {
    const código = commandSnippet({
      items: [
        { value: 'novo', label: 'Novo arquivo', shortcut: '⌘N' },
        { type: 'separator' },
        { value: 'claro', label: 'Claro', checked: true },
        { value: 'arquivar', label: 'Arquivar', disabled: true },
      ],
    });
    expect(código).toContain("shortcut: '⌘N'");
    expect(código).toContain("{ type: 'separator' }");
    expect(código).toContain('checked: true');
    expect(código).toContain('disabled: true');
  });

  it('não vaza o andaime das stories', () => {
    const código = commandSnippet();
    expect(código).not.toContain('montarInline');
    expect(código).not.toContain('buildItems');
    expect(código).not.toContain('ITENS_AGRUPADOS');
    expect(código).not.toContain('WRAPPER');
  });

  it('nunca imprime a função que os args trazem no lugar do corpo do callback', () => {
    const código = commandSnippet({ onSelect: (() => undefined) as unknown as string });
    expect(código).not.toContain('onSelect');
  });
});

describe('commandEmPopoverSnippet', () => {
  it('mostra a sub-fábrica que é o assunto da composição', () => {
    const código = commandEmPopoverSnippet();
    expect(código).toContain("import { createPopover } from '@/components/ui/popover';");
    expect(código).toContain('createPopover({');
    expect(código).toContain('trigger: gatilho');
    expect(código).toContain('content: paleta');
    // O papel é de quem compõe: sem ele o leitor anuncia só "botão".
    expect(código).toContain("gatilho.setAttribute('role', 'combobox');");
  });
});

describe('commandEmDialogSnippet', () => {
  it('mostra o diálogo e o atalho global, que é de quem consome', () => {
    const código = commandEmDialogSnippet();
    expect(código).toContain("import { createDialog } from '@/components/ui/dialog';");
    expect(código).toContain('headerHidden: true');
    expect(código).toContain('showCloseButton: false');
    expect(código).toContain("window.addEventListener('keydown'");
    expect(código).not.toContain('dialog.fixtures');
  });
});

describe('commandSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = commandSource('<div data-slot="command">', {});
    const withArgs = commandSource('<div data-slot="command">', {
      args: { placeholder: 'Buscar comando...', showGroups: false },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("placeholder: 'Buscar comando...'");
    expect(withArgs).not.toContain('group:');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(commandSource('<div data-slot="command" class="nds-command">', {})).not.toContain(
      'class="nds-command"',
    );
  });
});

describe('commandSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = commandSourceWith({
      items: [{ value: 'sair', label: 'Sair' }],
    });
    const código = transform('', { args: { placeholder: 'Buscar comando...' } });
    expect(código).toContain("placeholder: 'Buscar comando...'");
    expect(código).toContain("{ value: 'sair', label: 'Sair' }");
    expect(código).not.toContain("label: 'Button'");
  });
});
