import { describe, expect, it } from 'vitest';
import {
  alertContrastSource,
  alertNoAnnouncementSource,
  alertWithActionSnippet,
  alertDynamicInsertionSnippet,
  alertSnippet,
  alertSource,
  alertSourceWith,
} from './alert.source';

/**
 * Os arquivos de story como TEXTO.
 *
 * Parte dos casos deste arquivo é sobre o PAR story × snippet, e par só se
 * confere lendo os dois lados: a saída do painel Code não chega ao DOM durante a
 * `play`, então nenhuma suíte de navegador vê a divergência. Mesma forma do
 * `alert.source.test.ts` do angular.
 */
const stories = import.meta.glob<string>(
  [
    './alert.stories.ts',
    './alert-variants.stories.ts',
    './alert-states.stories.ts',
    './alert-compositions.stories.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
);

describe('alertSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = alertSnippet();
    expect(code).toContain("from '@/components/ui/alert';");
    expect(code).toContain('createAlert()');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="alert"');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = alertSnippet();
    expect(code).not.toContain('variant:');
    expect(code).not.toContain('role:');
    expect(code).not.toContain('dismissible');
    expect(code).not.toContain('className');
  });

  it('mostra a variante e a semântica de anúncio quando a story as usa', () => {
    const code = alertSnippet({ variant: 'destructive', role: 'note' });
    expect(code).toContain("variant: 'destructive'");
    expect(code).toContain("role: 'note'");
  });

  it('escolhe o ícone que acompanha a variante', () => {
    expect(alertSnippet()).toContain("createAlertIcon('info')");
    expect(alertSnippet({ variant: 'destructive' })).toContain("createAlertIcon('error')");
    expect(alertSnippet({ variant: 'success' })).toContain("createAlertIcon('success')");
    expect(alertSnippet({ variant: 'warning' })).toContain("createAlertIcon('warning')");
  });

  it('mostra as composições sem ícone e sem título como a story as monta', () => {
    const noIcon = alertSnippet({ icon: false });
    expect(noIcon).not.toContain('createAlertIcon');
    expect(noIcon).not.toContain('createAlertIcon,');

    const noTitle = alertSnippet({ title: '' });
    expect(noTitle).not.toContain('createAlertTitle');
    expect(noTitle).toContain('createAlertDescription({');
  });

  it('o botão de fechar traz o rótulo acessível e o callback, e só quando existe', () => {
    const without = alertSnippet({ dismissLabel: 'Fechar confirmação' });
    expect(without).not.toContain('dismissLabel');

    const withDismiss = alertSnippet({
      dismissible: true,
      dismissLabel: 'Fechar confirmação',
      onDismiss: "() => savePreference('notice-dismissed')",
    });
    expect(withDismiss).toContain('dismissible: true');
    expect(withDismiss).toContain("dismissLabel: 'Fechar confirmação'");
    expect(withDismiss).toContain("onDismiss: () => savePreference('notice-dismissed')");
  });

  it('ignora o callback que a story passa como função de verdade', () => {
    const code = alertSnippet({
      dismissible: true,
      onDismiss: (() => {}) as unknown as string,
    });
    expect(code).toContain('dismissible: true');
    expect(code).not.toContain('onDismiss');
  });

  it('nunca ensina ícone com .nds-icon nem região aria-live', () => {
    const code = alertSnippet();
    expect(code).not.toContain('nds-icon');
    expect(code).not.toContain('aria-live');
  });
});

describe('alertSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = alertSource('<div data-slot="alert">', {});
    const withArgs = alertSource('<div data-slot="alert">', {
      args: { variant: 'success', title: 'Perfil atualizado' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("variant: 'success'");
    expect(withArgs).toContain("createAlertTitle({ text: 'Perfil atualizado', as: 'h4' })");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(alertSource('<div data-slot="alert" role="alert" class="nds-alert">', {})).not.toContain(
      'nds-alert',
    );
  });
});

describe('alertSourceWith', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = alertSourceWith({ variant: 'warning' });
    const code = transform('', { args: { variant: 'destructive' } });
    expect(code).toContain("variant: 'warning'");
    expect(code).not.toContain("variant: 'destructive'");
  });
});

describe('alertWithActionSnippet', () => {
  it('mostra a sub-fábrica do slot de ação, com o botão do design system', () => {
    const code = alertWithActionSnippet({ action: 'Atualizar' });
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain('createAlertAction()');
    expect(code).toContain("createButton({ label: 'Atualizar', variant: 'default', size: 'sm' })");
    expect(code).toContain('alerta.appendChild(action);');
  });

  it('leva a classe do consumidor para a raiz', () => {
    expect(alertWithActionSnippet({ className: 'nds-w-full' })).toContain("className: 'nds-w-full'");
  });

  it('com dismissible, mostra ação e botão de fechar na mesma composição', () => {
    const code = alertWithActionSnippet({ dismissible: true, action: 'Salvar agora' });
    expect(code).toContain('dismissible: true');
    expect(code).toContain('createAlertAction()');
    expect(code).toContain("label: 'Salvar agora'");
  });
});

describe('alertDynamicInsertionSnippet', () => {
  it('mostra a inserção em tempo de execução sem contêiner aria-live', () => {
    const code = alertDynamicInsertionSnippet({ icon: 'success', title: 'Operação concluída' });
    expect(code).not.toContain('aria-live');
    expect(code).toContain('function showResult(): void {');
    expect(code).toContain('  stack.appendChild(alerta);');
    expect(code).toContain("  alerta.appendChild(createAlertIcon('success'));");
  });

  it('publica o GATILHO, a linha dele e o contêiner — a story inteira', () => {
    // O snippet era só a função que cria o alerta: faltava quem a chama. Quem
    // copiava recebia um exemplo que nunca dispara, e a tela mostra o botão.
    const code = alertDynamicInsertionSnippet({
      icon: 'success',
      title: 'Operação concluída',
      description: 'O relatório foi gerado com sucesso.',
    });
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain(
      "createButton({ label: 'Gerar relatório', variant: 'default', size: 'sm', onClick: showResult })",
    );
    // A linha própria do botão e o stack: sem eles o exemplo perde o
    // espaçamento da tela e o botão estica na largura toda.
    expect(code).toContain("const triggerRow = document.createElement('div');");
    expect(code).toContain('stack.appendChild(triggerRow);');
    expect(code).toContain("stack.className = 'nds-stack';");
    expect(code).toContain("stack.dataset.spacing = 'sm';");
  });
});

// ─── Nível do heading do título ──────────────────────────────────────────────

/**
 * O painel Code tem de ENSINAR o nível do título: snippet que publica
 * `createAlertTitle({ text })` sem `as` esconde a decisão atrás do default da
 * fábrica, e o leitor copia um alerta cujo nível ele não escolheu.
 *
 * A varredura é por CHAMADA, não por arquivo: uma forma nova de snippet que
 * monte o título sem nível reprova aqui, que é onde a decisão fica guardada.
 */
function titleCalls(code: string): string[] {
  // Lazy até o primeiro `})`, e não `[^}]*`: o snippet de contraste monta o
  // título com interpolação (`Título ${variant}`), e a chave que FECHA a
  // interpolação fazia a forma antiga não casar nada naquele snippet — e
  // varredura que não casa é varredura que aprova sem medir.
  return code.match(/createAlertTitle\(\{[\s\S]*?\}\)/g) ?? [];
}

describe('nível do heading no snippet', () => {
  it('toda forma de snippet que publica título escreve o nível', () => {
    const forms: Array<[string, string]> = [
      ['alertSnippet', alertSnippet()],
      ['alertSnippet com variante', alertSnippet({ variant: 'destructive', title: 'Erro ao salvar' })],
      ['alertSnippet sem ícone', alertSnippet({ icon: false })],
      ['alertWithActionSnippet', alertWithActionSnippet({ action: 'Atualizar' })],
      [
        'alertWithActionSnippet com dismissible',
        alertWithActionSnippet({ dismissible: true, action: 'Salvar agora' }),
      ],
      [
        'alertDynamicInsertionSnippet',
        alertDynamicInsertionSnippet({ icon: 'success', title: 'Operação concluída' }),
      ],
      ['alertSource', alertSource('', { args: { title: 'Atenção' } })],
      ['alertSourceWith', alertSourceWith({ variant: 'warning' })('', {})],
      ['alertContrastSource', alertContrastSource()],
      ['alertNoAnnouncementSource', alertNoAnnouncementSource()],
    ];

    for (const [name, code] of forms) {
      const calls = titleCalls(code);
      expect(calls.length, `${name}: não publicou chamada de título nenhuma`).toBeGreaterThan(0);
      // TODAS as chamadas, não a primeira: as formas de mais de um alerta
      // publicam dois títulos, e medir só a primeira deixaria a segunda livre
      // para voltar ao default sem nada reprovar.
      for (const call of calls) {
        expect(call, `${name}: título publicado sem nível de heading`).toContain("as: 'h4'");
      }
    }
  });

  it('a composição sem título não publica chamada de título nenhuma', () => {
    // O contrapeso do caso acima: a contagem só tem dentes se a ausência de
    // título de fato zerar a varredura, em vez de o regex nunca casar nada.
    expect(titleCalls(alertSnippet({ title: '' }))).toEqual([]);
  });
});

// ─── O snippet descreve a story INTEIRA ──────────────────────────────────────
//
// Os casos abaixo nasceram das divergências medidas em 2026-09-16, e todas têm a
// mesma raiz: o construtor genérico monta UM alerta, com classe só na raiz, e
// quatro stories mostram mais do que isso. O painel publicava um alerta default
// onde a tela empilha as cinco variantes, perdia o segundo alerta do par de
// anúncio, perdia o botão que dispara a inserção e escrevia a classe do
// consumidor só na raiz — e o Playground trocava um ícone que o render não troca.

describe('alertContrastSource', () => {
  it('empilha as CINCO variantes, com o texto e o contêiner da story', () => {
    const code = alertContrastSource();
    expect(code).toContain(
      "const variants: AlertVariant[] = ['default', 'destructive', 'success', 'warning', 'info'];",
    );
    expect(code).toContain('for (const variant of variants) {');
    // O contêiner é parte do exemplo: sem ele as cinco caixas ficam encostadas.
    expect(code).toContain("stack.className = 'nds-stack';");
    expect(code).toContain("stack.dataset.spacing = 'sm';");
    // Os textos são os que a tela mostra, não os padrões da fábrica.
    expect(code).toContain("createAlertTitle({ text: `Título ${variant}`, as: 'h4' })");
    expect(code).toContain(
      'createAlertDescription({ text: `Texto corrido da variante ${variant}.` })',
    );
    expect(code).not.toContain('Atenção');
    // Sem ícone: o que se mede aqui é texto sobre o fundo da variante.
    expect(code).not.toContain('createAlertIcon');
  });
});

describe('alertNoAnnouncementSource', () => {
  it('mostra o PAR: a nota estática e o alerta que interrompe', () => {
    const code = alertNoAnnouncementSource();
    expect(code).toContain("const noteAlert = createAlert({ role: 'note' });");
    expect(code).toContain("const defaultAlert = createAlert({ variant: 'destructive' });");
    expect(code).toContain("noteAlert.appendChild(createAlertIcon('info'));");
    expect(code).toContain("defaultAlert.appendChild(createAlertIcon('error'));");
    expect(code).toContain('Nota de implementação');
    expect(code).toContain('Falha no envio');
    expect(code).toContain("stack.dataset.spacing = 'md';");
    expect(code).toContain('stack.append(noteAlert, defaultAlert);');
    // O segundo não escreve papel: é ele que mostra o default assertivo.
    expect(code).not.toContain("role: 'alert'");
    expect(code).not.toContain('aria-live');
  });
});

describe('alertWithActionSnippet, com a classe do consumidor', () => {
  it('escreve a classe na raiz E em cada peça, que é o que a story prova', () => {
    const code = alertWithActionSnippet({
      className: 'nds-w-full',
      partClassName: 'nds-w-full',
      actionClassName: 'nds-w-auto',
      action: 'Ação',
      title: 'Classe adicional',
      description: 'A classe do consumidor convive com as do design system.',
    });
    expect(code).toContain("createAlert({ className: 'nds-w-full' })");
    expect(code).toContain(
      "createAlertTitle({ text: 'Classe adicional', as: 'h4', className: 'nds-w-full' })",
    );
    expect(code).toContain(
      "createAlertDescription({ text: 'A classe do consumidor convive com as do design system.', className: 'nds-w-full' })",
    );
    expect(code).toContain("createAlertAction({ className: 'nds-w-auto' })");
  });

  it('sem as classes das peças, nenhuma sobra no snippet', () => {
    // Contrapeso do caso acima: ele passaria com `className` cravado nas
    // sub-fábricas, e então toda story mostraria uma classe que não existe.
    const code = alertWithActionSnippet({ action: 'Atualizar' });
    expect(code).toContain('createAlertAction()');
    expect(code).not.toContain('className');
  });
});

describe('a story mostra o que o painel publica', () => {
  const storyText = (file: string): string => stories[`./${file}.stories.ts`] ?? '';

  it('os quatro arquivos de story foram lidos', () => {
    expect(Object.keys(stories)).toHaveLength(4);
  });

  it('o Playground escolhe o ícone pela VARIANTE, como o snippet', () => {
    // O painel escrevia `createAlertIcon('success')` e o render punha o
    // informativo em toda variante que não fosse `destructive`: o mapa existia
    // só de um lado, e o painel prometia o que a tela não fazia.
    const text = storyText('alert');
    expect(text).toContain('createAlertIcon(variantIcon(args.variant))');
    expect(text).toContain("if (variant === 'destructive') return 'error';");
    expect(text).toContain("if (variant === 'default') return 'info';");
    expect(text).not.toContain("args.variant === 'destructive' ? 'error' : 'info'");
  });

  it('as stories de composição múltipla ligam o construtor da própria forma', () => {
    expect(storyText('alert-variants')).toContain('transform: alertContrastSource');
    expect(storyText('alert-states')).toContain('transform: alertNoAnnouncementSource');
    expect(storyText('alert-states')).toContain('transform: alertDynamicInsertionSourceWith');
    expect(storyText('alert-compositions')).toContain("partClassName: 'nds-w-full'");
    expect(storyText('alert-compositions')).toContain("actionClassName: 'nds-w-auto'");
  });

  it('nenhuma story do alerta herda o snippet do meta', () => {
    // Herança acerta por COINCIDÊNCIA: foi ela que deixou a Contrast publicar um
    // alerta default enquanto a tela empilhava cinco.
    for (const [file, text] of Object.entries(stories)) {
      const declaracoes = [...text.matchAll(/^export const ([A-Z]\w*): Story = \{/gm)];
      expect(declaracoes.length, `${file}: nenhuma story encontrada`).toBeGreaterThan(0);
      declaracoes.forEach((m, i) => {
        const fim = i + 1 < declaracoes.length ? declaracoes[i + 1].index : text.length;
        expect(
          text.slice(m.index, fim),
          `${file} › ${m[1]} herda o snippet do meta`,
        ).toContain('transform:');
      });
    }
  });
});
