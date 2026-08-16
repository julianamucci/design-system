<script lang="ts">
  import { Label } from '@/components/ui/label';
  import { Input } from '@/components/ui/input';
</script>

<div class="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
  <Label for="comp-required">
    Email profissional
    <span class="nds-text-destructive" aria-hidden="true">*</span>
  </Label>
  <Input id="comp-required" type="email" aria-required="true" placeholder="ex: joao@empresa.com" />
</div>
