import { describe, expect, it } from 'vitest';
import {
  resizableAninhadoSnippet,
  resizableSnippet,
  resizableSource,
  resizableSourceAninhado,
  resizableSourceCom,
} from './resizable.source';

describe('resizableSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do grupo', () => {
    const código = resizableSnippet();
    expect(código).toContain("import { createResizablePanel } from '@/components/ui/resizable';");
    expect(código).toContain('createResizablePanel({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="separator"');
  });

  it('usa o nome acessível canônico, nunca o apelido', () => {
    const código = resizableSnippet({ 'aria-label': 'Redimensionar Sidebar e Conteúdo' });
    expect(código).toContain("'aria-label': 'Redimensionar Sidebar e Conteúdo'");
    expect(código).not.toContain('ariaLabel');
  });

  it('nomeia um divisor por vez quando o grupo tem mais de um', () => {
    // Dois separadores com o mesmo nome são dois controles indistinguíveis na
    // lista do leitor de tela.
    const código = resizableSnippet({
      'aria-label': ['Redimensionar a coluna Navegação', 'Redimensionar a coluna Metadados'],
      panels: [
        { titulo: 'Navegação', defaultSize: 20, minSize: 12 },
        { titulo: 'Conteúdo', defaultSize: 55, minSize: 30 },
        { titulo: 'Metadados', defaultSize: 25, minSize: 15 },
      ],
    });
    expect(código).toContain("'Redimensionar a coluna Navegação',");
    expect(código).toContain("'Redimensionar a coluna Metadados',");
    expect(código.match(/bloco\('/g)).toHaveLength(3);
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = resizableSnippet();
    // `horizontal`, sem pegador, sem trava e sem callback de layout.
    expect(código).not.toContain('direction:');
    expect(código).not.toContain('withHandle');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('onLayout');
    expect(código).not.toContain('destroy()');
  });

  it('omite o piso e o teto que a fábrica já assume', () => {
    const código = resizableSnippet({
      panels: [
        { titulo: 'A', defaultSize: 50, minSize: 10, maxSize: 100 },
        { titulo: 'B', defaultSize: 50, minSize: 10 },
      ],
    });
    expect(código).not.toContain('minSize');
    expect(código).not.toContain('maxSize');
  });

  it('mostra as opções quando a story as usa', () => {
    const código = resizableSnippet({
      direction: 'vertical',
      withHandle: true,
      disabled: true,
      onLayout: '(sizes) => guardarLayout(sizes)',
      panels: [
        { titulo: 'Painel A', defaultSize: 50, minSize: 30, maxSize: 60 },
        { titulo: 'Painel B', defaultSize: 50, minSize: 30 },
      ],
    });
    expect(código).toContain("direction: 'vertical'");
    expect(código).toContain('withHandle: true');
    expect(código).toContain('disabled: true');
    expect(código).toContain('onLayout: (sizes) => guardarLayout(sizes)');
    expect(código).toContain('minSize: 30');
    expect(código).toContain('maxSize: 60');
  });

  it('os três números dos controls viram os dois painéis do exemplo', () => {
    const código = resizableSnippet({ defaultSize: 40, minSize: 20, maxSize: 60 });
    expect(código).toContain('defaultSize: 40');
    expect(código).toContain('defaultSize: 60');
    expect(código).toContain('minSize: 20');
    expect(código).toContain('maxSize: 60');
  });

  it('mostra a limpeza só quando ela é o assunto', () => {
    expect(resizableSnippet({ destroy: true })).toContain('grupo.destroy();');
  });

  it('não vaza o andaime das stories', () => {
    const código = resizableSnippet();
    expect(código).not.toContain('panelContent(');
    expect(código).not.toContain('frame(');
    expect(código).not.toContain('listBlock(');
    expect(código).not.toContain('fracaoDoPrimeiro');
  });
});

describe('resizableAninhadoSnippet', () => {
  it('monta dois grupos, cada um com o nome do próprio divisor', () => {
    const código = resizableAninhadoSnippet({
      interno: {
        direction: 'vertical',
        'aria-label': 'Redimensionar Editor e Console',
        panels: [
          { titulo: 'Editor', defaultSize: 60, minSize: 20 },
          { titulo: 'Console', defaultSize: 40, minSize: 20 },
        ],
      },
      externo: {
        'aria-label': 'Redimensionar Sidebar e área principal',
        panels: [
          { titulo: 'Sidebar', defaultSize: 30, minSize: 15 },
          { titulo: 'Área principal', defaultSize: 70, minSize: 30 },
        ],
      },
      vizinho: { titulo: 'Sidebar', defaultSize: 30, minSize: 15 },
    });
    expect(código.match(/createResizablePanel\(\{/g)).toHaveLength(2);
    expect(código).toContain("'aria-label': 'Redimensionar Editor e Console'");
    expect(código).toContain("'aria-label': 'Redimensionar Sidebar e área principal'");
    // O grupo de dentro entra no de fora como conteúdo de um painel.
    expect(código).toContain('content: interno');
  });
});

describe('resizableSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = resizableSource('<div data-slot="resizable">', {});
    const comArgs = resizableSource('<div data-slot="resizable">', {
      args: { direction: 'vertical', withHandle: true },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain("direction: 'vertical'");
    expect(comArgs).toContain('withHandle: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(resizableSource('<div data-direction="horizontal" data-slot="resizable">', {})).not.toContain(
      'data-direction',
    );
  });
});

describe('resizableSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = resizableSourceCom({ direction: 'vertical' });
    const código = transform('', { args: { direction: 'horizontal' } });
    expect(código).toContain("direction: 'vertical'");
  });
});

describe('resizableSourceAninhado', () => {
  it('entrega a forma aninhada, ignorando os args', () => {
    const transform = resizableSourceAninhado({
      interno: { direction: 'vertical', 'aria-label': 'Interno' },
      externo: { 'aria-label': 'Externo' },
      vizinho: { titulo: 'Sidebar', defaultSize: 30 },
    });
    const código = transform('', { args: { direction: 'horizontal' } });
    expect(código).toContain('content: interno');
    expect(código.match(/createResizablePanel\(\{/g)).toHaveLength(2);
  });
});
