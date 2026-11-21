import {
  clearDashboardKiosk,
  DASHBOARD_KIOSK_STORAGE_KEY,
  getDashboardKiosk,
  isDashboardKioskLink,
  saveDashboardKiosk,
} from "@/helpers/dashboard_kiosk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createLocalStorageMock = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
};

describe("dashboard kiosk", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recognises a TV link by its kiosk parameter", () => {
    expect(
      isDashboardKioskLink(new URLSearchParams("dashboard=AB&kiosk=1")),
    ).toBe(true);
    expect(isDashboardKioskLink(new URLSearchParams("dashboard=AB"))).toBe(
      false,
    );
  });

  it("remembers and forgets a TV link", () => {
    expect(getDashboardKiosk()).toBeNull();

    saveDashboardKiosk({ code: "ABCD1234", path: "/party" });
    expect(getDashboardKiosk()).toEqual({ code: "ABCD1234", path: "/party" });

    clearDashboardKiosk();
    expect(getDashboardKiosk()).toBeNull();
  });

  it("ignores a stored value without a code", () => {
    localStorage.setItem(DASHBOARD_KIOSK_STORAGE_KEY, '{"path":"/party"}');
    expect(getDashboardKiosk()).toBeNull();

    localStorage.setItem(DASHBOARD_KIOSK_STORAGE_KEY, "not json");
    expect(getDashboardKiosk()).toBeNull();
  });
});
