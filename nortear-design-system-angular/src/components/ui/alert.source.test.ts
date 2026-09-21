import { describe, expect, it } from 'vitest';
import {
  alertActionAndDismissTemplateSnippet,
  alertAdditionalClassSource,
  alertCompleteSource,
  alertContrastSource,
  alertDefaultSource,
  alertDestructiveSource,
  alertDismissibleByKeyboardSource,
  alertDismissibleSource,
  alertDismissibleTemplateSnippet,
  alertDynamicInsertionSource,
  alertInfoSource,
  alertLayoutWithoutIconSource,
  alertPlaygroundSource,
  alertSuccessSource,
  alertWarningSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertWithIconSource,
  alertWithoutAnnouncementSource,
  alertWithoutIconSource,
  alertWithoutTitleSource,
} from './alert.source';

/**
 * A ausência deste arquivo era o `source_sem_teste` do auditor.
 *
 * A varredura genérica (`source-snippets.test.ts`) prova que o snippet importa o
 * que usa e liga só o que a classe declara. O que ela não prova é o que este
 * arquivo cobra: omitir o valor padrão, ensinar o `@if` sobre o `(dismiss)` — o
 * componente não remove o próprio nó —, não vazar o andaime de remontagem da
 * story e bater com a story ao lado.
 */

/** Os arquivos de story, como texto: cada story tem de ligar o construtor dela. */
const stories = import.meta.glob<string>(
  [
    './alert.stories.ts',
    './alert-variants.stories.ts',
    './alert-states.stories.ts',
    './alert-compositions.stories.ts',
  ],
  {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** O bloco de uma story num arquivo, do `export const Nome` até o próximo export. */
function storyBlock(file: string, name: string): string {
  const text = stories[`./${file}.stories.ts`] ?? '';
  const match = new RegExp(`export const ${name}: Story = \\{([\\s\\S]*?)(?=\\nexport |$)`).exec(text);
  return match?.[1] ?? '';
}

describe('alertPlaygroundSource', () => {
  it('sem args, a anatomia completa e nenhum valor padrão escrito', () => {
    const code = alertPlaygroundSource();
    expect(code).toContain('<div ndsAlert>');
    expect(code).toContain('<svg ndsAlertIcon kind="info"></svg>');
    expect(code).toContain('<h4 ndsAlertTitle>Atenção</h4>');
    expect(code).toContain(
      '<section ndsAlertDescription>Suas alterações serão aplicadas na próxima sessão.</section>',
    );
    expect(code).not.toContain('variant=');
    expect(code).not.toContain('role=');
    expect(code).not.toContain('dismissible');
  });

  it('acompanha os controls', () => {
    const code = alertPlaygroundSource('', {
      args: { variant: 'destructive', role: 'note', title: 'Erro' },
    });
    expect(code).toContain('<div ndsAlert variant="destructive" role="note">');
    expect(code).toContain('<h4 ndsAlertTitle>Erro</h4>');
    // O ícone segue a variante, como a story: com o informativo cravado, o
    // painel ensinava um desenho que a tela não mostrava.
    expect(code).toContain('<svg ndsAlertIcon kind="error"></svg>');
  });

  it('com dismissible, ensina o @if sobre o (dismiss) e declara o signal', () => {
    const code = alertPlaygroundSource('', { args: { dismissible: true } });
    expect(code).toContain('@if (visible()) {');
    expect(code).toContain('(dismiss)="visible.set(false)"');
    expect(code).toContain('readonly visible = signal(true);');
    expect(code).toContain("import { signal } from '@angular/core';");
    // O rótulo padrão não é escrito.
    expect(code).not.toContain('dismissLabel');
  });

  it('ignora o HTML gerado pelo renderer e o espião de ação', () => {
    const code = alertPlaygroundSource('<div data-slot="alert" class="nds-alert">', {
      args: { onDismiss: () => {} },
    });
    expect(code).not.toContain('data-slot');
    expect(code).not.toContain('onDismiss');
  });
});

describe('variantes', () => {
  it('cada variante leva o próprio ícone, e o default não escreve `variant`', () => {
    expect(alertDefaultSource()).not.toContain('variant=');
    expect(alertDestructiveSource()).toContain('<div ndsAlert variant="destructive">');
    expect(alertDestructiveSource()).toContain('kind="error"');
    expect(alertSuccessSource()).toContain('kind="success"');
    expect(alertWarningSource()).toContain('kind="warning"');
    expect(alertInfoSource()).toContain('<div ndsAlert variant="info">');
    expect(alertInfoSource()).toContain('Você pode fixar os filtros mais usados');
  });

  it('o ícone não carrega `.nds-icon` — a folha dimensiona por `.nds-alert > svg`', () => {
    for (const fn of [alertDefaultSource, alertDestructiveSource, alertWithActionAndDismissSource]) {
      expect(fn()).not.toContain('nds-icon');
    }
  });

  it('Dismissible: @if sobre o (dismiss), sem o andaime de remontagem da story', () => {
    const code = alertDismissibleSource();
    expect(code).toContain('@if (visible()) {');
    expect(code).toContain('<div ndsAlert dismissible (dismiss)="visible.set(false)">');
    expect(code).toContain('Preferências salvas');
    expect(code).not.toContain('@for');
    expect(code).not.toContain('instance');
  });

  it('DismissibleByKeyboard: success, rótulo próprio e nenhum handler de tecla', () => {
    const code = alertDismissibleByKeyboardSource();
    expect(code).toContain(
      '<div ndsAlert variant="success" dismissible dismissLabel="Fechar confirmação" (dismiss)="visible.set(false)">',
    );
    expect(code).not.toContain('keydown');
    expect(code).not.toContain('tabindex');
  });

  it('Contrast: cinco alertas sem ícone', () => {
    const code = alertContrastSource();
    expect(code.match(/<div ndsAlert[ >]/g)).toHaveLength(5);
    expect(code).not.toContain('ndsAlertIcon');
    expect(code).not.toContain('NdsAlertIcon');
  });
});

describe('estados', () => {
  it('Complete traz ícone, título e descrição', () => {
    const code = alertCompleteSource();
    expect(code).toContain('ndsAlertIcon');
    expect(code).toContain('ndsAlertTitle');
    expect(code).toContain('ndsAlertDescription');
  });

  it('WithoutTitle: nenhum heading, e o import some junto', () => {
    const code = alertWithoutTitleSource();
    expect(code).not.toMatch(/<h[1-6]/);
    expect(code).not.toContain('NdsAlertTitle');
  });

  it('WithoutIcon: nenhum svg, e o import some junto', () => {
    const code = alertWithoutIconSource();
    expect(code).not.toContain('<svg');
    expect(code).not.toContain('NdsAlertIcon');
  });

  it('WithoutAnnouncement: a nota contrasta com o padrão sem papel escrito', () => {
    const code = alertWithoutAnnouncementSource();
    expect(code).toContain('<div ndsAlert role="note">');
    expect(code).toContain('<div ndsAlert variant="destructive">');
    expect(code).toContain('Falha no envio');
    expect(code).not.toContain('role="alert"');
  });

  it('DynamicInsertion: o alerta surge por @if, sem região aria-live em volta', () => {
    const code = alertDynamicInsertionSource();
    expect(code).toContain('(click)="generated.set(true)"');
    expect(code).toContain('@if (generated()) {');
    expect(code).toContain('readonly generated = signal(false);');
    expect(code).not.toContain('aria-live');
  });
});

describe('composições', () => {
  it('WithAction: o slot próprio com o Button do design system', () => {
    const code = alertWithActionSource();
    expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
    expect(code).toContain('<div ndsAlertAction>');
    expect(code).toContain('<button ndsButton variant="default" size="sm">Atualizar</button>');
  });

  it('AdditionalClass: a classe em cada peça', () => {
    const code = alertAdditionalClassSource();
    expect(code).toContain('<div ndsAlert class="nds-w-full">');
    expect(code).toContain('<h4 ndsAlertTitle class="nds-w-full">');
    expect(code).toContain('<section ndsAlertDescription class="nds-w-full">');
    expect(code).toContain('<div ndsAlertAction class="nds-w-auto">');
  });

  it('WithIcon e WithoutIcon', () => {
    expect(alertWithIconSource()).toContain('<svg ndsAlertIcon kind="info"></svg>');
    expect(alertLayoutWithoutIconSource()).not.toContain('<svg');
  });

  it('WithActionAndDismiss: ação e fechar juntos, com o @if', () => {
    const code = alertWithActionAndDismissSource();
    expect(code).toContain('@if (visible()) {');
    expect(code).toContain('dismissible');
    expect(code).toContain('<button ndsButton variant="default" size="sm">Salvar agora</button>');
    expect(code).toContain('Sessão expira em 5 minutos');
  });
});

describe('snippets de template da docs page', () => {
  it('fechamento sempre com @if, sem envelope de componente', () => {
    for (const code of [alertDismissibleTemplateSnippet(), alertActionAndDismissTemplateSnippet()]) {
      expect(code.startsWith('@if (visible()) {')).toBe(true);
      expect(code).not.toContain('@Component');
    }
  });
});

/**
 * O NÍVEL do título, cobrado nos dois lados.
 *
 * No Angular o nível é o ELEMENTO — não há prop de nível —, então a tag É o
 * ensinamento. Story e snippet abrem num card `h3`, e o título do alerta desce
 * um degrau: `h4`. Sem este bloco o par podia divergir em silêncio (era o que
 * havia: story em `h5`, snippet da docs page em `h4`), porque nenhum compilador
 * lê tag dentro de string de template e a diferença não quebra nada.
 */
describe('o nível do título é h4, e a story mostra o mesmo que o snippet', () => {
  /** A única composição sem heading — declarada para o resto ter de ter título. */
  const SEM_TITULO = ['alertWithoutTitleSource'];

  const builders: Array<[string, () => string]> = [
    ['alertPlaygroundSource', alertPlaygroundSource],
    ['alertDefaultSource', alertDefaultSource],
    ['alertDestructiveSource', alertDestructiveSource],
    ['alertSuccessSource', alertSuccessSource],
    ['alertWarningSource', alertWarningSource],
    ['alertInfoSource', alertInfoSource],
    ['alertDismissibleSource', alertDismissibleSource],
    ['alertDismissibleByKeyboardSource', alertDismissibleByKeyboardSource],
    ['alertContrastSource', alertContrastSource],
    ['alertCompleteSource', alertCompleteSource],
    ['alertWithoutTitleSource', alertWithoutTitleSource],
    ['alertWithoutIconSource', alertWithoutIconSource],
    ['alertWithoutAnnouncementSource', alertWithoutAnnouncementSource],
    ['alertDynamicInsertionSource', alertDynamicInsertionSource],
    ['alertWithIconSource', alertWithIconSource],
    ['alertWithActionSource', alertWithActionSource],
    ['alertAdditionalClassSource', alertAdditionalClassSource],
    ['alertLayoutWithoutIconSource', alertLayoutWithoutIconSource],
    ['alertWithActionAndDismissSource', alertWithActionAndDismissSource],
    ['alertDismissibleTemplateSnippet', alertDismissibleTemplateSnippet],
    ['alertActionAndDismissTemplateSnippet', alertActionAndDismissTemplateSnippet],
  ];

  for (const [name, build] of builders) {
    it(`${name} publica <h4 ndsAlertTitle> e nenhum outro nível`, () => {
      const code = build();
      const aberturas = code.match(/<h[1-6] ndsAlertTitle/g) ?? [];

      if (SEM_TITULO.includes(name)) {
        expect(aberturas).toEqual([]);
        return;
      }

      expect(aberturas.length, `${name} não escreve título nenhum`).toBeGreaterThan(0);
      expect(aberturas.filter((tag) => tag !== '<h4 ndsAlertTitle')).toEqual([]);
      // O fechamento também: `<h4 …></h5>` é HTML que o leitor copiaria quebrado.
      expect((code.match(/<\/h[1-6]>/g) ?? []).filter((tag) => tag !== '</h4>')).toEqual([]);
    });
  }

  it('o Playground mantém o nível com os controls mexidos', () => {
    const code = alertPlaygroundSource('', {
      args: { variant: 'info', title: 'Erro', dismissible: true },
    });
    expect(code).toContain('<h4 ndsAlertTitle>Erro</h4>');
  });

  it('as stories renderizam o mesmo nível que os snippets publicam', () => {
    for (const [file, text] of Object.entries(stories)) {
      // Comentário fora antes de medir: o portão é de MARCAÇÃO, e uma prosa que
      // cite `<h5 ndsAlertTitle>` para explicar a decisão não é defeito.
      const markup = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      const aberturas = markup.match(/<h[1-6] ndsAlertTitle/g) ?? [];
      expect(aberturas.length, `${file} não renderiza título nenhum`).toBeGreaterThan(0);
      expect(
        aberturas.filter((tag) => tag !== '<h4 ndsAlertTitle'),
        `${file} renderiza um nível que o snippet não ensina`,
      ).toEqual([]);
      expect((markup.match(/<\/h[1-6]>/g) ?? []).filter((tag) => tag !== '</h4>')).toEqual([]);
    }
  });
});

describe('cada story liga o próprio construtor', () => {
  const pairs: Array<[string, string, string]> = [
    ['alert', 'Playground', 'alertPlaygroundSource'],
    ['alert-variants', 'Default', 'alertDefaultSource'],
    ['alert-variants', 'Destructive', 'alertDestructiveSource'],
    ['alert-variants', 'Success', 'alertSuccessSource'],
    ['alert-variants', 'Warning', 'alertWarningSource'],
    ['alert-variants', 'Info', 'alertInfoSource'],
    ['alert-variants', 'Dismissible', 'alertDismissibleSource'],
    ['alert-variants', 'DismissibleByKeyboard', 'alertDismissibleByKeyboardSource'],
    ['alert-variants', 'Contrast', 'alertContrastSource'],
    ['alert-states', 'Complete', 'alertCompleteSource'],
    ['alert-states', 'WithoutTitle', 'alertWithoutTitleSource'],
    ['alert-states', 'WithoutIcon', 'alertWithoutIconSource'],
    ['alert-states', 'WithoutAnnouncement', 'alertWithoutAnnouncementSource'],
    ['alert-states', 'DynamicInsertion', 'alertDynamicInsertionSource'],
    ['alert-compositions', 'WithIcon', 'alertWithIconSource'],
    ['alert-compositions', 'WithAction', 'alertWithActionSource'],
    ['alert-compositions', 'AdditionalClass', 'alertAdditionalClassSource'],
    ['alert-compositions', 'WithoutIcon', 'alertLayoutWithoutIconSource'],
    ['alert-compositions', 'WithActionAndDismiss', 'alertWithActionAndDismissSource'],
  ];

  it('os quatro arquivos de story foram lidos', () => {
    expect(Object.keys(stories)).toHaveLength(4);
  });

  for (const [file, story, builder] of pairs) {
    it(`${file} › ${story} → ${builder}`, () => {
      const block = storyBlock(file, story);
      expect(block, `a story ${story} não foi encontrada em ${file}`).not.toBe('');
      expect(block).toContain(`transform: ${builder}`);
    });
  }

  it('a story e o snippet mostram os mesmos textos', () => {
    expect(storyBlock('alert-variants', 'Info')).toContain('Você pode fixar os filtros mais usados');
    expect(storyBlock('alert-variants', 'Dismissible')).toContain('Preferências salvas');
    expect(storyBlock('alert-variants', 'DismissibleByKeyboard')).toContain('Fechar confirmação');
    expect(storyBlock('alert-states', 'WithoutAnnouncement')).toContain('Falha no envio');
    expect(storyBlock('alert-states', 'DynamicInsertion')).toContain('Gerar relatório');
    expect(storyBlock('alert-compositions', 'WithActionAndDismiss')).toContain('Salvar agora');
  });

  it('nenhuma story de alerta envolve o alerta em aria-live', () => {
    expect(Object.values(stories).join('\n')).not.toMatch(/aria-live="/);
  });
});

// ─── O snippet descreve a story INTEIRA, e a story não inventa peça ──────────
//
// Duas divergências medidas em 2026-09-16, nos dois sentidos: o snippet da
// `DynamicInsertion` publicava um botão de tamanho default e nenhum dos dois
// contêineres, e a `Dismissible` RENDERIZAVA um segundo alerta fixo que nem o
// snippet mostrava nem as outras quatro stacks tinham.

describe('DynamicInsertion publica o gatilho, a linha dele e o contêiner', () => {
  it('o botão é `sm` e vem dentro do nds-stack', () => {
    const code = alertDynamicInsertionSource();
    expect(code).toContain('<div class="nds-stack" data-spacing="sm">');
    expect(code).toContain(
      '<button ndsButton variant="default" size="sm" (click)="generated.set(true)">Gerar relatório</button>',
    );
    expect(code).toContain('@if (generated()) {');
  });

  it('a story renderiza o mesmo contêiner e o mesmo tamanho de botão', () => {
    const block = storyBlock('alert-states', 'DynamicInsertion');
    expect(block, 'a story DynamicInsertion não foi encontrada').not.toBe('');
    expect(block).toContain('<div class="nds-stack" data-spacing="sm">');
    expect(block).toContain('size="sm"');
  });
});

describe('Dismissible mostra UM alerta, como as outras quatro stacks', () => {
  /** Sem comentário: a prosa que EXPLICA o alerta retirado não é render. */
  const withoutComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('a story não renderiza um segundo alerta que o snippet não ensina', () => {
    const block = withoutComments(storyBlock('alert-variants', 'Dismissible'));
    expect(block, 'a story Dismissible não foi encontrada').not.toBe('');
    // O render era de uma stack só: um segundo alerta fixo, de papel polido e
    // rótulo próprio, que o painel Code não publicava.
    expect(block).not.toContain('role="status"');
    expect(block).not.toContain('<div ndsAlert');
    // Ele delega ao andaime de remontagem, que é o único alerta da story.
    expect(block).toContain('remountingDismissibleAlert(onDismiss, {');
    expect(alertDismissibleSource()).not.toContain('role="status"');
  });
});
