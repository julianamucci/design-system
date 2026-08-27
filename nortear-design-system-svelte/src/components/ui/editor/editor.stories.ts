import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn } from 'storybook/test';
import { Editor } from './index';
import EditorDocs from '@/components/docs/EditorDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { editorSource } from './editor.source';
import {
  CONTENTS,
  LABELS,
  editorRoot,
  openRow,
  closeRow,
  imageFile,
  rowIsPainted,
  selectInlineMath,
  settle,
  tokenColor,
  tokenSize,
  waitForAttribute,
  waitForFocus,
} from './editor.fixtures';

// O docgen está desligado nesta stack (analisar ~450 arquivos `.svelte` a cada
// build custava minutos), então `argTypes` é a ÚNICA fonte da aba API Reference:
// prop que não estiver aqui não aparece na tabela. As que o `render` não
// encaminha entram como documentação, com `control: false`.
const meta: Meta<typeof Editor> = {
  title: 'UI/Editor',
  component: Editor,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(EditorDocs),
      source: { transform: editorSource },
    },
    // `padded`, nunca `centered`: o editor é `width: 100%`, e sob `centered` a
    // caixa encolhe até a largura do texto.
    layout: 'padded',
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'Conteúdo inicial em HTML. É sanitizado antes de chegar à biblioteca.',
      table: { type: { summary: 'string' } },
    },
    editable: {
      control: 'boolean',
      description: 'Quando falso, o conteúdo vira leitura e a barra deixa de agir.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    preset: {
      control: { type: 'inline-radio' },
      options: ['basic', 'advanced'],
      description:
        'Conjunto de botões exposto na barra. Muda o que a barra expõe, não o que o documento aceita.',
      table: {
        type: { summary: '"basic" | "advanced"' },
        defaultValue: { summary: '"advanced"' },
      },
    },
    labels: {
      control: false,
      description:
        'Nome acessível da barra, da área editável, de cada bloco, de cada botão e dos campos de entrada. Não há texto visível de onde deduzi-los.',
      table: { type: { summary: 'EditorLabels' } },
    },
    resolveImage: {
      control: false,
      description:
        'Decide de onde vem o endereço da imagem escolhida. Devolver nulo recusa a inserção, sem erro.',
      table: {
        type: { summary: '(file: File) => Promise<string | null>' },
        defaultValue: { summary: 'arquivo embutido em base64' },
      },
    },
    describeImage: {
      control: false,
      description:
        'Escreve o texto alternativo a partir da imagem. Recebe o arquivo quando existe: imagem colada de outra página chega só como endereço.',
      table: { type: { summary: '(file: File | null, src: string) => Promise<string | null>' } },
    },
    onchange: {
      control: false,
      description:
        'Disparado a cada mudança do conteúdo, com o HTML atual. Movimento de cursor não dispara.',
      table: { type: { summary: '(html: string) => void' } },
    },
    class: {
      control: false,
      description: 'Classes extras na moldura.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    content: CONTENTS.playground,
    editable: true,
    preset: 'advanced',
    onchange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof Editor>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'functional.item5',
      'functional.item6',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'visual.item2',
    ],
  },
  render: (args) => ({
    Component: Editor,
    props: {
      content: args.content,
      editable: args.editable,
      preset: args.preset,
      onchange: args.onchange,
      labels: LABELS,
      class: 'nds-w-full',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = editorRoot(canvasElement);

    // A play parte de um documento CONHECIDO, escrito por ela: o painel
    // Interactions reexecuta no mesmo DOM, sem remontar, e sem este reinício a
    // segunda rodada acharia a fórmula que a primeira inseriu.
    root.editor.commands.setContent('<p>massa e energia</p>');

    await step('accessibility.item1 — a barra se anuncia, e cada bloco tem nome próprio', async () => {
      await expect(canvas.getByRole('toolbar', { name: LABELS.toolbar })).toBeInTheDocument();
      for (const name of [LABELS.groups.marks, LABELS.groups.headings, LABELS.groups.lists]) {
        await expect(canvas.getByRole('group', { name })).toBeInTheDocument();
      }
    });

    await step('accessibility.item2 — a área editável tem nome acessível próprio', async () => {
      // A lib põe `role="textbox"` no elemento editável, e campo com papel de
      // campo e sem nome é violação de `aria-input-field-name`. Não há rótulo
      // visível a que apontar: a moldura inteira é o campo.
      const field = canvas.getByRole('textbox', { name: LABELS.editorField });
      await expect(field).toHaveClass('ProseMirror');
    });

    await step('functional.item2 · accessibility.item3 — uma parada só, e as setas ATRAVESSAM os grupos', async () => {
      const boldButton = canvas.getByRole('button', { name: LABELS.actions.bold });
      const italicButton = canvas.getByRole('button', { name: LABELS.actions.italic });
      boldButton.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(italicButton).toHaveFocus();
      await expect(italicButton.tabIndex).toBe(0);
      await expect(boldButton.tabIndex).toBe(-1);

      // O salto que importa: do último botão do bloco de marcas para o primeiro
      // do bloco de títulos. É por isso que os blocos abrem mão do teclado — com
      // `role="toolbar"` neles, a navegação morreria na borda do primeiro.
      const lastMarkButton = canvas.getByRole('button', { name: LABELS.actions.highlight });
      const headingOne = canvas.getByRole('button', { name: LABELS.actions.h1 });
      lastMarkButton.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(headingOne).toHaveFocus();

      // Volta ao início para que a rodada seguinte encontre o mesmo estado.
      await userEvent.keyboard('{Home}');
      await expect(boldButton).toHaveFocus();
    });

    await step('functional.item1 — os botões refletem o estado do EDITOR, não o próprio clique', async () => {
      const boldButton = canvas.getByRole('button', { name: LABELS.actions.bold });
      // Sem clique nenhum: a marca é ligada pela instância, e o botão tem de
      // acender. É o que distingue uma barra presa ao editor de uma com estado
      // próprio.
      //
      // A espera é de RELÓGIO: a asserção de `expect` é avaliada ANTES do
      // `await`, e a barra só repinta no ciclo seguinte. Sem o laço, o teste
      // media o estado de antes do comando.
      root.editor.chain().selectAll().setBold().run();
      await waitForAttribute(boldButton, 'aria-pressed', 'true');
      root.editor.chain().selectAll().unsetBold().run();
      await waitForAttribute(boldButton, 'aria-pressed', 'false');
    });

    await step('Título é escolha única: ligar o H2 desliga o H1', async () => {
      const h1 = canvas.getByRole('button', { name: LABELS.actions.h1 });
      const h2 = canvas.getByRole('button', { name: LABELS.actions.h2 });
      // CURSOR, não `selectAll`. A barra reflete o bloco onde o cursor está, e
      // `selectAll` abrange também o parágrafo vazio que a lib mantém no fim do
      // documento: com dois blocos de tipos diferentes na seleção, `isActive`
      // responde falso — medido, com o HTML já em `<h1>`.
      root.editor.chain().setTextSelection(2).setHeading({ level: 1 }).run();
      await waitForAttribute(h1, 'aria-pressed', 'true');
      await expect(h2).toHaveAttribute('aria-pressed', 'false');

      root.editor.chain().setTextSelection(2).setHeading({ level: 2 }).run();
      await waitForAttribute(h2, 'aria-pressed', 'true');
      await expect(h1).toHaveAttribute('aria-pressed', 'false');

      root.editor.chain().setTextSelection(2).setParagraph().run();
      await waitForAttribute(h2, 'aria-pressed', 'false');
    });

    await step('visual.item2 — citação, bloco de código e lista de tarefas se distinguem do texto comum', async () => {
      root.editor.commands.setContent(
        '<blockquote><p>citação</p></blockquote><pre><code>codigo()</code></pre>',
      );

      const primaryColor = tokenColor(root, '--primary');
      const mutedColor = tokenColor(root, '--muted');

      const quote = root.querySelector('blockquote') as HTMLElement;
      const quoteStyle = getComputedStyle(quote);
      // A barra lateral é o sinal, e é ELA que carrega a cor da marca — o texto
      // fica em --foreground, porque cor semântica em texto corrido não alcança
      // os 4.5:1 que texto corrido exige.
      await expect(quoteStyle.borderInlineStartWidth).not.toBe('0px');
      await expect(quoteStyle.borderInlineStartColor).toBe(primaryColor);

      const block = root.querySelector('pre') as HTMLElement;
      await expect(getComputedStyle(block).backgroundColor).toBe(mutedColor);
      // O <code> de dentro não repete o fundo: a lib sempre escreve
      // <pre><code>, e dois realces encaixados apareceriam um dentro do outro.
      const innerCode = block.querySelector('code') as HTMLElement;
      await expect(getComputedStyle(innerCode).backgroundColor).toBe('rgba(0, 0, 0, 0)');

      root.editor.commands.setContent('<p>massa e energia</p>');
      const taskButton = canvas.getByRole('button', { name: LABELS.actions.taskList });
      root.editor.chain().setTextSelection(2).toggleTaskList().run();
      await waitForAttribute(taskButton, 'aria-pressed', 'true');
      // A caixa é do navegador, e é ela que marca — o marcador de lista sai de
      // cena para não haver dois sinais para a mesma coisa.
      const listItem = root.querySelector('ul[data-type="taskList"] li') as HTMLElement;
      await expect(listItem.querySelector('input[type="checkbox"]')).toBeInTheDocument();
      await expect(
        getComputedStyle(listItem.parentElement as HTMLElement).listStyleType,
      ).toBe('none');
    });

    await step('Título, link, código e divisória saem na escala do sistema', async () => {
      root.editor.commands.setContent(
        '<h1>título</h1>'
          + '<p>texto com <a href="https://exemplo.com">link</a> e <code>trecho</code>.</p>'
          + '<hr>'
          + '<ul><li>item</li></ul>',
      );

      // O que se compara é com o TOKEN, não com um número escrito à mão: número
      // à mão passa a mentir no dia em que a escada muda de base, e é a escada
      // que o portão existe para guardar.
      const headingEl = root.querySelector('h1') as HTMLElement;
      await expect(getComputedStyle(headingEl).fontSize).toBe(tokenSize(root, '--text-h1'));

      const link = root.querySelector('a') as HTMLElement;
      const linkStyle = getComputedStyle(link);
      await expect(linkStyle.color).toBe(tokenColor(root, '--primary'));
      // Sublinhado não é enfeite: sem ele a única pista de que há link é a cor,
      // e quem não distingue as duas cores fica sem pista (WCAG 1.4.1).
      await expect(linkStyle.textDecorationLine).toContain('underline');

      const inlineCode = root.querySelector('p code') as HTMLElement;
      await expect(getComputedStyle(inlineCode).backgroundColor).toBe(tokenColor(root, '--muted'));

      const ruleEl = root.querySelector('hr') as HTMLElement;
      await expect(getComputedStyle(ruleEl).borderBlockStartColor).toBe(
        tokenColor(root, '--border'),
      );
    });

    await step('functional.item3 · item4 · item5 — o link só aceita esquema da lista, e vazio desfaz', async () => {
      // Precondição própria: "nenhuma âncora ainda" é o que este passo verifica
      // primeiro, e herdar o estado do vizinho é o mesmo erro que o replay do
      // painel Interactions provoca.
      root.editor.commands.setContent('<p>massa e energia</p>');

      const open = canvas.getByRole('button', { name: LABELS.actions.link });
      await expect(rowIsPainted(root, 'editor-link')).toBe(false);
      await openRow(open);
      await expect(rowIsPainted(root, 'editor-link')).toBe(true);

      const field = canvas.getByRole('textbox', { name: LABELS.fields.link });
      await waitForFocus(field);

      // `javascript:` é o que a lista de esquemas existe para barrar. O campo
      // fica marcado como inválido e a linha NÃO fecha.
      await userEvent.type(field, 'javascript:alert(1){Enter}');
      await waitForAttribute(field, 'aria-invalid', 'true');
      await expect(rowIsPainted(root, 'editor-link')).toBe(true);
      await expect(root.querySelector('a')).toBeNull();

      await userEvent.clear(field);
      root.editor.chain().selectAll().run();
      await userEvent.type(field, 'exemplo.com{Enter}');
      const anchor = root.querySelector('a');
      await expect(anchor).toBeInTheDocument();
      // Endereço sem esquema é o que a pessoa digita; quem completa é a barra.
      await expect(anchor).toHaveAttribute('href', 'https://exemplo.com');
      await settle();
      await expect(rowIsPainted(root, 'editor-link')).toBe(false);
      await expect(open).toHaveFocus();

      // Com o cursor no link, abrir mostra o endereço ATUAL — é o que torna a
      // linha editável em vez de só um formulário de inserção.
      await openRow(open);
      await expect(field).toHaveValue('https://exemplo.com');

      // O botão de tirar só existe quando há link — botão que não faz nada é
      // ruído, e desabilitado seria pior: anuncia a ação e nega em seguida.
      const unlink = canvas.getByRole('button', { name: LABELS.fields.linkRemove });
      await expect(getComputedStyle(unlink).display).not.toBe('none');
      await userEvent.click(unlink);
      await expect(root.querySelector('a')).toBeNull();

      // Sem link no trecho, ele some. A asserção lê o `display` COMPUTADO: o
      // `.nds-button` declara `display: inline-flex`, e declaração de autor
      // vence o `[hidden]` do navegador.
      await openRow(open);
      await expect(getComputedStyle(unlink).display).toBe('none');

      // Apagar o campo e confirmar continua tirando o link — o caminho antigo,
      // que agora é atalho e não a única porta.
      await userEvent.type(field, 'exemplo.com{Enter}');
      await expect(root.querySelector('a')).toBeInTheDocument();
      await openRow(open);
      await userEvent.clear(field);
      await userEvent.keyboard('{Enter}');
      await expect(root.querySelector('a')).toBeNull();
    });

    await step('functional.item6 — a fórmula entra, é renderizada e se ATUALIZA em vez de duplicar', async () => {
      const open = canvas.getByRole('button', { name: LABELS.actions.formula });
      await openRow(open);
      await expect(rowIsPainted(root, 'editor-formula')).toBe(true);

      const field = canvas.getByRole('textbox', { name: LABELS.fields.formula });
      await waitForFocus(field);
      await userEvent.type(field, 'E = mc^2');
      await userEvent.click(canvas.getByRole('button', { name: LABELS.fields.formulaConfirm }));

      const formulas = root.querySelectorAll('[data-type="inline-math"]');
      await expect(formulas).toHaveLength(1);
      await expect(formulas[0]).toHaveAttribute('data-latex', 'E = mc^2');
      // O KaTeX escreve MathML junto do HTML visual — é assim que a fórmula
      // chega ao leitor de tela em vez de virar um amontoado de <span>.
      //
      // A asserção NÃO é `toBeInTheDocument`: `<math>` é `MathMLElement`, e o
      // jest-dom só aceita `HTMLElement` ou `SVGElement` — reprova com "received
      // value must be an HTMLElement", que parece ausência e é tipo.
      const mathml = formulas[0].querySelector('math');
      await expect(mathml).not.toBeNull();
      await expect(mathml?.textContent).toContain('E');

      // A linha fecha e devolve o foco a quem a abriu.
      await settle();
      await expect(rowIsPainted(root, 'editor-formula')).toBe(false);
      await expect(open).toHaveFocus();

      // E o mesmo botão abre e FECHA, sem inserir nada.
      await openRow(open);
      await expect(rowIsPainted(root, 'editor-formula')).toBe(true);
      await closeRow(open);
      await expect(rowIsPainted(root, 'editor-formula')).toBe(false);

      // Fórmula sob o cursor se EDITA, não duplica. O que se vê na tela é o
      // resultado renderizado, então abrir com o LaTeX de volta é o único
      // caminho para corrigir uma.
      selectInlineMath(root);

      await openRow(open);
      await expect(field).toHaveValue('E = mc^2');
      await userEvent.clear(field);
      await userEvent.type(field, 'a^2 + b^2{Enter}');

      const after = root.querySelectorAll('[data-type="inline-math"]');
      await expect(after).toHaveLength(1);
      await expect(after[0]).toHaveAttribute('data-latex', 'a^2 + b^2');
    });

    await step('LaTeX inválido não some: fica visível e marcado como erro', async () => {
      const open = canvas.getByRole('button', { name: LABELS.actions.formula });
      await openRow(open);
      const field = canvas.getByRole('textbox', { name: LABELS.fields.formula });
      // Sem chaves de propósito: no `userEvent.type`, `{` abre descritor de
      // tecla, e um LaTeX cheio de chaves testaria mais a escapagem do teclado
      // sintético que o editor. Comando inexistente erra igual.
      await userEvent.clear(field);
      await userEvent.type(field, '\\comandoquenaoexiste{Enter}');

      const errorNode = root.querySelector('.inline-math-error');
      await expect(errorNode).toBeInTheDocument();
      await expect(errorNode?.textContent).toContain('\\comandoquenaoexiste');
    });

    await step('O padrão embute a imagem, e ela sobrevive à releitura do documento', async () => {
      root.editor.commands.setContent('<p>massa e energia</p>');
      await expect(await root.insertImage(imageFile('ponto.png'))).toBe(true);

      const imageEl = root.querySelector('img') as HTMLImageElement;
      // O resolvedor PADRÃO embute o arquivo. É o que faz o Playground
      // funcionar sem servidor nenhum — e não é o que se leva para produção.
      await expect(imageEl.getAttribute('src')).toContain('data:image/png;base64,');

      // `allowBase64` é FALSE por padrão na lib: sem ligá-lo, o esquema descarta
      // o `src` que não reconhece e a imagem SOME na releitura do documento.
      root.editor.commands.setContent(root.editor.getHTML());
      await expect(root.querySelector('img')).toBeInTheDocument();

      // O que a play deixa é o que a pessoa VÊ ao abrir a story, e é o que a
      // comparação de imagem fotografa.
      root.editor.commands.setContent(CONTENTS.playground);
    });
  },
};
