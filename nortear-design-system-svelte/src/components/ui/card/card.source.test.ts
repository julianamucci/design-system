import { describe, expect, it } from 'vitest';
import {
  cardClickableSource,
  cardWithActionSource,
  cardWithImageSource,
  cardWithFooterSource,
  cardDeMetricaSource,
  cardDePerfilSource,
  productCardSource,
  cardDefaultSource,
  cardPequenoSource,
  cardSource,
} from './card.source';

describe('cardSource', () => {
  it('sem args, entrega a unidade completa no tamanho padrão', () => {
    expect(cardSource()).toBe(
      `<script lang="ts">
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
</script>

<Card class="nds-w-sm">
  <CardHeader>
    <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
    <CardDescription>Estrutura ergonômica com ajuste de altura e apoio lombar.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="nds-text-h4">R$ 1.299,00</p>
  </CardContent>
  <CardFooter class="nds-cluster" data-justify="end" data-spacing="md">
    <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">Editar</Button>
    <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">Excluir</Button>
  </CardFooter>
</Card>`,
    );
  });

  it('só escreve size quando o valor difere do padrão', () => {
    expect(cardSource('', { args: { size: 'default' } })).not.toContain('size=');
    expect(cardSource('', { args: { size: 'sm' } })).toContain('<Card class="nds-w-sm" size="sm">');
  });

  it('o rodapé é filho DIRETO do Card — é o que aciona a borda superior', () => {
    const output = cardSource();
    const lines = output.split('\n');
    const footer = lines.find((line) => line.includes('<CardFooter'))!;
    // Dois espaços de indentação: um nível abaixo do <Card>, sem invólucro no meio.
    expect(footer.match(/^ */)![0]).toBe('  ');
  });
});

describe('transforms das stories de tamanho, estado e composição', () => {
  it('o card padrão não traz rodapé nem botão', () => {
    const output = cardDefaultSource();
    expect(output).toContain('<CardHeader>');
    expect(output).not.toContain('CardFooter');
    expect(output).not.toContain('Button');
  });

  it('o tamanho pequeno escreve a prop e aperta a largura máxima', () => {
    const output = cardPequenoSource();
    expect(output).toContain('size="sm"');
    expect(output).toContain('nds-w-xs');
  });

  it('o card clicável ativa pelo link em volta, nunca pelo Card', () => {
    const output = cardClickableSource();
    expect(output).toContain('aria-label="Abrir detalhes do produto Cadeira Gamer Pro"');
    expect(output).toContain('nds-focus-ring');
    // Handler de clique no Card raiz é justamente o que a story desaconselha.
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('tabindex');
  });

  it('o rodapé traz as duas ações nomeando o card em que agem', () => {
    const output = cardWithFooterSource();
    expect(output).toContain('<CardFooter class="nds-cluster" data-justify="end" data-spacing="md">');
    expect(output).toContain('aria-label="Cancelar edição de Cadeira Gamer Pro"');
    expect(output).toContain('aria-label="Salvar alterações em Cadeira Gamer Pro"');
  });

  it('a ação mora DENTRO do header, depois da descrição', () => {
    const output = cardWithActionSource();
    expect(output).toContain('CardAction');
    expect(output.indexOf('<CardAction>')).toBeGreaterThan(output.indexOf('<CardDescription>'));
    expect(output.indexOf('<CardAction>')).toBeLessThan(output.indexOf('</CardHeader>'));
  });

  it('a imagem é o primeiro filho do card e tem alternativa textual', () => {
    const output = cardWithImageSource();
    expect(output.indexOf('<img')).toBeLessThan(output.indexOf('<CardHeader>'));
    expect(output).toContain('alt="Cadeira Gamer Pro vista de frente, em fundo neutro"');
  });

  it('o card de produto junta imagem, status no header e ações no rodapé', () => {
    const output = productCardSource();
    expect(output).toContain('from "@/components/ui/badge"');
    expect(output).toContain('<Badge variant="success">Em estoque</Badge>');
    expect(output.indexOf('<img')).toBeLessThan(output.indexOf('<CardHeader>'));
    expect(output).toContain('<CardFooter');
  });

  it('o card de métrica deixa o número no corpo, e o nome no título', () => {
    const output = cardDeMetricaSource();
    expect(output).toContain('<CardTitle as="h3">Assinantes ativos</CardTitle>');
    expect(output.indexOf('8.742')).toBeGreaterThan(output.indexOf('<CardContent>'));
    expect(output).toContain('size="sm"');
  });

  it('o card de perfil termina no header e traz o avatar', () => {
    const output = cardDePerfilSource();
    expect(output).toContain('from "@/components/ui/avatar"');
    expect(output).toContain('<AvatarFallback>MR</AvatarFallback>');
    expect(output).not.toContain('CardFooter');
    expect(output).not.toContain('CardContent');
  });
});
