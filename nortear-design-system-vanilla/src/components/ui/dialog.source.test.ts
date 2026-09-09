import { describe, expect, it } from 'vitest';
import {
  dialogWithBodyScrollableSnippet,
  dialogWithFormSnippet,
  dialogHeadingH3Source,
  dialogSnippet,
  dialogSource,
  dialogSourceWith,
} from './dialog.source';

describe('dialogSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = dialogSnippet();
    expect(code).toContain("import { createDialog } from '@/components/ui/dialog';");
    expect(code).toContain('createDialog({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('aria-modal');
  });

  it('o nome do diálogo sai do título, e não de um apelido inventado', () => {
    // A fábrica não tem opção de nome acessível: `aria-labelledby` aponta para o
    // título, e é ele o nome. Um `ariaLabel` no snippet seria API que não existe.
    const code = dialogSnippet({ title: 'Editar perfil' });
    expect(code).toContain("title: 'Editar perfil'");
    expect(code).not.toContain('ariaLabel');
    expect(code).not.toContain('aria-label');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = dialogSnippet();
    // O X do canto é desenhado por padrão, e o diálogo não avisa ninguém a menos
    // que peçam.
    expect(code).not.toContain('showCloseButton');
    expect(code).not.toContain('onOpenChange');
    expect(code).not.toContain('headerHidden');
    // `default` é a ênfase padrão do botão.
    expect(code).not.toContain("variant: 'default'");
  });

  it('mostra as opções quando a story as usa', () => {
    const code = dialogSnippet({
      showCloseButton: false,
      footer: [
        { label: 'Cancelar', variant: 'outline' },
        { label: 'Remover', variant: 'destructive' },
      ],
    });
    expect(code).toContain('showCloseButton: false');
    expect(code).toContain("createButton({ variant: 'destructive', label: 'Remover' })");
  });

  it('lista vazia de ações é diálogo SEM rodapé, e não rodapé vazio', () => {
    const code = dialogSnippet({ footer: [] });
    expect(code).not.toContain('footer');
  });

  it('as ações saem como lista, e não embrulhadas num elemento', () => {
    // Quem faz o arranjo é `.nds-dialog-footer`, e para isso os botões precisam
    // ser filhos DIRETOS dele.
    const code = dialogSnippet();
    expect(code).toContain('footer: [');
    expect(code).toContain("createButton({ variant: 'outline', label: 'Cancelar' })");
  });

  it('não vaza helper de story', () => {
    const code = dialogSnippet();
    expect(code).not.toContain('makeFooter');
    expect(code).not.toContain('makeBody');
    expect(code).not.toContain('buildField');
    expect(code).not.toContain('buildPlayground');
    expect(code).not.toContain('abrirNaMontagem');
  });

  it('ignora um callback que não seja escrito como texto', () => {
    // `ctx.args` chega do Storybook, e o control de callback do Playground é um
    // espião de teste: interpolá-lo despejaria o corpo do mock no snippet.
    const code = dialogSnippet({ onOpenChange: (() => {}) as unknown as string });
    expect(code).not.toContain('onOpenChange');
  });

  it('mostra o callback quando ele vem escrito', () => {
    const code = dialogSnippet({ onOpenChange: '(aberto) => registrar(aberto)' });
    expect(code).toContain('onOpenChange: (aberto) => registrar(aberto)');
  });
});

describe('dialogSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = dialogSource('<div data-slot="dialog-content">', {});
    const withArgs = dialogSource('<div data-slot="dialog-content">', {
      args: { triggerLabel: 'Remover item', showCloseButton: false },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("label: 'Remover item'");
    expect(withArgs).toContain('showCloseButton: false');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(dialogSource('<div role="dialog" aria-modal="true">', {})).not.toContain('role="dialog"');
  });
});

describe('dialogSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = dialogSourceWith({ title: 'Remover item da lista?', footer: [] });
    const code = transform('', { args: { title: 'Editar perfil' } });
    expect(code).toContain("title: 'Remover item da lista?'");
    expect(code).not.toContain('footer');
  });
});

describe('dialogHeadingH3Source', () => {
  it('imprime o nível do título que a story pede', () => {
    expect(dialogHeadingH3Source('', {})).toContain('titleLevel: 3');
  });

  it('e o nível padrão continua fora do snippet', () => {
    // A fábrica assume `2`. Repetir o padrão ensinaria ruído e apagaria a
    // informação de que existe um padrão — é a mesma regra do `showCloseButton`.
    expect(dialogSnippet()).not.toContain('titleLevel');
    expect(dialogSnippet({ titleLevel: 2 })).not.toContain('titleLevel');
  });
});

describe('dialogComFormularioSnippet', () => {
  it('constrói o corpo com a fábrica de campo, e não com rótulo e controle soltos', () => {
    // `createFormField` é quem fecha o par rótulo ↔ controle e gera o id que
    // falta; um `<label>` cru pareceria igual e não faria nada disso.
    const code = dialogWithFormSnippet({
      fields: [{ label: 'Nome', value: 'Maria Souza' }],
    });
    expect(code).toContain("import { createFormField } from '@/components/ui/form';");
    expect(code).toContain("label: 'Nome'");
    expect(code).toContain("input: createInput({ value: 'Maria Souza' })");
    expect(code).toContain('content: formulario');
    expect(code).not.toContain('createLabel');
    expect(code).not.toContain('buildField');
  });

  it('o rodapé é montado DENTRO do form, e não pela opção da fábrica (PRD D10)', () => {
    // `type: 'submit'` fora do `<form>` é botão inerte, e o snippet é o que se
    // copia. A asserção é de ORDEM — o rodapé é anexado ao formulário ANTES de
    // o formulário entrar em `content` —, e junto vem a ausência da opção
    // `footer`, que é o que punha o rodapé como irmão do corpo.
    const code = dialogWithFormSnippet();
    const appendAt = code.indexOf('formulario.appendChild(footerEl);');
    const callAt = code.indexOf('content: formulario');
    expect(appendAt).toBeGreaterThan(-1);
    expect(callAt).toBeGreaterThan(appendAt);
    expect(code).toContain("footerEl.className = 'nds-dialog-footer';");
    expect(code).toContain("createButton({ label: 'Salvar alterações', type: 'submit' })");
    // A opção `footer` da fábrica não pode aparecer: ela anexa como IRMÃO do
    // corpo, fora do formulário.
    expect(code).not.toContain('footer: [');
  });

  it('omite o tipo quando ele já é o padrão do controle', () => {
    // A sonda é a linha do CONTROLE, e não o snippet inteiro: desde que o rodapé
    // passou a ser montado dentro do form (D10) existe um `type: 'submit'`
    // legítimo no snippet, e um `not.toContain('type:')` solto reprovaria por
    // causa dele — medindo o oposto do que esta asserção quer dizer.
    expect(dialogWithFormSnippet({ fields: [{ label: 'Nome', type: 'text' }] })).toContain(
      'input: createInput({  }),',
    );
    expect(
      dialogWithFormSnippet({ fields: [{ label: 'E-mail', type: 'email' }] }),
    ).toContain("input: createInput({ type: 'email' }),");
  });
});

describe('dialogComCorpoRolavelSnippet', () => {
  it('mostra a classe de rolagem e a costura de teclado que ela exige', () => {
    const code = dialogWithBodyScrollableSnippet({ paragrafos: 12 });
    expect(code).toContain('nds-dialog-body-scroll');
    expect(code).toContain("corpo.setAttribute('role', 'group')");
    expect(code).toContain('corpo.tabIndex = 0');
    expect(code).toContain("corpo.setAttribute('aria-label', 'Termos de uso')");
    expect(code).toContain('i <= 12');
  });

  it('continua sendo a chamada da fábrica, e não o painel renderizado', () => {
    const code = dialogWithBodyScrollableSnippet();
    expect(code).toContain('createDialog({');
    expect(code).not.toContain('data-slot=');
  });
});

describe('rota de overlay rolando — RETIRADA (PRD D7)', () => {
  it('nenhum snippet liga a opção scroll nem cita as classes que saíram', () => {
    // A rota saiu em 2026-09-08: a fábrica não tem mais a opção, e dialog.css
    // não declara mais o par de classes. O snippet é o que se copia, então a
    // guarda é sobre a AUSÊNCIA — foi por sobrevivência silenciosa que as duas
    // rotas circularam sob o mesmo nome em cinco stacks.
    const todos = [
      dialogSnippet(),
      dialogWithFormSnippet(),
      dialogWithBodyScrollableSnippet(),
    ];
    for (const code of todos) {
      expect(code).not.toContain('scroll: true');
      expect(code).not.toContain('nds-dialog-overlay-scroll');
      expect(code).not.toContain('nds-dialog-content-scroll');
    }
  });
});
