<template>
  <section
    v-if="showForm"
    class="mb-4 shrink-0 rounded-xl border bg-card p-4"
    :aria-label="$t('providers.party.guest_page.nickname_title')"
  >
    <h2 class="text-base font-semibold">
      {{ $t("providers.party.guest_page.nickname_title") }}
    </h2>
    <p class="mb-3 text-sm text-muted-foreground">
      {{ $t("providers.party.guest_page.nickname_hint") }}
    </p>
    <form class="flex gap-2" @submit.prevent="save">
      <Input
        v-model="draft"
        :maxlength="NICKNAME_MAX_LENGTH"
        :placeholder="$t('providers.party.guest_page.nickname_placeholder')"
        :aria-label="$t('providers.party.guest_page.nickname_placeholder')"
        autocomplete="nickname"
        class="flex-1"
      />
      <Button type="submit" :disabled="!cleanedDraft">
        {{ $t("providers.party.guest_page.nickname_save") }}
      </Button>
      <Button type="button" variant="ghost" @click="dismiss">
        {{ $t("providers.party.guest_page.nickname_skip") }}
      </Button>
    </form>
  </section>
  <div
    v-else-if="enabled && nickname"
    class="mb-3 flex shrink-0 items-center gap-2 text-sm text-muted-foreground"
  >
    <UserRound :size="16" aria-hidden="true" />
    <span>{{
      $t("providers.party.guest_page.nickname_you_are", [nickname])
    }}</span>
    <Button
      variant="ghost"
      size="icon-sm"
      :aria-label="$t('providers.party.guest_page.nickname_change')"
      :title="$t('providers.party.guest_page.nickname_change')"
      @click="edit"
    >
      <Pencil class="size-[13px]" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePartyNickname } from "@/composables/party/usePartyNickname";
import { usePartyConfig } from "@/composables/usePartyConfig";
import {
  NICKNAME_MAX_LENGTH,
  cleanGuestText,
} from "@/helpers/party_guest_text";
import { $t } from "@/plugins/i18n";
import { Pencil, UserRound } from "@lucide/vue";
import { computed, ref } from "vue";
import { toast } from "vue-sonner";

const { config } = usePartyConfig();
const { nickname, promptDismissed, setNickname } = usePartyNickname();

const enabled = computed(() => config.value?.enable_guest_names ?? false);
const editing = ref(false);
const draft = ref(nickname.value);
const cleanedDraft = computed(() =>
  cleanGuestText(draft.value, NICKNAME_MAX_LENGTH),
);

const showForm = computed(
  () =>
    enabled.value &&
    (editing.value || (!nickname.value && !promptDismissed.value)),
);

const save = () => {
  const saved = setNickname(draft.value);
  if (!saved) return;
  draft.value = saved;
  editing.value = false;
  toast.success($t("providers.party.guest_page.nickname_saved", [saved]));
};

const dismiss = () => {
  editing.value = false;
  promptDismissed.value = true;
  draft.value = nickname.value;
};

const edit = () => {
  draft.value = nickname.value;
  editing.value = true;
};
</script>
