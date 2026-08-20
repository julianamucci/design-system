import { describe, expect, it } from 'vitest';
import { cardClicavelSnippet, cardSnippet, cardSource, cardSourceCom } from './card.source';

describe('cardSnippet', () => {
  it('devolve a chamada das fábricas, e não o outerHTML do elemento', () => {
    const código = cardSnippet();
    expect(código).toContain("from '@/components/ui/card';");
    expect(código).toContain('createCard(');
    expect(código).toContain('createCardHeader()');
    expect(código).toContain('createCardTitle({');
    expect(código).toContain('createCardContent()');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('<div class=');
  });

  it('usa o nome canônico da opção de classe, nunca o apelido depreciado', () => {
    // As stories ainda chamam `className`, que a fábrica aceita como apelido; o
    // snippet ensina `class`, que é o nome.
    const código = cardSnippet();
    expect(código).toContain("class: 'nds-w-cap-sm'");
    // A OPÇÃO da fábrica, não a propriedade do DOM: `valor.className = …` é
    // outra coisa, e proibir a palavra inteira mediria a linha errada.
    expect(código).not.toContain('className:');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = cardSnippet();
    // `default` no tamanho e nível 3 no título são o padrão.
    expect(código).not.toContain('size:');
    expect(código).not.toContain('level:');
    expect(código).not.toContain('createCardFooter');
    expect(código).not.toContain('createCardAction');
    expect(cardSnippet({ size: 'default' })).toBe(código);
  });

  it('mostra o tamanho compacto quando a story o usa', () => {
    expect(cardSnippet({ size: 'sm' })).toContain("size: 'sm'");
  });

  it('o rodapé entra como filho DIRETO, depois do conteúdo', () => {
    const código = cardSnippet({ showFooter: true });
    expect(código).toContain('createCardFooter,');
    expect(código).toContain("createCardFooter({ class: 'nds-cluster' })");
    expect(código).toContain("import { createButton } from '@/components/ui/button';");
    expect(código).toContain('card.append(\n  cabecalho,\n  conteudo,\n  rodape,\n);');
    // Os botões nomeiam o cartão: "Salvar" sozinho vira uma fileira de rótulos
    // idênticos numa lista.
    expect(código).toContain("'aria-label': 'Salvar alterações em Cadeira Gamer Pro'");
  });

  it('a ação vive dentro do cabeçalho, e a imagem é o primeiro filho', () => {
    const comAcao = cardSnippet({ action: true });
    expect(comAcao).toContain('createCardAction()');
    expect(comAcao).toContain('cabecalho.appendChild(acao);');

    const comImagem = cardSnippet({ image: true });
    expect(comImagem).toContain('card.append(\n  foto,\n  cabecalho,\n  conteudo,\n);');
    expect(comImagem).toContain('foto.alt =');
  });

  it('não vaza helper de story', () => {
    const código = cardSnippet({ showFooter: true, image: true, action: true });
    expect(código).not.toContain('buildHeader');
    expect(código).not.toContain('buildPrice');
    expect(código).not.toContain('buildBasicCard');
    expect(código).not.toContain('buildProductCard');
    expect(código).not.toContain('DEMO_IMAGE_PRODUCT');
    expect(código).not.toContain('data:image/svg+xml');
  });
});

describe('cardSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = cardSource('<div data-slot="card">', {});
    const comArgs = cardSource('<div data-slot="card">', {
      args: { size: 'sm', title: 'Assinantes ativos', price: '8.742', showFooter: true },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain("size: 'sm'");
    expect(comArgs).toContain("createCardTitle({ text: 'Assinantes ativos' })");
    expect(comArgs).toContain("valor.textContent = '8.742';");
    expect(comArgs).toContain('createCardFooter');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(cardSource('<div data-slot="card" data-size="default" class="nds-card">', {})).not.toContain(
      'data-size',
    );
  });
});

describe('cardSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = cardSourceCom({ size: 'sm' });
    const código = transform('', { args: { size: 'default', title: 'Outro título' } });
    expect(código).toContain("size: 'sm'");
    expect(código).toContain("createCardTitle({ text: 'Outro título' })");
  });
});

describe('cardClicavelSnippet', () => {
  it('o destino é o <a> de fora; o Card continua passivo', () => {
    const código = cardClicavelSnippet();
    expect(código).toContain("document.createElement('a')");
    expect(código).toContain(
      "destino.setAttribute('aria-label', 'Abrir detalhes do produto Cadeira Gamer Pro');",
    );
    expect(código).toContain('destino.appendChild(card);');
    // Nada de handler nem de tabindex no Card: a ativação por teclado e o anel
    // de foco vivem no wrapper.
    expect(código).not.toContain('card.addEventListener');
    expect(código).not.toContain('tabIndex');
    expect(código).not.toContain('data-slot=');
  });

  it('a largura fica no destino, não no Card de dentro', () => {
    const código = cardClicavelSnippet();
    expect(código).toContain("createCard({ class: 'nds-w-full' })");
    expect(código).toContain('nds-w-cap-sm');
  });
});
