<template>
  <section
    v-if="status.is_host"
    class="mb-3 flex shrink-0 flex-wrap items-center gap-2 rounded-xl border bg-card p-3 text-sm"
    :aria-label="$t('providers.party.guest_page.host_title')"
  >
    <ShieldCheck :size="16" aria-hidden="true" />
    <span class="flex-1">{{
      $t("providers.party.guest_page.host_active")
    }}</span>
    <Button
      v-if="status.blocked_count > 0"
      variant="ghost"
      size="sm"
      :disabled="busy"
      @click="unblockAll"
    >
      {{
        $t("providers.party.guest_page.host_unblock", [status.blocked_count])
      }}
    </Button>
    <Button variant="ghost" size="sm" :disabled="busy" @click="lock">
      {{ $t("providers.party.guest_page.host_leave") }}
    </Button>
  </section>
  <form
    v-else-if="status.enabled && showForm"
    class="mb-3 flex shrink-0 gap-2"
    @submit.prevent="submit"
  >
    <Input
      v-model="pin"
      type="password"
      autocomplete="off"
      class="flex-1"
      :placeholder="$t('providers.party.guest_page.host_pin')"
      :aria-label="$t('providers.party.guest_page.host_pin')"
    />
    <Button type="submit" :disabled="!pin.trim() || busy">
      {{ $t("providers.party.guest_page.host_unlock") }}
    </Button>
    <Button type="button" variant="ghost" @click="closeForm">
      {{ $t("close") }}
    </Button>
  </form>
  <div v-else-if="status.enabled" class="mb-1 flex shrink-0 justify-end">
    <Button variant="ghost" size="sm" @click="showForm = true">
      <Shield :size="14" aria-hidden="true" />
      {{ $t("providers.party.guest_page.host_mode") }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePartyHost } from "@/composables/party/usePartyHost";
import { usePartyConfig } from "@/composables/usePartyConfig";
import { $t } from "@/plugins/i18n";
import { Shield, ShieldCheck } from "@lucide/vue";
import { ref, watch } from "vue";

const { config } = usePartyConfig();
const { status, busy, refresh, unlock, lock, unblockAll } = usePartyHost();

const showForm = ref(false);
const pin = ref("");

const closeForm = () => {
  showForm.value = false;
  pin.value = "";
};

const submit = async () => {
  const unlocked = await unlock(pin.value);
  pin.value = "";
  if (unlocked) showForm.value = false;
};

watch(() => config.value?.host_controls_enabled, refresh, { immediate: true });
</script>
