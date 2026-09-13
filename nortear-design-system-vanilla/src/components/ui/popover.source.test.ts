import { describe, expect, it } from 'vitest';
import {
  popoverWithActionsSnippet,
  popoverWithFormSnippet,
  popoverControlledSnippet,
  popoverSnippet,
  popoverSource,
  popoverSourceActions,
  popoverSourceWith,
  popoverSourceForm,
} from './popover.source';

describe('popoverControladoSnippet', () => {
  it('abre por `open()`, e não encenando um clique no gatilho', () => {
    // `gatilho.click()` ALTERNA: um botão que promete abrir fecharia o painel na
    // segunda vez, e o verbo público some da leitura de quem copia.
    const code = popoverControlledSnippet();
    expect(code).toContain('painel.open()');
    expect(code).not.toMatch(/\.click\(\)/);
  });

  it('o gatilho FICA à vista: ele é a âncora do painel', () => {
    const code = popoverControlledSnippet();
    expect(code).toContain('const gatilho = createButton(');
    expect(code).toContain('trigger: gatilho');
    expect(code).not.toContain('nds-sr-only');
    expect(code).not.toContain('aria-hidden');
  });

  it('e devolve o estado por `onOpenChange`, que é o assunto da story', () => {
    expect(popoverControlledSnippet()).toContain('onOpenChange:');
  });
});

describe('popoverSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do painel', () => {
    const code = popoverSnippet();
    expect(code).toContain("from '@/components/ui/popover';");
    expect(code).toContain('createPopover({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="dialog"');
  });

  it('nomeia o painel pelas sub-fábricas de cabeçalho, não por atributo escrito à mão', () => {
    // O nome acessível do painel sai do título: a fábrica procura um cabeçalho
    // dentro do conteúdo antes de cair no texto do gatilho.
    const code = popoverSnippet();
    expect(code).toContain('createPopoverHeader()');
    expect(code).toContain('createPopoverTitle({');
    expect(code).toContain('createPopoverDescription({');
    expect(code).not.toContain('ariaLabel');
    expect(code).not.toContain("setAttribute('aria-label'");
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = popoverSnippet();
    expect(code).not.toContain('side:');
    expect(code).not.toContain('align:');
    expect(code).not.toContain('sideOffset');
    expect(code).not.toContain('defaultOpen');
    expect(code).not.toContain('onOpenChange');
    expect(code).not.toContain('level:');
    expect(code).not.toContain('destroy()');
  });

  it('mostra as opções quando a story as usa', () => {
    const code = popoverSnippet({
      side: 'top',
      align: 'start',
      sideOffset: 16,
      defaultOpen: true,
      onOpenChange: '(aberto) => mostrarEstado(aberto)',
    });
    expect(code).toContain("side: 'top'");
    expect(code).toContain("align: 'start'");
    expect(code).toContain('sideOffset: 16');
    expect(code).toContain('defaultOpen: true');
    expect(code).toContain('onOpenChange: (aberto) => mostrarEstado(aberto)');
  });

  it('um callback que não é string cai na expressão padrão, sem imprimir a função', () => {
    const code = popoverSnippet({ onOpenChange: () => {} });
    expect(code).toContain('onOpenChange: (aberto) => registrar(aberto)');
  });

  it('conteúdo de texto puro dispensa as sub-fábricas de cabeçalho', () => {
    const code = popoverSnippet({ text: 'Use Ctrl+K para abrir a busca.' });
    expect(code).toContain("content: 'Use Ctrl+K para abrir a busca.'");
    expect(code).not.toContain('createPopoverHeader');
    expect(code).not.toContain('createPopoverTitle');
  });

  it('mostra a limpeza só quando ela é o assunto', () => {
    expect(popoverSnippet({ destroy: true })).toContain('painel.destroy();');
  });

  it('não vaza o andaime das stories', () => {
    const code = popoverSnippet();
    expect(code).not.toContain('buildContent');
    expect(code).not.toContain('buildSimpleContent');
    expect(code).not.toContain('wrap(');
  });
});

describe('popoverComFormularioSnippet', () => {
  it('compõe o painel com as fábricas do design system', () => {
    const code = popoverWithFormSnippet();
    expect(code).toContain('createLabel({');
    expect(code).toContain('createInput({');
    expect(code).toContain("type: 'submit'");
    expect(code).toContain('content: formulario');
    expect(code).not.toContain('data-slot=');
  });

  it('e o envio do formulário FECHA o painel por código', () => {
    // "Salvou e fechou" é o motivo `api`. Até 2026-09-13 o snippet ensinava um
    // submit que só chamava `preventDefault()`: o painel ficava aberto depois de
    // confirmar, e o exemplo canônico publicava um botão que não conclui nada.
    const code = popoverWithFormSnippet();
    expect(code).toContain("formulario.addEventListener('submit'");
    expect(code).toContain('painel.close()');
    // O formulário não tem peça de fechar — se tivesse a marca aqui, o motivo
    // viraria `close-button` e "concluiu" chegaria ao relatório como "desistiu".
    //
    // A busca é por ATRIBUIÇÃO no começo da linha, não por substring: o próprio
    // snippet EXPLICA a marca num comentário, e um `toContain` cru reprovava na
    // prosa que ensina a regra em vez de na violação dela.
    expect(code).not.toMatch(/^\s*\w+\.dataset\.slot = 'popover-close'/m);
  });
});

describe('popoverComAcoesSnippet', () => {
  it('mostra os dois botões que a política de foco alcança', () => {
    const code = popoverWithActionsSnippet({ title: 'Confirmar alteração' });
    expect(code).toContain("label: 'Cancelar'");
    expect(code).toContain("label: 'Confirmar'");
    expect(code).toContain("createPopoverTitle({ text: 'Confirmar alteração' })");
  });

  it('e ensina o Cancelar que FECHA, não um botão inerte', () => {
    // O snippet é o que o leitor copia: até 2026-09-12 ele publicava um
    // `createButton` sem ouvinte nenhum, e o painel não fechava por ele.
    const code = popoverWithActionsSnippet();
    expect(code).toContain("cancelar.dataset.slot = 'popover-close'");
    expect(code).toContain('acoes.append(cancelar,');
  });

  it('e o Confirmar que fecha por CÓDIGO, não uma segunda peça de fechar', () => {
    // Os dois caminhos são o assunto: `close-button` é quem desistiu, `api` é
    // quem concluiu. Marcar o Confirmar apagaria a diferença no relatório, e é
    // o defeito que este caso guarda.
    const code = popoverWithActionsSnippet();
    expect(code).toContain("confirmar.addEventListener('click'");
    expect(code).toContain('painel.close()');
    expect(code).not.toContain('confirmar.dataset.slot');
    // Uma marca só no snippet inteiro, e ela é a do Cancelar. Casa a ATRIBUIÇÃO
    // no começo da linha: o comentário que explica a regra também cita o valor,
    // e um casamento solto contaria prosa.
    expect(code.match(/^\s*\w+\.dataset\.slot = 'popover-close'/gm)).toHaveLength(1);
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
    const code = transform('', { args: { side: 'bottom' } });
    expect(code).toContain("side: 'top'");
  });
});

describe('as transforms das formas alternativas', () => {
  it('entregam a forma que a story pede', () => {
    expect(popoverSourceForm()('', {})).toContain('createInput({');
    expect(popoverSourceActions()('', {})).toContain("label: 'Cancelar'");
  });
});
