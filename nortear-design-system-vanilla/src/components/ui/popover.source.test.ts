import { describe, expect, it } from 'vitest';
import {
  popoverWithActionsSnippet,
  popoverWithFormSnippet,
  popoverSnippet,
  popoverSource,
  popoverSourceActions,
  popoverSourceWith,
  popoverSourceForm,
} from './popover.source';

describe('popoverSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do painel', () => {
    const código = popoverSnippet();
    expect(código).toContain("from '@/components/ui/popover';");
    expect(código).toContain('createPopover({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="dialog"');
  });

  it('nomeia o painel pelas sub-fábricas de cabeçalho, não por atributo escrito à mão', () => {
    // O nome acessível do painel sai do título: a fábrica procura um cabeçalho
    // dentro do conteúdo antes de cair no texto do gatilho.
    const código = popoverSnippet();
    expect(código).toContain('createPopoverHeader()');
    expect(código).toContain('createPopoverTitle({');
    expect(código).toContain('createPopoverDescription({');
    expect(código).not.toContain('ariaLabel');
    expect(código).not.toContain("setAttribute('aria-label'");
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = popoverSnippet();
    expect(código).not.toContain('side:');
    expect(código).not.toContain('align:');
    expect(código).not.toContain('sideOffset');
    expect(código).not.toContain('defaultOpen');
    expect(código).not.toContain('onOpenChange');
    expect(código).not.toContain('level:');
    expect(código).not.toContain('destroy()');
  });

  it('mostra as opções quando a story as usa', () => {
    const código = popoverSnippet({
      side: 'top',
      align: 'start',
      sideOffset: 16,
      defaultOpen: true,
      onOpenChange: '(aberto) => mostrarEstado(aberto)',
    });
    expect(código).toContain("side: 'top'");
    expect(código).toContain("align: 'start'");
    expect(código).toContain('sideOffset: 16');
    expect(código).toContain('defaultOpen: true');
    expect(código).toContain('onOpenChange: (aberto) => mostrarEstado(aberto)');
  });

  it('um callback que não é string cai na expressão padrão, sem imprimir a função', () => {
    const código = popoverSnippet({ onOpenChange: () => {} });
    expect(código).toContain('onOpenChange: (aberto) => registrar(aberto)');
  });

  it('conteúdo de texto puro dispensa as sub-fábricas de cabeçalho', () => {
    const código = popoverSnippet({ text: 'Use Ctrl + K para abrir a busca.' });
    expect(código).toContain("content: 'Use Ctrl + K para abrir a busca.'");
    expect(código).not.toContain('createPopoverHeader');
    expect(código).not.toContain('createPopoverTitle');
  });

  it('mostra a limpeza só quando ela é o assunto', () => {
    expect(popoverSnippet({ destroy: true })).toContain('painel.destroy();');
  });

  it('não vaza o andaime das stories', () => {
    const código = popoverSnippet();
    expect(código).not.toContain('buildContent');
    expect(código).not.toContain('buildSimpleContent');
    expect(código).not.toContain('wrap(');
  });
});

describe('popoverComFormularioSnippet', () => {
  it('compõe o painel com as fábricas do design system', () => {
    const código = popoverWithFormSnippet();
    expect(código).toContain('createLabel({');
    expect(código).toContain('createInput({');
    expect(código).toContain("type: 'submit'");
    expect(código).toContain('content: formulario');
    expect(código).not.toContain('data-slot=');
  });
});

describe('popoverComAcoesSnippet', () => {
  it('mostra os dois botões que a política de foco alcança', () => {
    const código = popoverWithActionsSnippet({ title: 'Confirmar alteração' });
    expect(código).toContain("label: 'Cancelar'");
    expect(código).toContain("label: 'Confirmar'");
    expect(código).toContain("createPopoverTitle({ text: 'Confirmar alteração' })");
  });
});

describe('popoverSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = popoverSource('<div data-slot="popover-content">', {});
    const withArgs = popoverSource('<div data-slot="popover-content">', {
      args: { side: 'right', triggerLabel: 'Abrir filtros' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("side: 'right'");
    expect(withArgs).toContain("label: 'Abrir filtros'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(popoverSource('<div data-slot="popover" style="display: contents">', {})).not.toContain(
      'display: contents',
    );
  });
});

describe('popoverSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = popoverSourceWith({ side: 'top' });
    const código = transform('', { args: { side: 'bottom' } });
    expect(código).toContain("side: 'top'");
  });
});

describe('as transforms das formas alternativas', () => {
  it('entregam a forma que a story pede', () => {
    expect(popoverSourceForm()('', {})).toContain('createInput({');
    expect(popoverSourceActions()('', {})).toContain("label: 'Cancelar'");
  });
});
