import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, expect, waitFor } from 'storybook/test';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { TriangleAlert } from 'lucide-vue-next';
import {
  alertDialogSource,
  alertDialogClassNameExtraSource,
  alertDialogWithIconSource,
  alertDialogDescriptionLongaSource,
  alertDialogDestructiveSource,
  alertDialogHeadingH3Source,
  alertDialogNeutralSource,
  alertDialogNoDescriptionSource,
} from './alert-dialog.source';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

/**
 * Rótulos: saem do MESMO `translations.json` que a docs page lê, onde cada
 * chave existe nos três idiomas. A story é fixture e fica presa a pt-BR de
 * propósito — quem resolve o idioma de quem lê é a docs page, e uma play que
 * dependesse do seletor procuraria um nome diferente a cada rodada.
 */
const L = alertDialogTranslations['pt-BR'].demonstration.labels;
const ACTION_NAME = new RegExp(`^${L.action}$`, 'i');
const CANCEL_NAME = new RegExp(`^${L.cancel}$`, 'i');

// Em escopo de módulo pela mesma razão dos spies das stories de estado: o
// `setup()` só devolve bindings para o template, e a play precisa da mesma
// referência para tirar a descrição com o painel aberto.
const longDescriptionShown = ref(true);

// As oito stories abaixo NÃO são composições, e por isso não moram em
// -compositions: composição é um arranjo que resolve um caso de uso, e o que
// há aqui são as formas que um único componente assume. A ORDEM de export é a
// da barra lateral, e é a mesma nas cinco stacks: Destructive e Neutral (as
// duas linhas de `variants.items` do conteúdo compartilhado); WithMedia e
// WithoutDescription (peças opcionais da anatomia); LongDescription,
// Responsive e ExtraClass (robustez, ponto de quebra e extensibilidade); e
// HeadingH3 (nível do título). A docs page é a prova: ela tem seção de
// Variantes e NÃO tem seção de Composições, nem entrada `nav.compositions`.
const meta = {
  title: 'Components/Overlay/AlertDialog/Variants',
  component: AlertDialog,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('alertDialog'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // A canônica: a confirmação destrutiva sem mídia. Cada story que
      // acrescenta algum trecho (ícone, classe, nível) declara o seu.
      source: { transform: alertDialogSource },
      description: {
        component:
          'As formas que o AlertDialog assume: confirmação destrutiva e neutra, peças opcionais (mídia e descrição), descrição longa, layout responsivo, classe extra e nível do título.',
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  TriangleAlert,
};

export const Destructive: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // A ausência do bloco de mídia É o assunto aqui: a severidade vem só das
      // variantes do gatilho e da ação.
      source: { transform: alertDialogDestructiveSource },
      description: {
        story:
          'Action e trigger usam a variante destructive do Button. Use para ações irreversíveis.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">${L.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>${L.title}</AlertDialogTitle>
            <AlertDialogDescription>${L.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive">${L.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    // A entrada do painel é animada (opacidade 0 → 1). Sem waitFor a asserção
    // roda no primeiro quadro e reprova um elemento que ainda vai aparecer.
    await waitFor(() => expect(dialog).toBeVisible());

    const action = within(dialog).getByRole('button', { name: ACTION_NAME });
    await expect(action).toHaveClass('nds-button-destructive');

    // O gatilho fica sob aria-hidden/inert com o diálogo aberto, então sai das
    // queries por role — buscamos pelo slot. Sem esta parte a story verificava
    // metade do que a própria descrição promete.
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-slot="alert-dialog-trigger"]',
    );
    await expect(trigger).not.toBeNull();
    await expect(trigger).toHaveTextContent(L.triggerLabel);
    await expect(trigger).toHaveClass('nds-button-destructive');

    // O nome acessível do diálogo vem do título: sem ele o leitor anuncia
    // "diálogo" e nada mais.
    await expect(dialog).toHaveAccessibleName(L.title);

    // Cancel em outline é a hierarquia: uma ação destrutiva e uma saída neutra.
    const cancel = within(dialog).getByRole('button', { name: CANCEL_NAME });
    await expect(cancel).toHaveClass('nds-button-outline');

    // Guideline: Cancel sempre antes de Action no DOM.
    const labels = within(dialog)
      .getAllByRole('button')
      .map((b) => b.textContent?.trim());
    await expect(labels).toEqual([L.cancel, L.action]);
  },
};

export const Neutral: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // Nenhuma variante destrutiva em lugar nenhum: é o contraste com a
      // confirmação destrutiva que a story ensina.
      source: { transform: alertDialogNeutralSource },
      description: {
        story:
          'Action com tokens padrão do Button. Use para confirmações não destrutivas (publicar, enviar, arquivar).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="outline">${L.neutralTriggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>${L.neutralTitle}</AlertDialogTitle>
            <AlertDialogDescription>${L.neutralDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction>${L.neutralAction}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    // A entrada do painel é animada (opacidade 0 → 1). Sem waitFor a asserção
    // roda no primeiro quadro e reprova um elemento que ainda vai aparecer.
    await waitFor(() => expect(dialog).toBeVisible());

    const action = within(dialog).getByRole('button', {
      name: new RegExp(`^${L.neutralAction}$`, 'i'),
    });
    // A severidade vem do Button: na composição neutra a ação fica na variante
    // PADRÃO — não basta não ser destrutiva, tem de ser a que o conteúdo
    // compartilhado nomeia (`variants.items.default`).
    await expect(action).toHaveClass('nds-button-default');
    await expect(action).not.toHaveClass('nds-button-destructive');

    // O gatilho neutro fica no contorno: nada nesta composição anuncia risco.
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-slot="alert-dialog-trigger"]',
    );
    await expect(trigger).toHaveClass('nds-button-outline');

    const labels = within(dialog)
      .getAllByRole('button')
      .map((b) => b.textContent?.trim());
    await expect(labels).toEqual([L.cancel, L.neutralAction]);
  },
};

export const WithMedia: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      // O bloco de mídia É o assunto, e a canônica do meta não o tem.
      source: { transform: alertDialogWithIconSource },
      description: {
        story:
          'Bloco de mídia no topo do header. No mobile é a CAIXA do ícone que centraliza, e ela volta à esquerda a partir de 40rem; o texto do header já centraliza no mobile com ou sem ela.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">${L.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <TriangleAlert aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>${L.title}</AlertDialogTitle>
            <AlertDialogDescription>${L.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive">${L.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());

    const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
    await expect(media).toHaveClass('nds-alert-dialog-media');

    // a mídia precisa ser o PRIMEIRO filho do header: o leitor de tela chega ao
    // título logo em seguida (o :has() da folha a acharia em qualquer posição)
    const header = dialog.querySelector('[data-slot="alert-dialog-header"]');
    await expect(header?.firstElementChild).toBe(media);
    await expect(media?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
};

// testes.accessibility.item8 — a descrição é opcional (anatomy.item6), e o
// caminho sem ela precisa de uma story: enquanto nenhuma omitia, a única prova
// de que o componente aguenta era a assinatura. O que se mede aqui não é a
// ausência do parágrafo — é que o painel deixa de declarar `aria-describedby`
// em vez de apontar para um id que não existe, o que o axe reprova em
// `aria-valid-attr-value` e o leitor de tela anuncia como nada.
export const WithoutDescription: Story = {
  parameters: {
    covers: ['accessibility.item8'],
    docs: {
      // A ausência deliberada da descrição É o assunto, e com ela some também
      // o subcomponente do import.
      source: { transform: alertDialogNoDescriptionSource },
      description: {
        story:
          'Confirmação sem descrição: o título sozinho já diz o que se perde. O painel mantém o nome acessível e fica sem descrição acessível — sem referência pendurada.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">Descartar rascunho</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar rascunho</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive">Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('O painel abre sem descrição e mantém o nome acessível', async () => {
      const dialog = await body.findByRole('alertdialog');
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(
        dialog.querySelector('[data-slot="alert-dialog-description"]'),
      ).toBeNull();
      await expect(dialog).toHaveAccessibleName(/Descartar rascunho/i);
    });

    await step('Nenhum aria-describedby pendurado', async () => {
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).not.toHaveAttribute('aria-describedby');
      await expect(dialog).toHaveAccessibleDescription('');
    });

    await step('As duas saídas continuam presentes e alcançáveis', async () => {
      const dialog = await body.findByRole('alertdialog');
      const scope = within(dialog);
      await expect(scope.getByRole('button', { name: CANCEL_NAME })).toBeInTheDocument();
      await expect(scope.getByRole('button', { name: /^Descartar$/i })).toBeInTheDocument();
    });
  },
};

// testes.visual.item4 — descrição longa (mais de uma linha) sem quebrar o painel.
export const LongDescription: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // O tamanho do texto É o assunto: um resumo de uma linha, como o da do
      // meta, não mostraria o painel crescendo.
      source: { transform: alertDialogDescriptionLongaSource },
      description: {
        story:
          'Descrição com duas frases completas. O painel cresce em altura e a descrição continua sendo a fonte do aria-describedby.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      longDescriptionShown.value = true;
      return { shown: longDescriptionShown };
    },
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">${L.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>${L.title}</AlertDialogTitle>
            <AlertDialogDescription v-if="shown">
              Todos os seus dados, arquivos enviados, integrações ativas e o histórico
              completo de faturamento serão removidos permanentemente dos nossos
              servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança
              fica disponível depois da confirmação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive">${L.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Descrição longa continua ligada por aria-describedby', async () => {
      const dialog = await body.findByRole('alertdialog');
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      );
      await expect(description).not.toBeNull();
      await expect(dialog).toHaveAttribute('aria-describedby', description!.id);
      await expect(dialog).toHaveAccessibleDescription(/nenhuma cópia de segurança/i);
    });

    await step('Descrição ocupa mais de uma linha sem estourar o painel', async () => {
      const dialog = await body.findByRole('alertdialog');
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      )!;
      const lineHeight = parseFloat(getComputedStyle(description).lineHeight);
      await expect(description.getBoundingClientRect().height).toBeGreaterThan(
        lineHeight * 1.5,
      );
      await expect(description.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
    });

    // A razão do registro da descrição (PRD D4): o primitivo guarda o id da
    // descrição para sempre, então a descrição que SAI com o painel aberto
    // deixaria o `aria-describedby` apontando para um nó que não existe mais.
    // Quem desfaz o registro é a própria descrição ao desmontar.
    await step('Descrição removida com o painel aberto: o atributo sai junto, sem id órfão', async () => {
      const dialog = await body.findByRole('alertdialog');
      const id = dialog.getAttribute('aria-describedby');
      await expect(id).toBeTruthy();

      longDescriptionShown.value = false;
      await waitFor(() => expect(dialog).not.toHaveAttribute('aria-describedby'));
      await expect(document.getElementById(id!)).toBeNull();
      await expect(dialog).toHaveAccessibleDescription('');

      // Devolvida, ela volta a nomear a descrição — e a captura sai completa.
      longDescriptionShown.value = true;
      await waitFor(() => expect(dialog).toHaveAttribute('aria-describedby', id!));
      await expect(document.getElementById(id!)).toHaveClass('nds-alert-dialog-description');
    });
  },
};

// testes.visual.item5 — layout responsivo. O empilhamento dos botões vem de
// `flex-direction: column-reverse` abaixo de 40rem (nds/alert-dialog.css), então
// a captura precisa acontecer numa viewport estreita: daí os viewports do
// Chromatic. A play verifica a ordem no DOM, que é o que produz o empilhamento
// (Cancel primeiro no DOM, visualmente abaixo do Action em mobile).
export const Responsive: Story = {
  globals: { viewport: { value: 'mobile1' } },
  parameters: {
    // Os dois sub-componentes que o Figma usa para simular o mobile: o eixo
    // Layout de cada um cobre o que aqui é media query.
    design: [
      figmaDesign('alertDialogHeader', 'Cabeçalho'),
      figmaDesign('alertDialogFooter', 'Rodapé'),
    ],
    covers: ['visual.item5'],
    chromatic: { viewports: [375] },
    docs: {
      // A marcação é a mesma da confirmação destrutiva — o que muda é a largura
      // da tela, que não se escreve no snippet.
      source: { transform: alertDialogDestructiveSource },
      description: {
        story:
          'Abaixo de 40rem o footer empilha os botões em column-reverse e o texto do header centraliza. Acima disso os botões ficam lado a lado, alinhados à direita.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">${L.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>${L.title}</AlertDialogTitle>
            <AlertDialogDescription>${L.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive">${L.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Footer segue a ordem Cancel → Action no DOM', async () => {
      const dialog = await body.findByRole('alertdialog');
      const footer = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-footer"]',
      );
      await expect(footer).not.toBeNull();
      await expect(footer).toHaveClass('nds-alert-dialog-footer');

      // A story fixa a viewport em 320px. Abaixo de 40rem o footer empilha em
      // column-reverse — sem medir isso, a story só DESCREVIA o responsivo.
      await expect(window.matchMedia('(min-width: 40rem)').matches).toBe(false);
      await expect(getComputedStyle(footer!).flexDirection).toBe('column-reverse');
      const labels = Array.from(footer!.querySelectorAll('button')).map((b) =>
        b.textContent?.trim(),
      );
      await expect(labels).toEqual([L.cancel, L.action]);
    });

    await step('Painel respeita a margem lateral em qualquer largura', async () => {
      const dialog = await body.findByRole('alertdialog');
      const rect = dialog.getBoundingClientRect();
      await expect(rect.width).toBeLessThanOrEqual(window.innerWidth);
      await expect(rect.left).toBeGreaterThanOrEqual(0);
    });
  },
};

// A extensibilidade por classe é documentada em props.extensibility, e esta é
// a story que a exercita: antes, a única prova de que a classe chega ao painel
// e ao bloco de mídia era a prosa da docs page.
export const ExtraClass: Story = {
  parameters: {
    // As classes no painel e no bloco de mídia SÃO o assunto; sem elas escritas
    // o exemplo não mostra nada.
    docs: { source: { transform: alertDialogClassNameExtraSource }, description: { story: 'Extensibilidade por classe: o painel recorta o conteúdo no próprio raio e o bloco de mídia deixa de encolher. É o caminho descrito em props.extensibility — o design system não expõe classe utilitária de cor, mas painel e blocos aceitam classes de layout.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">${L.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent class="nds-overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogMedia class="nds-shrink-0">
              <TriangleAlert aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>${L.title}</AlertDialogTitle>
            <AlertDialogDescription>${L.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive">${L.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async () => {
    const dialog = await within(document.body).findByRole('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());
    // Propriedade que o componente NÃO declara: utilities.css é importado antes
    // do CSS do componente, então classe utilitária de mesma especificidade
    // perde para a regra do painel — max-width, padding e cor não são
    // extensíveis por classe. Medido: nds-max-w-sm deixava o painel em 512px.
    await expect(getComputedStyle(dialog).overflow).toBe('hidden');
    const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
    await expect(media).toHaveClass('nds-alert-dialog-media');
    await expect(getComputedStyle(media as HTMLElement).flexShrink).toBe('0');
  },
};

// O nível do cabeçalho do título é escolha de quem monta a PÁGINA, e não do
// componente: o painel entra numa hierarquia que já existe. A capacidade está
// no primitivo desde 2026-09-08 e nenhuma story a exercitava — o que significa
// que nada impedia uma regressão de voltar a cravar o nível.
export const HeadingH3: Story = {
  parameters: {
    covers: ['accessibility.item2', 'accessibility.item9'],
    docs: {
      // O nível É o assunto: a transform do meta mostra o padrão, que é
      // justamente o que esta story não usa.
      source: { transform: alertDialogHeadingH3Source },
      description: {
        story:
          'Painel aberto de dentro de uma página cuja seção já está em h2: o título entra como h3 e continua a hierarquia em vez de repeti-la. Trocar a tag não pode romper o aria-labelledby que dá nome ao painel.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">${L.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle as="h3">${L.title}</AlertDialogTitle>
            <AlertDialogDescription>${L.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive">${L.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ step }) => {
    const p = await within(document.body).findByRole('alertdialog');

    await step('O título vira h3 sem soltar o nome acessível do painel', async () => {
      const id = p.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      const heading = document.getElementById(id!);
      await expect(heading).not.toBeNull();
      await expect(heading!.tagName).toBe('H3');
      await expect(heading!.classList.contains('nds-alert-dialog-title')).toBe(true);
      await expect(p).toHaveAccessibleName(heading!.textContent!.trim());
    });
  },
};
