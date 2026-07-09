(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function pwaConfig() {
    if (!window.rcmail || !rcmail.env) {
      return {};
    }

    return {
      serviceWorker: rcmail.env.cybrense_pwa_service_worker,
      scope: rcmail.env.cybrense_pwa_scope || "./"
    };
  }

  function syncAppViewport() {
    document.documentElement.style.setProperty("--cybrense-app-height", window.innerHeight + "px");

    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      document.documentElement.classList.add("cybrense-pwa-standalone");
    } else {
      document.documentElement.classList.remove("cybrense-pwa-standalone");
    }
  }

  function registerServiceWorker() {
    var config = pwaConfig();

    if (!config.serviceWorker || !("serviceWorker" in navigator)) {
      return;
    }

    if (!/^https?:$/.test(window.location.protocol)) {
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker.register(config.serviceWorker, { scope: config.scope }).catch(function () {
        // PWA registration must never block the mailbox UI.
      });
    }, { once: true });
  }

  ready(function () {
    syncAppViewport();
    registerServiceWorker();

    window.addEventListener("resize", syncAppViewport, { passive: true });
    window.addEventListener("orientationchange", syncAppViewport, { passive: true });
  });
})();
