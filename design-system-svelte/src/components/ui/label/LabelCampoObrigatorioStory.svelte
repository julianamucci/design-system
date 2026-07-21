<script lang="ts">
  import { Label } from '@/components/ui/label';
  import { Input } from '@/components/ui/input';
</script>

<div class="nds-stack" data-spacing="sm" style="width: 16rem">
  <Label for="email-obrigatorio">
    Email profissional
    <span class="nds-text-destructive" aria-hidden="true">*</span>
  </Label>
  <Input id="email-obrigatorio" type="email" aria-required="true" placeholder="ex: joao@empresa.com" />
</div>
