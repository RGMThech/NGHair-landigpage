declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const reportConversion = () => {
  if (typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-17444441836/QjfJCL2aupgcEOydlP5A",
    });
    window.gtag("event", "conversion", {
      send_to: "AW-17444441836/V38RCOzExJgcEOydlP5A",
    });
  }
};
