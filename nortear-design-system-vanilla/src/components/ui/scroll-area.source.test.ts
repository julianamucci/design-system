import { describe, expect, it } from 'vitest';
import {
  scrollAreaEmCardSnippet,
  scrollAreaNoLimitSnippet,
  scrollAreaSnippet,
  scrollAreaSource,
  scrollAreaSourceWith,
} from './scroll-area.source';

describe('scrollAreaSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = scrollAreaSnippet();
    expect(código).toContain("import { createScrollArea } from '@/components/ui/scroll-area';");
    expect(código).toContain('createScrollArea({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('tabindex="0"');
  });

  it('usa o nome acessível canônico, nunca o apelido depreciado', () => {
    const código = scrollAreaSnippet({ label: 'Lista de itens' });
    expect(código).toContain("'aria-label': 'Lista de itens'");
    // `label:` e `className:` são apelidos `@deprecated` da fábrica.
    expect(código).not.toMatch(/(^|[^-\w])label:/m);
    expect(código).not.toContain('className:');
    expect(código).toContain("class: 'nds-w-full nds-rounded-md nds-border-default'");
  });

  it('mostra o degrau de altura — sem teto não há transbordo, logo não há rolagem', () => {
    expect(scrollAreaSnippet()).toContain("size: 'lg'");
    expect(scrollAreaSnippet({ size: 'md' })).toContain("size: 'md'");
    // `null` é o caso em que a story monta a área sem teto de propósito.
    expect(scrollAreaSnippet({ size: null })).not.toContain('size:');
  });

  it('só mostra a largura quando a story a usa', () => {
    expect(scrollAreaSnippet()).not.toContain('width:');
    expect(scrollAreaSnippet({ width: '100%' })).toContain("width: '100%'");
  });

  it('constrói o conteúdo com DOM curto e fábricas do design system, sem helper de story', () => {
    const lista = scrollAreaSnippet({ itemCount: 12 });
    expect(lista).toContain('for (let i = 1; i <= 12; i++)');
    expect(lista).not.toContain('buildList');
    expect(lista).not.toContain('buildVerticalList');

    const fileira = scrollAreaSnippet({ conteudo: 'fileira' });
    expect(fileira).toContain("import { createCard, createCardContent } from '@/components/ui/card';");
    expect(fileira).toContain('nds-shrink-0');
    expect(fileira).not.toContain('buildHorizontalRow');

    const badges = scrollAreaSnippet({ conteudo: 'badges' });
    expect(badges).toContain("import { createBadge } from '@/components/ui/badge';");
    expect(badges).not.toContain('tagItem');
  });

  it('dá nome ao marco quando o conteúdo é navegação', () => {
    const código = scrollAreaSnippet({ conteudo: 'links' });
    expect(código).toContain("navegacao.setAttribute('aria-label', 'Ações da conta');");
    expect(código).not.toContain('buildLinkList');
  });

  it('não crava medida em style inline', () => {
    const código = scrollAreaSnippet({ conteudo: 'fileira' });
    expect(código).not.toContain('.style.width');
    expect(código).not.toContain('max-content');
  });
});

describe('scrollAreaSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = scrollAreaSource('<div data-slot="scroll-area">', {});
    const withArgs = scrollAreaSource('<div data-slot="scroll-area">', {
      args: { size: 'xs', itemCount: 5, label: 'Outra lista' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("size: 'xs'");
    expect(withArgs).toContain('i <= 5');
    expect(withArgs).toContain("'aria-label': 'Outra lista'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(scrollAreaSource('<div data-slot="scroll-area" role="region">', {})).not.toContain(
      'role="region"',
    );
  });
});

describe('scrollAreaSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = scrollAreaSourceWith({ conteudo: 'matriz', size: 'xl' })('', {
      args: { size: 'sm' },
    });
    expect(código).toContain("size: 'xl'");
    expect(código).toContain('nds-whitespace-nowrap');
  });
});

describe('scrollAreaSemLimiteSnippet', () => {
  it('mostra o par sem teto × com teto, que é o assunto da story', () => {
    const código = scrollAreaNoLimitSnippet({ size: 'sm' });
    expect(código).toContain('const semTeto = createScrollArea({');
    expect(código).toContain('const comTeto = createScrollArea({');
    expect(código).toContain("size: 'sm'");
    expect(código).toContain("append(semTeto, comTeto)");
    // A área sem teto também não tem nome: papel sem nome não vira marco.
    //
    // A busca é pela OPÇÃO (`'aria-label':`), não pelo texto solto: o snippet
    // carrega um comentário explicando por que o nome está ausente, e procurar
    // a palavra fazia a asserção reprovar a própria explicação.
    expect(código.split('const comTeto')[0]).not.toContain("'aria-label':");
  });
});

describe('scrollAreaEmCardSnippet', () => {
  it('põe a área DENTRO do cartão, com o cabeçalho fora dela', () => {
    const código = scrollAreaEmCardSnippet({ size: 'lg' });
    expect(código).toContain('createCardHeader()');
    expect(código).toContain('corpo.appendChild(area);');
    expect(código).toContain('cartao.append(cabecalho, corpo);');
  });
});
