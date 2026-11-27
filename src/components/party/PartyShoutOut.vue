<template>
  <div v-if="enabled" class="relative mb-3 shrink-0">
    <MessageSquareQuote
      :size="16"
      class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
    <Input
      v-model="message"
      :maxlength="SHOUT_OUT_MAX_LENGTH"
      :placeholder="$t('providers.party.guest_page.shout_out_placeholder')"
      :aria-label="$t('providers.party.guest_page.shout_out_label')"
      class="pl-9"
    />
  </div>
</template>

<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { usePartyConfig } from "@/composables/usePartyConfig";
import { SHOUT_OUT_MAX_LENGTH } from "@/helpers/party_guest_text";
import { $t } from "@/plugins/i18n";
import { MessageSquareQuote } from "@lucide/vue";
import { computed } from "vue";

const message = defineModel<string>({ required: true });

const { config } = usePartyConfig();
const enabled = computed(
  () =>
    (config.value?.enable_shout_outs ?? false) &&
    (config.value?.enable_add_queue ?? false),
);
</script>
