(function () {
  const loadingAttr = "data-page-loading";
  const lockedClass = "is-click-loading";
  const watchedFunctions = [
    "addnovolivro",
    "setView",
    "setStatus",
    "goPage",
    "openModal",
    "closeModal",
    "closeModalOnOverlay",
    "reservarLivro",
    "filterBooks",
    "sortBooks",
    "clearFilters",
    "reservar",
    "selectRole",
    "handleLogin",
    "handleCadastro",
    "navegarPara",
    "adicionarLivro",
    "removerLivro",
    "editarPermissao",
    "toggleStatus",
    "verDetalhes",
    "openModal",
    "closeModal",
    "toggleView"
  ];

  const state = {
    holds: 0,
    autoReady: true,
    activeElement: null,
    activeTimer: null,
    lockedElements: new Set()
  };

  const originalAddEventListener =
    EventTarget.prototype.addEventListener;

  document.documentElement.setAttribute(loadingAttr, "true");

  const style = document.createElement("style");
  style.textContent = `
    html[${loadingAttr}="true"] body > :not(.app-page-loader) {
      visibility: hidden !important;
    }

    .app-page-loader {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: grid;
      place-items: center;
      background: #f8f6f0;
      color: #16324f;
      font-family: "DM Sans", Arial, sans-serif;
      font-size: 15px;
      letter-spacing: 0;
    }

    .app-page-loader::after {
      content: "Carregando...";
      padding: 12px 18px;
      border: 1px solid rgba(22, 50, 79, .2);
      background: rgba(255, 255, 255, .82);
      border-radius: 8px;
      box-shadow: 0 12px 30px rgba(22, 50, 79, .12);
    }

    html:not([${loadingAttr}="true"]) .app-page-loader {
      display: none;
    }

    .${lockedClass} {
      pointer-events: none !important;
      opacity: .68;
      cursor: wait !important;
    }
  `;
  document.head.appendChild(style);

  function ensureLoader() {
    if (document.querySelector(".app-page-loader")) {
      return;
    }

    const loader = document.createElement("div");
    loader.className = "app-page-loader";
    loader.setAttribute("aria-live", "polite");
    document.body.appendChild(loader);
  }

  function showPageWhenReady() {
    if (state.holds > 0) {
      return;
    }

    document.documentElement.removeAttribute(loadingAttr);
  }

  function hold() {
    state.autoReady = false;
    state.holds += 1;
    document.documentElement.setAttribute(loadingAttr, "true");
  }

  function ready() {
    if (state.holds > 0) {
      state.holds -= 1;
    }

    showPageWhenReady();
  }

  function buttonFromEvent(event) {
    return event.target.closest(
      "button, [role='button'], a[onclick], .module-card[onclick], .book-card[onclick], .page-btn, .chip"
    );
  }

  function setElementLocked(element, locked) {
    if (!element) {
      return;
    }

    element.classList.toggle(lockedClass, locked);
    element.setAttribute("aria-busy", locked ? "true" : "false");

    if ("disabled" in element) {
      element.disabled = locked;
    }

    if (locked) {
      state.lockedElements.add(element);
      return;
    }

    state.lockedElements.delete(element);
  }

  function releaseClick(element) {
    const target = element || state.activeElement;

    if (!target) {
      return;
    }

    window.clearTimeout(state.activeTimer);
    state.activeTimer = null;
    setElementLocked(target, false);

    if (state.activeElement === target) {
      state.activeElement = null;
    }
  }

  function lockClick(element) {
    if (!element) {
      return;
    }

    state.activeElement = element;
    setElementLocked(element, true);

    window.clearTimeout(state.activeTimer);
    state.activeTimer = window.setTimeout(() => {
      releaseClick(element);
    }, 1200);
  }

  function withClickLock(fn) {
    if (typeof fn !== "function" || fn.__pageGuardWrapped) {
      return fn;
    }

    const wrapped = function (...args) {
      const element = state.activeElement;

      try {
        const result = fn.apply(this, args);

        if (result && typeof result.finally === "function") {
          return result.finally(() => releaseClick(element));
        }

        releaseClick(element);
        return result;
      }

      catch (error) {
        releaseClick(element);
        throw error;
      }
    };

    wrapped.__pageGuardWrapped = true;
    return wrapped;
  }

  function guardFunction(name) {
    const current = window[name];

    if (typeof current === "function") {
      window[name] = withClickLock(current);
      return;
    }

    let value = current;

    try {
      Object.defineProperty(window, name, {
        configurable: true,
        get() {
          return value;
        },
        set(nextValue) {
          value =
            typeof nextValue === "function"
              ? withClickLock(nextValue)
              : nextValue;
        }
      });
    }

    catch (error) {
      console.warn(`PageGuard não conseguiu proteger ${name}.`, error);
    }
  }

  EventTarget.prototype.addEventListener = function (
    type,
    listener,
    options
  ) {
    if (type !== "click" || typeof listener !== "function") {
      return originalAddEventListener.call(this, type, listener, options);
    }

    const wrappedListener = function (event) {
      const element = state.activeElement;

      try {
        const result = listener.call(this, event);

        if (result && typeof result.finally === "function") {
          return result.finally(() => releaseClick(element));
        }

        releaseClick(element);
        return result;
      }

      catch (error) {
        releaseClick(element);
        throw error;
      }
    };

    return originalAddEventListener.call(
      this,
      type,
      wrappedListener,
      options
    );
  };

  originalAddEventListener.call(
    document,
    "click",
    (event) => {
      const element = buttonFromEvent(event);

      if (!element) {
        return;
      }

      if (
        document.documentElement.hasAttribute(loadingAttr) ||
        element.classList.contains(lockedClass) ||
        state.lockedElements.has(element)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      lockClick(element);
    },
    true
  );

  document.addEventListener("DOMContentLoaded", ensureLoader);

  window.addEventListener("load", () => {
    watchedFunctions.forEach(guardFunction);

    if (state.autoReady) {
      showPageWhenReady();
    }
  });

  watchedFunctions.forEach(guardFunction);

  window.PageGuard = {
    hold,
    ready,
    guardFunction,
    releaseClick
  };
})();
