<template>
  <div
    class="skip-meter"
    role="meter"
    :aria-valuenow="votes"
    :aria-valuemin="0"
    :aria-valuemax="votesRequired"
    :aria-label="label"
  >
    <div
      class="skip-meter-fill"
      :style="{ '--skip-scale': Math.min(votes / votesRequired, 1) }"
    ></div>
    <span class="relative flex items-center gap-[0.6vh]">
      <SkipForward class="size-[clamp(14px,1.6vh,24px)]" aria-hidden="true" />
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { $t } from "@/plugins/i18n";
import { SkipForward } from "@lucide/vue";
import { computed } from "vue";

const props = defineProps<{
  votes: number;
  votesRequired: number;
}>();

const label = computed(() =>
  $t("providers.party.skip_meter", [props.votes, props.votesRequired]),
);
</script>

<style scoped>
.skip-meter {
  position: relative;
  overflow: hidden;
  min-width: 18vh;
  padding: 0.6vh 1.4vh;
  border-radius: 999px;
  /* plain rgba: older Cast and Android TV runtimes lack color-mix() */
  border: 1px solid rgba(220, 38, 38, 0.6);
  background: rgba(0, 0, 0, 0.25);
  font-size: clamp(0.75rem, 1.5vh, 1.4rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.skip-meter-fill {
  position: absolute;
  inset: 0;
  background: rgba(220, 38, 38, 0.75);
  transform-origin: left center;
  transform: scaleX(var(--skip-scale, 0));
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
