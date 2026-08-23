import { describe, expect, it } from 'vitest';
import {
  resizableNestedSnippet,
  resizableSnippet,
  resizableSource,
  resizableSourceNested,
  resizableSourceWith,
} from './resizable.source';

describe('resizableSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do grupo', () => {
    const code = resizableSnippet();
    expect(code).toContain("import { createResizablePanel } from '@/components/ui/resizable';");
    expect(code).toContain('createResizablePanel({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="separator"');
  });

  it('usa o nome acessível canônico, nunca o apelido', () => {
    const code = resizableSnippet({ 'aria-label': 'Redimensionar Sidebar e Conteúdo' });
    expect(code).toContain("'aria-label': 'Redimensionar Sidebar e Conteúdo'");
    expect(code).not.toContain('ariaLabel');
  });

  it('nomeia um divisor por vez quando o grupo tem mais de um', () => {
    // Dois separadores com o mesmo nome são dois controles indistinguíveis na
    // lista do leitor de tela.
    const code = resizableSnippet({
      'aria-label': ['Redimensionar a coluna Navegação', 'Redimensionar a coluna Metadados'],
      panels: [
        { title: 'Navegação', defaultSize: 20, minSize: 12 },
        { title: 'Conteúdo', defaultSize: 55, minSize: 30 },
        { title: 'Metadados', defaultSize: 25, minSize: 15 },
      ],
    });
    expect(code).toContain("'Redimensionar a coluna Navegação',");
    expect(code).toContain("'Redimensionar a coluna Metadados',");
    expect(code.match(/bloco\('/g)).toHaveLength(3);
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = resizableSnippet();
    // `horizontal`, sem pegador, sem trava e sem callback de layout.
    expect(code).not.toContain('direction:');
    expect(code).not.toContain('withHandle');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('onLayout');
    expect(code).not.toContain('destroy()');
  });

  it('omite o piso e o teto que a fábrica já assume', () => {
    const code = resizableSnippet({
      panels: [
        { title: 'A', defaultSize: 50, minSize: 10, maxSize: 100 },
        { title: 'B', defaultSize: 50, minSize: 10 },
      ],
    });
    expect(code).not.toContain('minSize');
    expect(code).not.toContain('maxSize');
  });

  it('mostra as opções quando a story as usa', () => {
    const code = resizableSnippet({
      direction: 'vertical',
      withHandle: true,
      disabled: true,
      onLayout: '(sizes) => guardarLayout(sizes)',
      panels: [
        { title: 'Painel A', defaultSize: 50, minSize: 30, maxSize: 60 },
        { title: 'Painel B', defaultSize: 50, minSize: 30 },
      ],
    });
    expect(code).toContain("direction: 'vertical'");
    expect(code).toContain('withHandle: true');
    expect(code).toContain('disabled: true');
    expect(code).toContain('onLayout: (sizes) => guardarLayout(sizes)');
    expect(code).toContain('minSize: 30');
    expect(code).toContain('maxSize: 60');
  });

  it('os três números dos controls viram os dois painéis do exemplo', () => {
    const code = resizableSnippet({ defaultSize: 40, minSize: 20, maxSize: 60 });
    expect(code).toContain('defaultSize: 40');
    expect(code).toContain('defaultSize: 60');
    expect(code).toContain('minSize: 20');
    expect(code).toContain('maxSize: 60');
  });

  it('mostra a limpeza só quando ela é o assunto', () => {
    expect(resizableSnippet({ destroy: true })).toContain('grupo.destroy();');
  });

  it('não vaza o andaime das stories', () => {
    const code = resizableSnippet();
    expect(code).not.toContain('panelContent(');
    expect(code).not.toContain('frame(');
    expect(code).not.toContain('listBlock(');
    expect(code).not.toContain('fracaoDoPrimeiro');
  });
});

describe('resizableAninhadoSnippet', () => {
  it('monta dois grupos, cada um com o nome do próprio divisor', () => {
    const code = resizableNestedSnippet({
      interno: {
        direction: 'vertical',
        'aria-label': 'Redimensionar Editor e Console',
        panels: [
          { title: 'Editor', defaultSize: 60, minSize: 20 },
          { title: 'Console', defaultSize: 40, minSize: 20 },
        ],
      },
      externo: {
        'aria-label': 'Redimensionar Sidebar e área principal',
        panels: [
          { title: 'Sidebar', defaultSize: 30, minSize: 15 },
          { title: 'Área principal', defaultSize: 70, minSize: 30 },
        ],
      },
      neighbour: { title: 'Sidebar', defaultSize: 30, minSize: 15 },
    });
    expect(code.match(/createResizablePanel\(\{/g)).toHaveLength(2);
    expect(code).toContain("'aria-label': 'Redimensionar Editor e Console'");
    expect(code).toContain("'aria-label': 'Redimensionar Sidebar e área principal'");
    // O grupo de dentro entra no de fora como conteúdo de um painel.
    expect(code).toContain('content: interno');
  });
});

describe('resizableSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = resizableSource('<div data-slot="resizable">', {});
    const withArgs = resizableSource('<div data-slot="resizable">', {
      args: { direction: 'vertical', withHandle: true },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("direction: 'vertical'");
    expect(withArgs).toContain('withHandle: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(resizableSource('<div data-direction="horizontal" data-slot="resizable">', {})).not.toContain(
      'data-direction',
    );
  });
});

describe('resizableSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = resizableSourceWith({ direction: 'vertical' });
    const code = transform('', { args: { direction: 'horizontal' } });
    expect(code).toContain("direction: 'vertical'");
  });
});

describe('resizableSourceAninhado', () => {
  it('entrega a forma aninhada, ignorando os args', () => {
    const transform = resizableSourceNested({
      interno: { direction: 'vertical', 'aria-label': 'Interno' },
      externo: { 'aria-label': 'Externo' },
      neighbour: { title: 'Sidebar', defaultSize: 30 },
    });
    const code = transform('', { args: { direction: 'horizontal' } });
    expect(code).toContain('content: interno');
    expect(code.match(/createResizablePanel\(\{/g)).toHaveLength(2);
  });
});
