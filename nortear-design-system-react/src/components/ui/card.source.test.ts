import { describe, expect, it } from 'vitest';
import {
  cardClickableSource,
  cardWithActionSource,
  cardWithImageSource,
  cardCompactoSource,
  cardPerfilSource,
  cardProductSource,
  cardNoFooterSource,
  cardSource,
} from './card.source';

const ALL = [
  cardSource,
  cardNoFooterSource,
  cardCompactoSource,
  cardWithActionSource,
  cardWithImageSource,
  cardProductSource,
  cardPerfilSource,
  cardClickableSource,
];

describe('cardSource', () => {
  it('ensina a importação do design system, peça por peça', () => {
    const saida = cardSource();
    expect(saida).toContain('} from "@/components/ui/card";');
    expect(saida).toContain('import { Button } from "@/components/ui/button";');
  });

  it('omite o size quando é o padrão', () => {
    const saida = cardSource(undefined, { args: { size: 'default', className: '' } });
    expect(saida).not.toContain('size=');
  });

  it('escreve o size quando difere do padrão', () => {
    const saida = cardSource(undefined, { args: { size: 'sm', className: '' } });
    expect(saida).toContain('<Card size="sm"');
  });

  it('não inventa tamanho fora da união', () => {
    const saida = cardSource(undefined, { args: { size: 'gigante' as never, className: '' } });
    expect(saida).not.toContain('gigante');
  });

  it('mantém a largura máxima quando o control é limpo — sem limite o card ocupa a coluna', () => {
    const saida = cardSource(undefined, { args: { className: '' } });
    expect(saida).toContain('className="nds-w-sm"');
  });

  it('respeita a largura escolhida no control', () => {
    const saida = cardSource(undefined, { args: { className: 'nds-max-w-xs' } });
    expect(saida).toContain('className="nds-max-w-xs"');
  });

  it('o rodapé é filho DIRETO do Card — a regra de padding depende do parentesco', () => {
    const saida = cardSource();
    expect(saida).toContain('\n  <CardFooter');
    expect(saida).toContain('\n  <CardHeader>');
    expect(saida).toContain('\n  <CardContent>');
  });

  it('o título é heading de verdade, não texto com aparência de título', () => {
    expect(cardSource()).toContain('<CardTitle as="h3">');
  });

  it('cada ação do rodapé diz sobre QUAL item age', () => {
    const saida = cardSource();
    expect(saida).toContain('aria-label="Editar produto Cadeira Gamer Pro"');
    expect(saida).toContain('aria-label="Excluir produto Cadeira Gamer Pro"');
  });
});

describe('composições', () => {
  it('sem rodapé o card termina no corpo — é a unidade mínima', () => {
    const saida = cardNoFooterSource();
    expect(saida).not.toContain('CardFooter');
    expect(saida).not.toContain('Button');
  });

  it('o compacto propaga o tamanho pela raiz, e o ícone mede por classe', () => {
    const saida = cardCompactoSource();
    expect(saida).toContain('<Card size="sm"');
    // A altura do ícone vem de `.nds-icon-sm`: valor de design em `style`
    // escapa do tema, da densidade e da escala tipográfica.
    expect(saida).toContain('className="nds-icon-sm"');
    expect(saida).not.toContain('style={{ height');
    expect(saida).toContain('aria-hidden="true"');
  });

  it('a ação mora DENTRO do header, que é de onde vem o alinhamento', () => {
    const saida = cardWithActionSource();
    const header = saida.indexOf('<CardHeader>');
    const acao = saida.indexOf('<CardAction>');
    const endHeader = saida.indexOf('</CardHeader>');
    expect(header).toBeGreaterThan(-1);
    expect(acao).toBeGreaterThan(header);
    expect(acao).toBeLessThan(endHeader);
    // Ordem do DOM: título → descrição → ação, para o leitor de tela ler na
    // ordem lógica mesmo com a ação no canto oposto.
    expect(saida.indexOf('<CardTitle')).toBeLessThan(saida.indexOf('<CardDescription>'));
    expect(saida.indexOf('<CardDescription>')).toBeLessThan(acao);
  });

  it('a imagem é o primeiro filho do Card, e informa — logo tem alternativa textual', () => {
    const saida = cardWithImageSource();
    const card = saida.indexOf('<Card ');
    const img = saida.indexOf('<img');
    expect(img).toBeGreaterThan(card);
    expect(img).toBeLessThan(saida.indexOf('<CardHeader>'));
    expect(saida).toMatch(/alt="[^"]{10,}"/);
  });

  it('o card de catálogo monta a unidade inteira, com o status na ação', () => {
    const saida = cardProductSource();
    expect(saida).toContain('import { Badge } from "@/components/ui/badge";');
    const acao = saida.indexOf('<CardAction>');
    expect(saida.indexOf('<Badge variant="secondary">')).toBeGreaterThan(acao);
    expect(saida).toContain('<CardFooter');
  });

  it('o avatar do perfil é decorativo — o nome já está no título', () => {
    const saida = cardPerfilSource();
    expect(saida).toContain('alt=""');
    expect(saida).toContain('<CardTitle as="h3">Maria Rodrigues</CardTitle>');
    expect(saida).not.toContain('CardFooter');
  });

  it('o card clicável entrega foco e nome à âncora, nunca ao Card', () => {
    const saida = cardClickableSource();
    expect(saida).toContain('<a');
    expect(saida).toContain('aria-label="Abrir detalhes do produto Cadeira Gamer Pro"');
    expect(saida).toContain('nds-focus-ring');
    // O Card raiz continua passivo: sem handler próprio e fora da ordem de foco.
    expect(saida).not.toContain('tabIndex');
    expect(saida).not.toContain('onClick');
    expect(saida).toContain('<Card>');
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  it('todos importam do design system e nenhum cita o módulo de apoio', () => {
    for (const fn of ALL) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('./card');
      expect(saida).toContain('@/components/ui/card');
    }
  });
});
