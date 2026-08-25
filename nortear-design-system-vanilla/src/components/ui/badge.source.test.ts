import { describe, expect, it } from 'vitest';
import {
  badgeEmGatilhoSnippet,
  badgeEmGrupoSnippet,
  badgeSnippet,
  badgeSource,
  badgeSourceCom,
  badgeWithCounterSnippet,
} from './badge.source';

describe('badgeSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = badgeSnippet();
    expect(code).toContain("import { createBadge } from '@/components/ui/badge';");
    expect(code).toContain('createBadge({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('data-variant=');
  });

  it('usa o nome da opção que a fábrica declara para o conteúdo', () => {
    const code = badgeSnippet({ label: 'Novo' });
    expect(code).toContain("children: 'Novo'");
    // `text` é apelido legado da fábrica, e `label` é o nome do control.
    expect(code).not.toMatch(/(^|\W)text:/);
    expect(code).not.toMatch(/(^|\W)label:/);
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = badgeSnippet();
    expect(code).not.toContain('variant:');
    expect(code).not.toContain('className');
  });

  it('mostra a variante e a classe extra quando a story as usa', () => {
    const code = badgeSnippet({ variant: 'destructive', className: 'nds-shrink-0' });
    expect(code).toContain("variant: 'destructive'");
    expect(code).toContain("className: 'nds-shrink-0'");
  });

  it('o ícone entra na MESMA lista de children, junto com o texto', () => {
    const code = badgeSnippet({ withIcon: true, label: 'Ativo' });
    expect(code).toContain("children: [icone, 'Ativo']");
    expect(code).toContain('aria-hidden');
    // Não existe fábrica de ícone genérica nesta stack: inventá-la seria API falsa.
    expect(code).not.toContain('createIcon(');
    expect(code).not.toContain('lucide');
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
    const code = transform('', { args: { variant: 'destructive', label: 'Urgente' } });
    expect(code).toContain("variant: 'success'");
    expect(code).toContain("children: 'Aprovado'");
    expect(code).not.toContain('Urgente');
  });
});

describe('badgeEmGrupoSnippet', () => {
  it('mostra as três etiquetas juntas, que é o que a story compara', () => {
    const code = badgeEmGrupoSnippet({
      items: [
        { variant: 'warning', label: 'Vence hoje' },
        { variant: 'success', label: 'Aprovado' },
        { variant: 'info', label: 'Novidade' },
      ],
    });
    expect(code).toContain("createBadge({ variant: 'warning', children: 'Vence hoje' }),");
    expect(code).toContain("createBadge({ variant: 'success', children: 'Aprovado' }),");
    expect(code).toContain("createBadge({ variant: 'info', children: 'Novidade' }),");
    expect(code).toContain("grupo.className = 'nds-cluster';");
  });
});

describe('badgeWithCounterSnippet', () => {
  it('monta o contador pela subfábrica, dentro do children da etiqueta', () => {
    const code = badgeWithCounterSnippet({ variant: 'destructive', label: 'Urgente', count: '12' });
    expect(code).toContain(
      "import { createBadge, createBadgeCounter } from '@/components/ui/badge';",
    );
    expect(code).toContain("children: ['Urgente', createBadgeCounter({ text: '12' })],");
    // A classe escrita à mão ensinaria a ignorar a peça publicada, que é quem
    // carrega o data-slot.
    expect(code).not.toContain('nds-badge-counter');
  });

  it('acima de 99 quem trunca é a aplicação — a peça recebe o texto pronto', () => {
    const code = badgeWithCounterSnippet({ count: '99+' });
    expect(code).toContain("createBadgeCounter({ text: '99+' })");
  });
});

describe('badgeEmGatilhoSnippet', () => {
  it('o link em volta é quem recebe o clique, o foco e o nome acessível', () => {
    const code = badgeEmGatilhoSnippet({
      como: 'link',
      href: '#design',
      variant: 'secondary',
      label: 'Design',
      accessibleName: 'Ver todos os itens da categoria Design',
    });
    expect(code).toContain("document.createElement('a')");
    expect(code).toContain("alvo.href = '#design';");
    expect(code).toContain(
      "alvo.setAttribute('aria-label', 'Ver todos os itens da categoria Design');",
    );
    expect(code).toContain("createBadge({ variant: 'secondary', children: 'Design' })");
    // A etiqueta não compete pelo foco.
    expect(code).not.toContain('tabindex');
  });

  it('o botão segue a mesma forma, sem virar um link', () => {
    const code = badgeEmGatilhoSnippet({ como: 'botao', label: 'React' });
    expect(code).toContain("document.createElement('button')");
    expect(code).toContain("alvo.type = 'button';");
    expect(code).not.toContain('alvo.href');
  });
});
