/**
 * The party guest's nickname, shared by every component on the guest page and
 * remembered on the device.
 */

import {
  NICKNAME_MAX_LENGTH,
  cleanGuestText,
  loadNickname,
  saveNickname,
} from "@/helpers/party_guest_text";
import { ref } from "vue";

const nickname = ref(loadNickname());
// The guest closed the prompt without a nickname; asked again on the next visit
const promptDismissed = ref(false);

export function usePartyNickname() {
  const setNickname = (value: string): string => {
    const cleaned = cleanGuestText(value, NICKNAME_MAX_LENGTH);
    nickname.value = cleaned;
    saveNickname(cleaned);
    return cleaned;
  };

  return {
    nickname,
    promptDismissed,
    setNickname,
  };
}
