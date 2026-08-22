import { describe, expect, it } from 'vitest';
import {
  badgeEmGatilhoSnippet,
  badgeEmGrupoSnippet,
  badgeSnippet,
  badgeSource,
  badgeSourceCom,
} from './badge.source';

describe('badgeSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = badgeSnippet();
    expect(código).toContain("import { createBadge } from '@/components/ui/badge';");
    expect(código).toContain('createBadge({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('data-variant=');
  });

  it('usa o nome da opção que a fábrica declara para o conteúdo', () => {
    const código = badgeSnippet({ label: 'Novo' });
    expect(código).toContain("children: 'Novo'");
    // `text` é apelido legado da fábrica, e `label` é o nome do control.
    expect(código).not.toMatch(/(^|\W)text:/);
    expect(código).not.toMatch(/(^|\W)label:/);
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = badgeSnippet();
    expect(código).not.toContain('variant:');
    expect(código).not.toContain('className');
  });

  it('mostra a variante e a classe extra quando a story as usa', () => {
    const código = badgeSnippet({ variant: 'destructive', className: 'nds-shrink-0' });
    expect(código).toContain("variant: 'destructive'");
    expect(código).toContain("className: 'nds-shrink-0'");
  });

  it('o ícone entra na MESMA lista de children, junto com o texto', () => {
    const código = badgeSnippet({ withIcon: true, label: 'Ativo' });
    expect(código).toContain("children: [icone, 'Ativo']");
    expect(código).toContain('aria-hidden');
    // Não existe fábrica de ícone genérica nesta stack: inventá-la seria API falsa.
    expect(código).not.toContain('createIcon(');
    expect(código).not.toContain('lucide');
  });
});

describe('badgeSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = badgeSource('<span data-slot="badge">', {});
    const withArgs = badgeSource('<span data-slot="badge">', {
      args: { variant: 'outline', label: 'Rascunho' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("variant: 'outline'");
    expect(withArgs).toContain("children: 'Rascunho'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(badgeSource('<span data-slot="badge" data-variant="secondary">', {})).not.toContain(
      'secondary',
    );
  });
});

describe('badgeSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = badgeSourceCom({ variant: 'success', label: 'Aprovado' });
    const código = transform('', { args: { variant: 'destructive', label: 'Urgente' } });
    expect(código).toContain("variant: 'success'");
    expect(código).toContain("children: 'Aprovado'");
    expect(código).not.toContain('Urgente');
  });
});

describe('badgeEmGrupoSnippet', () => {
  it('mostra as três etiquetas juntas, que é o que a story compara', () => {
    const código = badgeEmGrupoSnippet({
      itens: [
        { variant: 'warning', label: 'Vence hoje' },
        { variant: 'success', label: 'Aprovado' },
        { variant: 'info', label: 'Novidade' },
      ],
    });
    expect(código).toContain("createBadge({ variant: 'warning', children: 'Vence hoje' }),");
    expect(código).toContain("createBadge({ variant: 'success', children: 'Aprovado' }),");
    expect(código).toContain("createBadge({ variant: 'info', children: 'Novidade' }),");
    expect(código).toContain("grupo.className = 'nds-cluster';");
  });
});

describe('badgeEmGatilhoSnippet', () => {
  it('o link em volta é quem recebe o clique, o foco e o nome acessível', () => {
    const código = badgeEmGatilhoSnippet({
      como: 'link',
      href: '#design',
      variant: 'secondary',
      label: 'Design',
      accessibleName: 'Ver todos os itens da categoria Design',
    });
    expect(código).toContain("document.createElement('a')");
    expect(código).toContain("alvo.href = '#design';");
    expect(código).toContain(
      "alvo.setAttribute('aria-label', 'Ver todos os itens da categoria Design');",
    );
    expect(código).toContain("createBadge({ variant: 'secondary', children: 'Design' })");
    // A etiqueta não compete pelo foco.
    expect(código).not.toContain('tabindex');
  });

  it('o botão segue a mesma forma, sem virar um link', () => {
    const código = badgeEmGatilhoSnippet({ como: 'botao', label: 'React' });
    expect(código).toContain("document.createElement('button')");
    expect(código).toContain("alvo.type = 'button';");
    expect(código).not.toContain('alvo.href');
  });
});
