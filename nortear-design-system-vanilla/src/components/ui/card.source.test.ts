import { describe, expect, it } from 'vitest';
import { cardClickableSnippet, cardSnippet, cardSource, cardSourceWith } from './card.source';

describe('cardSnippet', () => {
  it('devolve a chamada das fábricas, e não o outerHTML do elemento', () => {
    const code = cardSnippet();
    expect(code).toContain("from '@/components/ui/card';");
    expect(code).toContain('createCard(');
    expect(code).toContain('createCardHeader()');
    expect(code).toContain('createCardTitle({');
    expect(code).toContain('createCardContent()');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<div class=');
  });

  it('usa o nome canônico da opção de classe, nunca o apelido depreciado', () => {
    // As stories ainda chamam `className`, que a fábrica aceita como apelido; o
    // snippet ensina `class`, que é o nome.
    const code = cardSnippet();
    expect(code).toContain("class: 'nds-w-sm'");
    // A OPÇÃO da fábrica, não a propriedade do DOM: `valor.className = …` é
    // outra coisa, e proibir a palavra inteira mediria a linha errada.
    expect(code).not.toContain('className:');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = cardSnippet();
    // `default` no tamanho é o padrão da fábrica e some do snippet.
    expect(code).not.toContain('size:');
    expect(code).not.toContain('createCardFooter');
    expect(code).not.toContain('createCardAction');
    expect(cardSnippet({ size: 'default' })).toBe(code);
  });

  it('ENSINA o nível do título, porque a story o passa', () => {
    // O default da fábrica virou `<div>` neutro em 2026-09-09, alinhando com
    // react, vue e svelte — antes era `h3` fixo. Com o default neutro, um
    // snippet sem `level` passaria a ensinar um título SEM semântica de
    // cabeçalho enquanto a prévia ao lado renderiza um `h3`, que é a forma
    // exata do defeito que esta campanha mais encontrou. Os snippets das outras
    // quatro stacks já traziam `as="h3"`.
    expect(cardSnippet()).toContain('level: 3');
  });

  it('mostra o tamanho compacto quando a story o usa', () => {
    expect(cardSnippet({ size: 'sm' })).toContain("size: 'sm'");
  });

  it('o rodapé entra como filho DIRETO, depois do conteúdo', () => {
    const code = cardSnippet({ showFooter: true });
    expect(code).toContain('createCardFooter,');
    expect(code).toContain("createCardFooter({ class: 'nds-cluster' })");
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain('card.append(\n  cabecalho,\n  conteudo,\n  rodape,\n);');
    // Os botões nomeiam o cartão: "Salvar" sozinho vira uma fileira de rótulos
    // idênticos numa lista.
    expect(code).toContain("'aria-label': 'Salvar alterações em Cadeira Gamer Pro'");
  });

  it('a ação vive dentro do cabeçalho, e a imagem é o primeiro filho', () => {
    const withAction = cardSnippet({ action: true });
    expect(withAction).toContain('createCardAction()');
    expect(withAction).toContain('cabecalho.appendChild(acao);');

    const withImage = cardSnippet({ image: true });
    expect(withImage).toContain('card.append(\n  foto,\n  cabecalho,\n  conteudo,\n);');
    expect(withImage).toContain('foto.alt =');
  });

  it('não vaza helper de story', () => {
    const code = cardSnippet({ showFooter: true, image: true, action: true });
    expect(code).not.toContain('buildHeader');
    expect(code).not.toContain('buildPrice');
    expect(code).not.toContain('buildBasicCard');
    expect(code).not.toContain('buildProductCard');
    expect(code).not.toContain('DEMO_IMAGE_PRODUCT');
    expect(code).not.toContain('data:image/svg+xml');
  });
});

describe('cardSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = cardSource('<div data-slot="card">', {});
    const withArgs = cardSource('<div data-slot="card">', {
      args: { size: 'sm', title: 'Assinantes ativos', price: '8.742', showFooter: true },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("size: 'sm'");
    expect(withArgs).toContain("createCardTitle({ text: 'Assinantes ativos', level: 3 })");
    expect(withArgs).toContain("valor.textContent = '8.742';");
    expect(withArgs).toContain('createCardFooter');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(cardSource('<div data-slot="card" data-size="default" class="nds-card">', {})).not.toContain(
      'data-size',
    );
  });
});

describe('cardSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = cardSourceWith({ size: 'sm' });
    const code = transform('', { args: { size: 'default', title: 'Outro título' } });
    expect(code).toContain("size: 'sm'");
    expect(code).toContain("createCardTitle({ text: 'Outro título', level: 3 })");
  });
});

describe('cardClicavelSnippet', () => {
  it('o destino é o <a> de fora; o Card continua passivo', () => {
    const code = cardClickableSnippet();
    expect(code).toContain("document.createElement('a')");
    expect(code).toContain(
      "destino.setAttribute('aria-label', 'Abrir detalhes do produto Cadeira Gamer Pro');",
    );
    expect(code).toContain('destino.appendChild(card);');
    // Nada de handler nem de tabindex no Card: a ativação por teclado e o anel
    // de foco vivem no wrapper.
    expect(code).not.toContain('card.addEventListener');
    expect(code).not.toContain('tabIndex');
    expect(code).not.toContain('data-slot=');
  });

  it('a largura fica no destino, não no Card de dentro', () => {
    const code = cardClickableSnippet();
    expect(code).toContain("createCard({ class: 'nds-w-full' })");
    expect(code).toContain('nds-w-sm');
  });
});
