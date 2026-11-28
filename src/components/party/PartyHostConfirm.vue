<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent class="sm:max-w-[420px]" @click.stop>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ description }}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter class="flex-row justify-end">
        <AlertDialogCancel>{{ $t("cancel") }}</AlertDialogCancel>
        <AlertDialogAction @click="emit('confirm')">
          {{ $t("providers.party.guest_page.host_confirm") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { $t } from "@/plugins/i18n";

defineProps<{ title: string; description: string }>();
const emit = defineEmits<{ confirm: [] }>();
const open = defineModel<boolean>("open", { required: true });
</script>
