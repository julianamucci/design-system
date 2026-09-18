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
    const output = cardSource();
    expect(output).toContain('} from "@/components/ui/card";');
    expect(output).toContain('import { Button } from "@/components/ui/button";');
  });

  it('omite o size quando é o padrão', () => {
    const output = cardSource(undefined, { args: { size: 'default', className: '' } });
    expect(output).not.toContain('size=');
  });

  it('escreve o size quando difere do padrão', () => {
    const output = cardSource(undefined, { args: { size: 'sm', className: '' } });
    expect(output).toContain('<Card size="sm"');
  });

  it('não inventa tamanho fora da união', () => {
    const output = cardSource(undefined, { args: { size: 'gigante' as never, className: '' } });
    expect(output).not.toContain('gigante');
  });

  it('mantém a largura máxima quando o control é limpo — sem limite o card ocupa a coluna', () => {
    const output = cardSource(undefined, { args: { className: '' } });
    expect(output).toContain('className="nds-w-sm"');
  });

  it('respeita a largura escolhida no control', () => {
    const output = cardSource(undefined, { args: { className: 'nds-max-w-xs' } });
    expect(output).toContain('className="nds-max-w-xs"');
  });

  it('o rodapé é filho DIRETO do Card — a regra de padding depende do parentesco', () => {
    const output = cardSource();
    expect(output).toContain('\n  <CardFooter');
    expect(output).toContain('\n  <CardHeader>');
    expect(output).toContain('\n  <CardContent>');
  });

  it('o título é heading de verdade, não texto com aparência de título', () => {
    expect(cardSource()).toContain('<CardTitle as="h3">');
  });

  it('cada ação do rodapé diz sobre QUAL item age', () => {
    const output = cardSource();
    expect(output).toContain('aria-label="Editar produto Cadeira Gamer Pro"');
    expect(output).toContain('aria-label="Excluir produto Cadeira Gamer Pro"');
  });
});

describe('composições', () => {
  it('sem rodapé o card termina no corpo — é a unidade mínima', () => {
    const output = cardNoFooterSource();
    expect(output).not.toContain('CardFooter');
    expect(output).not.toContain('Button');
  });

  it('o compacto propaga o tamanho pela raiz, e o ícone mede por classe', () => {
    const output = cardCompactoSource();
    expect(output).toContain('<Card size="sm"');
    // A altura do ícone vem de `.nds-icon-sm`: valor de design em `style`
    // escapa do tema, da densidade e da escala tipográfica.
    expect(output).toContain('className="nds-icon-sm"');
    expect(output).not.toContain('style={{ height');
    expect(output).toContain('aria-hidden="true"');
  });

  it('a ação mora DENTRO do header, que é de onde vem o alinhamento', () => {
    const output = cardWithActionSource();
    const header = output.indexOf('<CardHeader>');
    const acao = output.indexOf('<CardAction>');
    const endHeader = output.indexOf('</CardHeader>');
    expect(header).toBeGreaterThan(-1);
    expect(acao).toBeGreaterThan(header);
    expect(acao).toBeLessThan(endHeader);
    // Ordem do DOM: título → descrição → ação, para o leitor de tela ler na
    // ordem lógica mesmo com a ação no canto oposto.
    expect(output.indexOf('<CardTitle')).toBeLessThan(output.indexOf('<CardDescription>'));
    expect(output.indexOf('<CardDescription>')).toBeLessThan(acao);
  });

  it('a imagem é o primeiro filho do Card, e informa — logo tem alternativa textual', () => {
    const output = cardWithImageSource();
    const card = output.indexOf('<Card ');
    const img = output.indexOf('<img');
    expect(img).toBeGreaterThan(card);
    expect(img).toBeLessThan(output.indexOf('<CardHeader>'));
    expect(output).toMatch(/alt="[^"]{10,}"/);
  });

  it('o card de catálogo monta a unidade inteira, com o status na ação', () => {
    const output = cardProductSource();
    expect(output).toContain('import { Badge } from "@/components/ui/badge";');
    const acao = output.indexOf('<CardAction>');
    expect(output.indexOf('<Badge variant="info">')).toBeGreaterThan(acao);
    expect(output).toContain('<CardFooter');
  });

  it('o avatar do perfil é decorativo — o nome já está no título', () => {
    const output = cardPerfilSource();
    expect(output).toContain('alt=""');
    expect(output).toContain('<CardTitle as="h3">Maria Rodrigues</CardTitle>');
    expect(output).not.toContain('CardFooter');
  });

  it('o card clicável entrega foco e nome à âncora, nunca ao Card', () => {
    const output = cardClickableSource();
    expect(output).toContain('<a');
    expect(output).toContain('aria-label="Abrir detalhes do produto Cadeira Gamer Pro"');
    expect(output).toContain('nds-focus-ring');
    // O Card raiz continua passivo: sem handler próprio e fora da ordem de foco.
    expect(output).not.toContain('tabIndex');
    expect(output).not.toContain('onClick');
    expect(output).toContain('<Card>');
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  it('todos importam do design system e nenhum cita o módulo de apoio', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('./card');
      expect(output).toContain('@/components/ui/card');
    }
  });
});
