import {
  clearDashboardKiosk,
  DASHBOARD_KIOSK_STORAGE_KEY,
  getDashboardKiosk,
  isDashboardKioskLink,
  saveDashboardKiosk,
} from "@/helpers/dashboard_kiosk";
import { afterEach, describe, expect, it } from "vitest";

describe("dashboard kiosk", () => {
  afterEach(() => {
    localStorage.clear();
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
