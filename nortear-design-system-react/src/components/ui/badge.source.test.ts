import { describe, expect, it } from 'vitest';
import badgeTranslations from '@shared/content/badge/translations.json';
import {
  badgeAsButtonSnippet,
  badgeAsButtonSource,
  badgeAsLinkSnippet,
  badgeAsLinkSource,
  badgeWithCounterSnippet,
  badgeWithIconSnippet,
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeSemanticsSource,
  badgeSource,
  badgeWithCounterSource,
  badgeWithIconSource,
} from './badge.source';

describe('badgeSource (Playground)', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(badgeSource()).toContain('import { Badge } from "@/components/ui/badge";');
  });

  it('omite o variant quando é o padrão', () => {
    expect(badgeSource(undefined, { args: { variant: 'default', children: 'Novo' } })).toContain(
      '<Badge>Novo</Badge>',
    );
  });

  it('omite o variant quando o Playground não passa nenhum', () => {
    expect(badgeSource(undefined, { args: { children: 'Novo' } })).toContain('<Badge>Novo</Badge>');
  });

  it('escreve o variant quando difere do padrão', () => {
    expect(badgeSource(undefined, { args: { variant: 'success', children: 'Aprovado' } })).toContain(
      '<Badge variant="success">Aprovado</Badge>',
    );
  });

  it('não inventa variante fora da união', () => {
    const output = badgeSource(undefined, { args: { variant: 'roxo' as never, children: 'X' } });
    expect(output).toContain('<Badge>X</Badge>');
  });

  it('cai no texto padrão quando o control entrega um espião no lugar da string', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const output = badgeSource(undefined, { args: { children: spy as never } });
    expect(output).toContain('<Badge>Novo</Badge>');
    expect(output).not.toContain('CORPO_DO_MOCK');
  });
});

describe('Default', () => {
  it('é o padrão, então sai sem atributo de variante', () => {
    expect(badgeDefaultSource()).toContain('<Badge>Novo</Badge>');
    expect(badgeDefaultSource()).not.toContain('variant=');
  });
});

describe('Destructive', () => {
  it('diz a variante, porque o arquivo desliga os controls', () => {
    expect(badgeDestructiveSource()).toContain('<Badge variant="destructive">Urgente</Badge>');
  });
});

describe('Semantics', () => {
  it('mostra as cinco variantes, que é o que a story mede', () => {
    const output = badgeSemanticsSource();
    expect(output).toContain('<Badge>Novo</Badge>');
    for (const variant of ['destructive', 'warning', 'success', 'info']) {
      expect(output).toContain(`variant="${variant}"`);
    }
    expect(output).not.toContain('variant="default"');
  });

  it('nunca ensina a classe de variante escrita à mão', () => {
    expect(badgeSemanticsSource()).not.toContain('nds-badge-');
  });
});

describe('WithIcon', () => {
  it('o ícone sai da árvore de acessibilidade e encurta o padding do seu lado', () => {
    const output = badgeWithIconSource();
    expect(output).toContain('import { Check } from "lucide-react";');
    expect(output).toContain('aria-hidden="true"');
    expect(output).toContain('data-icon="inline-start"');
  });
});

describe('WithCounter', () => {
  it('o contador vem da peça publicada, dentro da etiqueta e depois do rótulo', () => {
    const output = badgeWithCounterSource();
    expect(output).toContain('import { Badge, BadgeCounter } from "@/components/ui/badge";');
    expect(output).toContain('<BadgeCounter>12</BadgeCounter>');
    expect(output.indexOf('<BadgeCounter>')).toBeGreaterThan(output.indexOf('Urgente'));
    expect(output).not.toContain('aria-hidden');
  });
});

describe('AsButton', () => {
  it('envolve a etiqueta no Button do design system, ghost e sm', () => {
    const output = badgeAsButtonSource();
    expect(output).toContain('import { Button } from "@/components/ui/button";');
    expect(output).toContain('<Button variant="ghost" size="sm" aria-label="Filtrar por Design">');
    expect(output).toContain('<Badge variant="info">Design</Badge>');
  });

  it('não ensina <button> cru, reset inline nem tabIndex na etiqueta', () => {
    const output = badgeAsButtonSource();
    expect(output).not.toContain('<button');
    expect(output).not.toContain('style=');
    expect(output).not.toMatch(/tab[iI]ndex/);
  });
});

describe('AsLink', () => {
  it('a etiqueta é filha direta do link, que é o que a regra de hover exige', () => {
    const output = badgeAsLinkSource();
    expect(output).toMatch(/<a href="#">\s*<Badge variant="info">Design<\/Badge>\s*<\/a>/);
    expect(output).not.toMatch(/tab[iI]ndex/);
  });
});

describe('construtores com rótulo (docs page)', () => {
  it('o card da docs page recebe o rótulo do conteúdo sem mudar o markup', () => {
    expect(badgeWithIconSnippet({ label: 'Ativo' })).toBe(badgeWithIconSource());
    expect(badgeWithCounterSnippet({ variant: 'destructive', label: 'Urgente', count: '12' })).toBe(
      badgeWithCounterSource(),
    );
    expect(
      badgeAsButtonSnippet({ label: 'Design', accessibleName: 'Filtrar por Design' }),
    ).toBe(badgeAsButtonSource());
    expect(badgeAsLinkSnippet({ label: 'Design' })).toBe(badgeAsLinkSource());
  });

  it('o rótulo traduzido entra no lugar do padrão', () => {
    expect(badgeAsButtonSnippet({ label: 'Diseño', accessibleName: 'Filtrar por Diseño' })).toContain(
      '<Button variant="ghost" size="sm" aria-label="Filtrar por Diseño">\n  <Badge variant="info">Diseño</Badge>',
    );
    expect(badgeAsLinkSnippet({ label: 'Diseño' })).toContain('<Badge variant="info">Diseño</Badge>');
    expect(badgeWithIconSnippet({ label: 'Status' })).toContain('\n  Status\n</Badge>');
  });
});

describe('todas as stories', () => {
  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of [
      badgeDefaultSource,
      badgeDestructiveSource,
      badgeSemanticsSource,
      badgeWithIconSource,
      badgeWithCounterSource,
      badgeAsButtonSource,
      badgeAsLinkSource,
    ]) {
      expect(fn()).not.toContain('fixtures');
      expect(fn()).not.toContain('args.');
    }
  });
});

/** Rótulos do conteúdo compartilhado — a fonte que story e construtor leem. */
const LABELS = badgeTranslations['pt-BR'].demonstration.labels;

/** Os arquivos de story, como texto: cada story tem de ligar a PRÓPRIA transform. */
const stories = import.meta.glob<string>('./badge*.stories.tsx', {
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

  // Cada linha é: story, o construtor que ela declara, e o trecho que o snippet
  // precisa conter — o MESMO texto e a MESMA variante que o `render` monta.
  const pairs: Array<[string, string, () => string, string]> = [
    ['Default', 'badgeDefaultSource', badgeDefaultSource, `<Badge>${LABELS.defaultLabel}</Badge>`],
    [
      'Destructive',
      'badgeDestructiveSource',
      badgeDestructiveSource,
      `<Badge variant="destructive">${LABELS.destructiveLabel}</Badge>`,
    ],
    ['WithIcon', 'badgeWithIconSource', badgeWithIconSource, LABELS.statusLabel],
    ['WithCounter', 'badgeWithCounterSource', badgeWithCounterSource, LABELS.destructiveLabel],
    [
      'AsButton',
      'badgeAsButtonSource',
      badgeAsButtonSource,
      `<Badge variant="info">${LABELS.categoryLabel}</Badge>`,
    ],
    [
      'AsLink',
      'badgeAsLinkSource',
      badgeAsLinkSource,
      `<Badge variant="info">${LABELS.categoryLabel}</Badge>`,
    ],
  ];

  for (const [story, builder, fn, fragmento] of pairs) {
    it(`${story}: o snippet traz o texto e a variante que a story renderiza`, () => {
      expect(fn()).toContain(fragmento);
      const block = storyBlock(story);
      expect(block, `a story ${story} não foi encontrada`).not.toBe('');
      expect(block).toContain(`transform: ${builder}`);
    });
  }

  it('Semantics traz as cinco variantes, cada uma com o rótulo que a story mostra', () => {
    const code = badgeSemanticsSource();
    expect(code).toContain(`<Badge>${LABELS.defaultLabel}</Badge>`);
    expect(code).toContain(`<Badge variant="destructive">${LABELS.destructiveLabel}</Badge>`);
    expect(code).toContain(`<Badge variant="warning">${LABELS.warningLabel}</Badge>`);
    expect(code).toContain(`<Badge variant="success">${LABELS.successLabel}</Badge>`);
    expect(code).toContain(`<Badge variant="info">${LABELS.infoLabel}</Badge>`);
    expect(storyBlock('Semantics')).toContain('transform: badgeSemanticsSource');
  });

  it('toda story declara a própria transform, sem herdar a do meta', () => {
    // Herança acerta por coincidência: no dia em que o `meta` trocar de
    // transform, a story que não declara a sua publica outro exemplo em
    // silêncio — e nada compara o painel com a tela.
    for (const story of STORIES) {
      const block = storyBlock(story);
      expect(block, `a story ${story} não foi encontrada`).not.toBe('');
      expect(block, `${story} herda a transform do meta`).toMatch(/source:\s*\{\s*transform:/);
    }
  });

  it('o rótulo sai do conteúdo compartilhado, e não de um literal no construtor', () => {
    // Story e construtor leem o MESMO bloco do JSON: é o que impede o painel de
    // envelhecer sozinho no dia em que o texto do exemplo mudar.
    expect(badgeDefaultSource()).toContain(LABELS.defaultLabel);
    expect(badgeDestructiveSource()).toContain(LABELS.destructiveLabel);
    expect(badgeWithIconSource()).toContain(LABELS.statusLabel);
    expect(badgeAsButtonSource()).toContain(LABELS.categoryFilterLabel);
    expect(badgeAsLinkSource()).toContain(LABELS.categoryLabel);
  });
});

describe('Playground: o painel nunca inventa texto que a tela não mostra', () => {
  it('control esvaziado deixa a etiqueta vazia no painel, como no render', () => {
    // O `childText` compartilhado cairia em "Novo" aqui, e o render mostraria
    // uma etiqueta VAZIA — painel e tela dizendo coisas diferentes.
    for (const empty of ['', '   ', '\n\t']) {
      const output = badgeSource(undefined, { args: { children: empty } });
      expect(output, `control ${JSON.stringify(empty)}`).toContain('<Badge></Badge>');
      expect(output, `control ${JSON.stringify(empty)}`).not.toContain(LABELS.defaultLabel);
    }
  });

  it('control ausente continua caindo no padrão do meta', () => {
    expect(badgeSource(undefined, { args: {} })).toContain(`<Badge>${LABELS.defaultLabel}</Badge>`);
    expect(badgeSource()).toContain(`<Badge>${LABELS.defaultLabel}</Badge>`);
  });

  it('o texto do control entra aparado, e não com o espaço em volta', () => {
    expect(badgeSource(undefined, { args: { children: '  Rascunho  ' } })).toContain(
      '<Badge>Rascunho</Badge>',
    );
  });
});
