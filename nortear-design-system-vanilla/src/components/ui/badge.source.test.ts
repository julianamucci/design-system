import { describe, expect, it } from 'vitest';
import {
  badgeGroupSnippet,
  badgeLinkSnippet,
  badgeLinkSourceWith,
  badgeSnippet,
  badgeSource,
  badgeSourceWith,
  badgeTriggerSnippet,
  badgeTriggerSourceWith,
  badgeWithCounterSnippet,
  badgeWithCounterSourceWith,
  badgeGroupSourceWith,
} from './badge.source';

// Um bloco por story: o que cada painel Code publica tem de bater com o que a
// story ao lado monta.

describe('Playground — badgeSnippet / badgeSource', () => {
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

  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = badgeSource('<span data-slot="badge">', {});
    const withArgs = badgeSource('<span data-slot="badge">', {
      args: { variant: 'info', label: 'Novidade' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("variant: 'info'");
    expect(withArgs).toContain("children: 'Novidade'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(badgeSource('<span data-slot="badge" data-variant="warning">', {})).not.toContain(
      'warning',
    );
  });
});

describe('Destructive — badgeSourceWith', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = badgeSourceWith({ variant: 'destructive', label: 'Urgente' });
    const code = transform('', { args: { variant: 'success', label: 'Aprovado' } });
    expect(code).toContain("variant: 'destructive'");
    expect(code).toContain("children: 'Urgente'");
    expect(code).not.toContain('Aprovado');
  });
});

describe('Semantics — badgeGroupSnippet', () => {
  it('mostra as cinco etiquetas juntas, que é o que a story compara', () => {
    const code = badgeGroupSourceWith({})('', {});
    expect(code).toContain("createBadge({ children: 'Novo' }),");
    expect(code).toContain("createBadge({ variant: 'destructive', children: 'Urgente' }),");
    expect(code).toContain("createBadge({ variant: 'warning', children: 'Vence hoje' }),");
    expect(code).toContain("createBadge({ variant: 'success', children: 'Aprovado' }),");
    expect(code).toContain("createBadge({ variant: 'info', children: 'Novidade' }),");
    expect(code).toContain("group.className = 'nds-cluster';");
  });

  it('a variante padrão não é repetida na chamada', () => {
    const code = badgeGroupSnippet({ items: [{ variant: 'default', label: 'Novo' }] });
    expect(code).not.toContain("variant: 'default'");
  });
});

describe('WithIcon — badgeSnippet com ícone', () => {
  const code = badgeSnippet({ withIcon: true, label: 'Ativo' });

  it('o ícone entra na MESMA lista de children, junto com o texto', () => {
    expect(code).toContain("children: [icon, 'Ativo']");
  });

  it('ensina a construir o ícone, em vez de chamar um helper que quem copia não tem', () => {
    expect(code).toContain("import { Check, createElement } from 'lucide';");
    expect(code).toContain('const icon = createElement(Check);');
    expect(code).not.toContain('createCheckSvg');
    expect(code).not.toContain('createIcon(');
  });

  it('marca o ícone como decorativo e posicional', () => {
    expect(code).toContain("icon.setAttribute('aria-hidden', 'true');");
    expect(code).toContain("icon.setAttribute('data-icon', 'inline-start');");
  });
});

describe('WithCounter — badgeWithCounterSnippet', () => {
  it('monta o contador pela subfábrica, dentro do children da etiqueta', () => {
    const code = badgeWithCounterSourceWith({
      variant: 'destructive',
      label: 'Urgente',
      count: '12',
    })('', {});
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

describe('AsButton — badgeTriggerSnippet', () => {
  const code = badgeTriggerSourceWith({
    label: 'Design',
    accessibleName: 'Filtrar por Design',
  })('', {});

  it('o Button do design system, ghost e sm, é quem recebe clique, foco e nome', () => {
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain("variant: 'ghost',");
    expect(code).toContain("size: 'sm',");
    expect(code).toContain("'aria-label': 'Filtrar por Design',");
    expect(code).toContain("children: createBadge({ variant: 'info', children: 'Design' }),");
  });

  it('a etiqueta é info por padrão, e a variante vem da opção', () => {
    expect(badgeTriggerSnippet()).toContain("createBadge({ variant: 'info', children: 'Design' })");
    expect(badgeTriggerSnippet({ variant: 'success' })).toContain("variant: 'success'");
  });

  it('não reinicia a aparência de um <button> cru', () => {
    expect(code).not.toContain("document.createElement('button')");
    expect(code).not.toContain('.style.');
    // A etiqueta não compete pelo foco.
    expect(code).not.toContain('tabindex');
  });
});

describe('AsLink — badgeLinkSnippet', () => {
  it('a etiqueta é filha direta do <a>, que é quem recebe foco e Enter', () => {
    const code = badgeLinkSourceWith({ label: 'Design' })('', {});
    expect(code).toContain("const link = document.createElement('a');");
    expect(code).toContain("link.href = '#';");
    expect(code).toContain("link.append(createBadge({ variant: 'info', children: 'Design' }));");
    expect(code).not.toContain('tabindex');
  });

  it('o destino vem da opção', () => {
    expect(badgeLinkSnippet({ href: '/categorias/design' })).toContain(
      "link.href = '/categorias/design';",
    );
  });
});
