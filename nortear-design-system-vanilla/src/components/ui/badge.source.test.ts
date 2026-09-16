import { describe, expect, it } from 'vitest';
import badgeTranslations from '@shared/content/badge/translations.json';
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

/** Rótulos do conteúdo compartilhado — a fonte que story e construtor leem. */
const LABELS = badgeTranslations['pt-BR'].demonstration.labels;

/** Os arquivos de story, como texto: cada story tem de ligar a PRÓPRIA transform. */
const stories = import.meta.glob<string>('./badge*.stories.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const allStories = Object.values(stories).join('\n');

/** O bloco de uma story, do `export const Nome` até o próximo export. */
function storyBlock(name: string): string {
  const match = new RegExp(`export const ${name}: Story = \\{([\\s\\S]*?)(?=\\nexport |$)`).exec(
    allStories,
  );
  return match?.[1] ?? '';
}

const STORIES = [
  'Playground',
  'Default',
  'Destructive',
  'Semantics',
  'WithIcon',
  'WithCounter',
  'AsButton',
  'AsLink',
] as const;

describe('o painel diz o que a tela mostra', () => {
  it('os três arquivos de story foram lidos', () => {
    // Contagem gerada some sem deixar rastro: se o glob deixar de alcançar um
    // arquivo, os casos abaixo passariam medindo menos.
    expect(Object.keys(stories)).toHaveLength(3);
  });

  // Cada linha é: story, o código que o painel dela publica, e o trecho que ele
  // precisa conter — o MESMO texto e a MESMA variante que o `render` monta.
  const pairs: Array<[string, string, string]> = [
    ['Default', badgeSourceWith({ label: LABELS.defaultLabel })('', {}), `children: '${LABELS.defaultLabel}'`],
    [
      'Destructive',
      badgeSourceWith({ variant: 'destructive', label: LABELS.destructiveLabel })('', {}),
      `variant: 'destructive'`,
    ],
    [
      'WithIcon',
      badgeSourceWith({ withIcon: true, label: LABELS.statusLabel })('', {}),
      `children: [icon, '${LABELS.statusLabel}']`,
    ],
    [
      'WithCounter',
      badgeWithCounterSourceWith({
        variant: 'destructive',
        label: LABELS.destructiveLabel,
        count: '12',
      })('', {}),
      `children: ['${LABELS.destructiveLabel}', createBadgeCounter({ text: '12' })],`,
    ],
    [
      'AsButton',
      badgeTriggerSourceWith({
        label: LABELS.categoryLabel,
        accessibleName: LABELS.categoryFilterLabel,
      })('', {}),
      `children: createBadge({ variant: 'info', children: '${LABELS.categoryLabel}' }),`,
    ],
    [
      'AsLink',
      badgeLinkSourceWith({ label: LABELS.categoryLabel })('', {}),
      `link.append(createBadge({ variant: 'info', children: '${LABELS.categoryLabel}' }));`,
    ],
  ];

  for (const [story, code, fragmento] of pairs) {
    it(`${story}: o snippet traz o texto e a variante que a story renderiza`, () => {
      expect(code).toContain(fragmento);
      const block = storyBlock(story);
      expect(block, `a story ${story} não foi encontrada`).not.toBe('');
      expect(block).toMatch(/transform:\s*badge/);
    });
  }

  it('Semantics traz as cinco variantes, cada uma com o rótulo que a story mostra', () => {
    const code = badgeGroupSourceWith({})('', {});
    expect(code).toContain(`createBadge({ children: '${LABELS.defaultLabel}' }),`);
    expect(code).toContain(
      `createBadge({ variant: 'destructive', children: '${LABELS.destructiveLabel}' }),`,
    );
    expect(code).toContain(
      `createBadge({ variant: 'warning', children: '${LABELS.warningLabel}' }),`,
    );
    expect(code).toContain(
      `createBadge({ variant: 'success', children: '${LABELS.successLabel}' }),`,
    );
    expect(code).toContain(`createBadge({ variant: 'info', children: '${LABELS.infoLabel}' }),`);
    expect(storyBlock('Semantics')).toMatch(/transform:\s*badgeGroupSourceWith/);
  });

  it('toda story declara a própria transform, sem herdar a do meta', () => {
    // Herança acerta por coincidência: no dia em que o `meta` trocar de
    // transform, a story que não declara a sua publica outro exemplo em
    // silêncio — e nada compara o painel com a tela.
    for (const story of STORIES) {
      const block = storyBlock(story);
      expect(block, `a story ${story} não foi encontrada`).not.toBe('');
      expect(block, `${story} herda a transform do meta`).toMatch(/source:\s*\{[\s\S]{0,160}?transform:/);
      // Nunca lambda: só função exportada de `.source` tem como ser testada, e é
      // o que o `story-source-wiring.test.ts` cobra da stack inteira.
      expect(block, `${story} declara a transform como lambda`).not.toMatch(/transform:\s*\(/);
    }
  });

  it('o rótulo sai do conteúdo compartilhado, e não de um literal no construtor', () => {
    // Story e construtor leem o MESMO bloco do JSON: é o que impede o painel de
    // envelhecer sozinho no dia em que o texto do exemplo mudar.
    expect(badgeSnippet()).toContain(`children: '${LABELS.defaultLabel}'`);
    expect(badgeWithCounterSnippet()).toContain(`'${LABELS.destructiveLabel}'`);
    expect(badgeTriggerSnippet()).toContain(`'aria-label': '${LABELS.categoryFilterLabel}',`);
    expect(badgeTriggerSnippet()).toContain(`children: '${LABELS.categoryLabel}'`);
    expect(badgeLinkSnippet()).toContain(`children: '${LABELS.categoryLabel}'`);
  });
});
