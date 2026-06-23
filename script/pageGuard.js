(function () {
  const loadingAttr = "data-page-loading";
  const lockedClass = "is-click-loading";
  const ignoredInlineFunctions = new Set([
    "alert",
    "confirm",
    "prompt",
    "if",
    "return"
  ]);

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
    releaseTimer: null,
    pendingClickPromises: new Set(),
    lockedElements: new Set()
  };

  const originalAlert = window.alert.bind(window);

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
      background:
        radial-gradient(circle at 22% 18%, rgba(210, 180, 140, .32), transparent 28%),
        linear-gradient(135deg, #f8f6f0 0%, #eef4ff 100%);
      color: #16324f;
      font-family: "DM Sans", Arial, sans-serif;
    }

    .app-page-loader__card {
      min-width: min(86vw, 340px);
      padding: 30px 28px;
      border: 1px solid rgba(22, 50, 79, .12);
      background: rgba(255, 255, 255, .9);
      border-radius: 24px;
      box-shadow: 0 24px 60px rgba(22, 50, 79, .16);
      text-align: center;
    }

    .app-page-loader__icon {
      width: 66px;
      height: 66px;
      display: grid;
      place-items: center;
      margin: 0 auto 16px;
      border-radius: 20px;
      background: linear-gradient(135deg, #1e3a8a, #0f766e);
      color: #fff;
      font-size: 34px;
      box-shadow: 0 16px 34px rgba(30, 58, 138, .24);
      animation: pageGuardFloat 1.7s ease-in-out infinite;
    }

    .app-page-loader__title {
      margin: 0;
      font-family: "Playfair Display", Georgia, serif;
      font-size: 26px;
      color: #16324f;
    }

    .app-page-loader__text {
      margin: 8px 0 18px;
      color: #5f6f82;
      font-size: 14px;
    }

    .app-page-loader__bar {
      height: 8px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(30, 58, 138, .1);
    }

    .app-page-loader__bar::before {
      content: "";
      display: block;
      width: 45%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #1e3a8a, #0f766e, #d2b48c);
      animation: pageGuardLoad 1.15s ease-in-out infinite;
    }

    @keyframes pageGuardLoad {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(230%); }
    }

    @keyframes pageGuardFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-7px); }
    }

    html:not([${loadingAttr}="true"]) .app-page-loader {
      display: none;
    }

    .${lockedClass} {
      pointer-events: none !important;
      opacity: .68;
      cursor: wait !important;
    }

    .app-alert-modal {
      position: fixed;
      inset: 0;
      z-index: 1000000;
      display: none;
      place-items: center;
      padding: 24px;
      background: rgba(15, 23, 42, .46);
      backdrop-filter: blur(5px);
    }

    .app-alert-modal.is-open {
      display: grid;
    }

    .app-alert-modal__card {
      width: min(92vw, 420px);
      padding: 28px;
      border: 1px solid rgba(22, 50, 79, .12);
      border-radius: 24px;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, .96), rgba(248, 246, 240, .96));
      box-shadow: 0 28px 70px rgba(15, 23, 42, .28);
      color: #16324f;
      text-align: center;
      animation: appAlertIn .18s ease-out;
    }

    .app-alert-modal__icon {
      width: 62px;
      height: 62px;
      display: grid;
      place-items: center;
      margin: 0 auto 14px;
      border-radius: 20px;
      background: linear-gradient(135deg, #1e3a8a, #0f766e);
      color: #fff;
      font-size: 30px;
      box-shadow: 0 14px 34px rgba(30, 58, 138, .24);
    }

    .app-alert-modal__title {
      margin: 0 0 8px;
      font-family: "Playfair Display", Georgia, serif;
      font-size: 25px;
      color: #16324f;
    }

    .app-alert-modal__message {
      margin: 0 0 22px;
      color: #516174;
      font-size: 15px;
      line-height: 1.55;
      white-space: pre-line;
    }

    .app-alert-modal__button {
      border: 0;
      border-radius: 999px;
      padding: 12px 28px;
      background: linear-gradient(135deg, #1e3a8a, #0f766e);
      color: #fff;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 14px 28px rgba(30, 58, 138, .22);
      transition: transform .15s ease, box-shadow .15s ease;
    }

    .app-alert-modal__button:hover {
      transform: translateY(-1px);
      box-shadow: 0 18px 34px rgba(30, 58, 138, .28);
    }

    @keyframes appAlertIn {
      from { opacity: 0; transform: translateY(12px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(style);


  function alertDetails(message) {
    const text = String(message || "").trim();
    const lowerText = text.toLowerCase();

    if (lowerText.includes("erro") || lowerText.includes("❌")) {
      return { icon: "⚠️", title: "Atenção necessária" };
    }

    if (lowerText.includes("sucesso") || lowerText.includes("reservado") || lowerText.includes("✅")) {
      return { icon: "✅", title: "Tudo certo" };
    }

    if (lowerText.includes("login") || lowerText.includes("senha") || lowerText.includes("preencha")) {
      return { icon: "🔐", title: "Verifique as informações" };
    }

    return { icon: "📚", title: "Biblioteca Escolar" };
  }

  function ensureAlertModal() {
    const current = document.querySelector(".app-alert-modal");

    if (current) {
      return current;
    }

    const modal = document.createElement("div");
    modal.className = "app-alert-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "app-alert-title");
    modal.innerHTML = `
      <div class="app-alert-modal__card">
        <div class="app-alert-modal__icon" aria-hidden="true">📚</div>
        <h2 class="app-alert-modal__title" id="app-alert-title">Biblioteca Escolar</h2>
        <p class="app-alert-modal__message"></p>
        <button class="app-alert-modal__button" type="button">Entendi</button>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  function showAlertModal(message) {
    if (!document.body) {
      originalAlert(message);
      return;
    }

    const modal = ensureAlertModal();
    const details = alertDetails(message);
    const icon = modal.querySelector(".app-alert-modal__icon");
    const title = modal.querySelector(".app-alert-modal__title");
    const text = modal.querySelector(".app-alert-modal__message");
    const button = modal.querySelector(".app-alert-modal__button");

    icon.textContent = details.icon;
    title.textContent = details.title;
    text.textContent = String(message || "");

    const close = () => {
      modal.classList.remove("is-open");
      button.removeEventListener("click", close);
    };

    button.addEventListener("click", close);
    modal.classList.add("is-open");
    button.focus();
  }

  window.showAppMessage = showAlertModal;
  window.alert = showAlertModal;

  function ensureLoader() {
    if (document.querySelector(".app-page-loader")) {
      return;
    }

    const loader = document.createElement("div");
    loader.className = "app-page-loader";
    loader.setAttribute("aria-live", "polite");
    loader.setAttribute("role", "status");
    loader.innerHTML = `
      <div class="app-page-loader__card">
        <div class="app-page-loader__icon" aria-hidden="true">📚</div>
        <h1 class="app-page-loader__title">Preparando a biblioteca</h1>
        <p class="app-page-loader__text">Carregando dados e organizando a página...</p>
        <div class="app-page-loader__bar" aria-hidden="true"></div>
      </div>
    `;
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

  function track(task) {
    hold();

    if (task && typeof task.finally === "function") {
      return task.finally(ready);
    }

    ready();
    return task;
  }

  function buttonFromEvent(event) {
    return event.target.closest(
      "button, input[type='button'], input[type='submit'], input[type='reset'], [role='button'], a[onclick], .module-card[onclick], .book-card[onclick], .page-btn, .chip"
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
    window.clearTimeout(state.releaseTimer);
    state.activeTimer = null;
    state.releaseTimer = null;
    setElementLocked(target, false);

    if (state.activeElement === target) {
      state.activeElement = null;
    }
  }

  function trackClickPromise(result) {
    if (!result || typeof result.finally !== "function") {
      return result;
    }

    state.pendingClickPromises.add(result);

    return result.finally(() => {
      state.pendingClickPromises.delete(result);
    });
  }

  function scheduleClickRelease(element) {
    window.clearTimeout(state.releaseTimer);

    state.releaseTimer = window.setTimeout(() => {
      const target = element;
      const pending = Array.from(state.pendingClickPromises);

      if (pending.length === 0) {
        releaseClick(target);
        return;
      }

      Promise
        .allSettled(pending)
        .finally(() => releaseClick(target));
    }, 0);
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
    }, 30000);
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
          return trackClickPromise(result)
            .finally(() => releaseClick(element));
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


  function guardInlineHandlers(root = document) {
    root
      .querySelectorAll?.("[onclick]")
      .forEach((element) => {
        const handler = element.getAttribute("onclick") || "";
        const matches = handler.matchAll(
          /(?:^|[^.$\w])([A-Za-z_$][\w$]*)\s*\(/g
        );

        for (const match of matches) {
          const functionName = match[1];

          if (!ignoredInlineFunctions.has(functionName)) {
            guardFunction(functionName);
          }
        }
      });
  }

  function observeInlineHandlers() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
          }

          if (node.hasAttribute?.("onclick")) {
            guardInlineHandlers(node.parentElement || document);
            return;
          }

          guardInlineHandlers(node);
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
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
          return trackClickPromise(result);
        }

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
      scheduleClickRelease(element);
    },
    true
  );

  document.addEventListener("DOMContentLoaded", () => {
    ensureLoader();
    guardInlineHandlers();
    observeInlineHandlers();
  });

  window.addEventListener("load", () => {
    watchedFunctions.forEach(guardFunction);
    guardInlineHandlers();

    if (state.autoReady) {
      showPageWhenReady();
    }
  });

  watchedFunctions.forEach(guardFunction);

  window.PageGuard = {
    hold,
    ready,
    guardFunction,
    releaseClick,
    track
  };
})();
