/**
 * A TV link: a dashboard code that does not run out, remembered so the screen
 * can sign itself in again when its one-day viewer token ends.
 */

export const DASHBOARD_KIOSK_STORAGE_KEY = "ma_dashboard_kiosk";
export const DASHBOARD_KIOSK_URL_PARAM = "kiosk";

export interface DashboardKiosk {
  code: string;
  path: string | null;
}

/**
 * Return whether the URL query marks its dashboard code as a TV link.
 *
 * :param params: The query of the page URL.
 */
export function isDashboardKioskLink(params: URLSearchParams): boolean {
  return params.get(DASHBOARD_KIOSK_URL_PARAM) === "1";
}

/**
 * Remember a TV link for this browser.
 *
 * :param kiosk: The dashboard code and route of the link.
 */
export function saveDashboardKiosk(kiosk: DashboardKiosk): void {
  try {
    localStorage.setItem(DASHBOARD_KIOSK_STORAGE_KEY, JSON.stringify(kiosk));
  } catch {
    // storage unavailable: the link still works, it just is not remembered
  }
}

/**
 * Return the TV link remembered by this browser, if any.
 */
export function getDashboardKiosk(): DashboardKiosk | null {
  try {
    const stored = localStorage.getItem(DASHBOARD_KIOSK_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<DashboardKiosk>;
    if (typeof parsed.code !== "string" || !parsed.code) return null;
    return {
      code: parsed.code,
      path: typeof parsed.path === "string" ? parsed.path : null,
    };
  } catch {
    return null;
  }
}

export function clearDashboardKiosk(): void {
  try {
    localStorage.removeItem(DASHBOARD_KIOSK_STORAGE_KEY);
  } catch {
    // nothing stored to clear
  }
}
