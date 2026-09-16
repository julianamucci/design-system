import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Info } from 'lucide-vue-next';
import {
  alertCompleteSource,
  alertDynamicInsertionSource,
  alertNoAnnouncementSource,
  alertNoIconSource,
  alertNoTitleSource,
} from './alert.source';

const meta = {
  title: 'Components/Feedback/Alert/States',
  component: Alert,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: alertCompleteSource } },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info aria-hidden="true" />
        <AlertTitle as="h4">Atenção</AlertTitle>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Role alert presente', async () => {
      await expect(canvas.getByRole('alert')).toBeInTheDocument();
    });

    await step('AlertTitle e AlertDescription visíveis', async () => {
      await expect(canvas.getByText('Atenção')).toBeVisible();
      await expect(canvas.getByText(/próxima sessão/)).toBeVisible();
    });
  },
};

export const WithoutTitle: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    // A ausência do título É o assunto, e com ela some também o import — a do
    // meta traz os dois.
    docs: { source: { transform: alertNoTitleSource } },
  },
  render: () => ({
    components: { Alert, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info aria-hidden="true" />
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert visível sem título', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('Nenhum heading no DOM', async () => {
      // O slot E qualquer nível de heading: `as` troca a tag, então procurar só
      // `h5` passaria com um título renderizado em outro nível.
      const alert = canvas.getByRole('alert');
      await expect(alert.querySelector('[data-slot="alert-title"]')).toBeNull();
      await expect(alert.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    });
  },
};

export const WithoutIcon: Story = {
  parameters: {
    // A ausência do ícone É o assunto, e leva junto o import dele.
    docs: { source: { transform: alertNoIconSource } },
  },
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert>
        <AlertTitle as="h4">Atenção</AlertTitle>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert visível sem ícone', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('Sem SVG filho direto no alert', async () => {
      const alert = canvas.getByRole('alert');
      const svg = alert.querySelector(':scope > svg');
      await expect(svg).toBeNull();
    });
  },
};

// Regressão do bug em que TODA docs page tinha suas notas de implementação
// anunciadas de imediato: o Alert marcava `role="alert"` fixo, e alert é live
// region assertiva. Conteúdo estático pede `role="note"`, que não anuncia.
// A story prova os dois lados no mesmo canvas — o valor explícito e o default
// intacto para a mensagem urgente.
export const WithoutAnnouncement: Story = {
  parameters: {
    // O assunto é o CONTRASTE entre dois alertas, um com papel explícito e
    // outro no padrão — a do meta mostra um só.
    docs: { source: { transform: alertNoAnnouncementSource } },
  },
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, AlertCircle, Info },
    setup() { return {}; },
    template: `
      <div class="nds-stack" data-spacing="md">
        <Alert role="note">
          <Info aria-hidden="true" />
          <AlertTitle as="h4">Nota de implementação</AlertTitle>
          <AlertDescription>Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle as="h4">Falha no envio</AlertTitle>
          <AlertDescription>Mensagem urgente surgida em tempo de execução: anúncio imediato.</AlertDescription>
        </Alert>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role="note" chega na raiz do alert', async () => {
      const note = canvas.getByText('Nota de implementação').closest('.nds-alert');
      await expect(note).toHaveAttribute('role', 'note');
    });

    await step('Sem `role`, o default continua alert', async () => {
      const defaultAlert = canvas.getByText('Falha no envio').closest('.nds-alert');
      await expect(defaultAlert).toHaveAttribute('role', 'alert');
      await expect(canvas.getByRole('alert')).toBe(defaultAlert);
    });

    await step('A nota não aparece como alert para o leitor de tela', async () => {
      // Se a prop não vencesse o `role` do template, aqui seriam dois alertas.
      await expect(canvas.getAllByRole('alert')).toHaveLength(1);
      await expect(canvas.getByRole('note')).toBeVisible();
    });
  },
};

// Estado em escopo de módulo: o painel Interactions reexecuta a play no MESMO
// DOM, sem render novo, e o alerta do clique anterior continuaria montado. A
// play zera o estado antes de medir, então a asserção pós-clique segue podendo
// reprovar em qualquer execução.
const reportReady = ref(false);

export const DynamicInsertion: Story = {
  parameters: {
    covers: ['functional.item6'],
    // A lição está no MOMENTO: o alerta monta depois de uma ação, e o anúncio
    // vem do papel da própria raiz — sem região viva em volta.
    docs: { source: { transform: alertDynamicInsertionSource } },
  },
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Button, CheckCircle2 },
    setup() {
      reportReady.value = false;
      return { reportReady };
    },
    template: `
      <div class="nds-stack" data-spacing="md">
        <div>
          <Button size="sm" @click="reportReady = true">Gerar relatório</Button>
        </div>
        <Alert v-if="reportReady">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle as="h4">Operação concluída</AlertTitle>
          <AlertDescription>O relatório foi gerado com sucesso.</AlertDescription>
        </Alert>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Antes da ação não há alerta no documento', async () => {
      // Reexecução no mesmo DOM: desmonta o alerta da rodada anterior. A espera
      // só LÊ o DOM — quem o altera é a atribuição acima dela.
      reportReady.value = false;
      await waitFor(() => expect(canvas.queryByRole('alert')).toBeNull());
    });

    await step('Depois do clique o alerta monta com role="alert"', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Gerar relatório' }));
      await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
      const alert = canvas.getByRole('alert');
      await expect(alert).toHaveAttribute('role', 'alert');
      await expect(within(alert).getByText('Operação concluída')).toBeVisible();
    });

    await step('Nenhum ancestral tem aria-live — a região viva é só a raiz', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).not.toHaveAttribute('aria-live');
      await expect(alert.parentElement?.closest('[aria-live]') ?? null).toBeNull();
    });
  },
};
