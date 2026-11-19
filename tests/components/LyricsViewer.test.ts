import LyricsViewer from "@/components/LyricsViewer.vue";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

vi.mock("@/plugins/i18n", () => ({ $t: (key: string) => key }));

enableAutoUnmount(afterEach);

const LRC = "[00:01.00]one two three\n[00:03.00]next line";
const LEAD = 0.5; // LyricsViewer's line transition, the highlightAhead lead

// The fill percent of each word on the active line, read from its gradient.
const activeFills = (wrapper: ReturnType<typeof mount>): number[] =>
  wrapper
    .findAll(".lyrics-line.active .lyrics-word")
    .map((word) =>
      Number(
        /\) ([\d.]+)%/.exec(word.attributes("style") ?? "")?.[1] ?? Number.NaN,
      ),
    );

const mountAt = async (position: number, highlightAhead = true) => {
  const wrapper = mount(LyricsViewer, {
    props: { lrcLyrics: LRC, wordHighlight: true, highlightAhead, position: 0 },
  });
  await wrapper.setProps({ position });
  await nextTick();
  return wrapper;
};

describe("LyricsViewer word highlight", () => {
  it("fills the words of the active line while it is sung", async () => {
    const wrapper = await mountAt(1.7);
    const fills = activeFills(wrapper);
    expect(fills).toHaveLength(3);
    expect(fills[0]).toBe(100);
    expect(fills[2]).toBe(0);
  });

  it("finishes the line before the next line takes over the highlight", async () => {
    const wrapper = await mountAt(3 - LEAD - 0.01);
    expect(wrapper.find(".lyrics-line.active").text()).toBe("one two three");
    // 10 ms before the handoff, the last word is all but done
    expect(activeFills(wrapper)[2]).toBeGreaterThan(95);
  });

  it("runs the fill up to the next line without the lead", async () => {
    const wrapper = await mountAt(3 - LEAD - 0.01, false);
    const fills = activeFills(wrapper);
    // the last word runs to the next line's timestamp, so it is half done
    expect(fills[2]).toBeGreaterThan(0);
    expect(fills[2]).toBeLessThan(60);
  });

  it("highlights whole lines without the prop", async () => {
    const wrapper = mount(LyricsViewer, {
      props: { lrcLyrics: LRC, position: 0 },
    });
    await wrapper.setProps({ position: 1.5 });
    expect(wrapper.findAll(".lyrics-word")).toHaveLength(0);
    expect(wrapper.find(".lyrics-line.active").text()).toBe("one two three");
  });
});

describe("LyricsViewer break cue", () => {
  // an instrumental from 2s, marked by the empty line, until the line at 10s
  const BREAK_LRC = "[00:01.00]before\n[00:02.00]\n[00:10.00]after the break";

  const mountCue = async (breakCue: boolean) => {
    const wrapper = mount(LyricsViewer, {
      props: { lrcLyrics: BREAK_LRC, breakCue, position: 0 },
    });
    await wrapper.setProps({ position: 8.5 });
    await nextTick();
    return wrapper;
  };

  it("counts down the line after the break", async () => {
    const wrapper = await mountCue(true);
    const cued = wrapper.find(".lyrics-line--cued");
    expect(cued.text()).toBe("after the break");
    expect(cued.findAll(".lyrics-cue__dot")).toHaveLength(3);
    expect(cued.findAll(".lyrics-cue__dot--lit")).toHaveLength(2);
  });

  it("shows no countdown without the prop", async () => {
    const wrapper = await mountCue(false);
    expect(wrapper.find(".lyrics-cue").exists()).toBe(false);
  });
});
