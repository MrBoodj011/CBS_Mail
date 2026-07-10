(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function forceLightMode() {
    document.documentElement.classList.remove("dark-mode");
    document.cookie = "colorMode=light; path=/; max-age=31536000; SameSite=Lax";
  }

  function syncViewportClasses() {
    if (!document.body) {
      return;
    }

    var layout = document.querySelector("#layout");
    var width = layout ? layout.getBoundingClientRect().width : window.innerWidth;
    var content = document.querySelector("#layout-content");
    var contentWidth = content ? content.getBoundingClientRect().width : width;
    var list = document.querySelector("#layout-list");
    var listWidth = list ? list.getBoundingClientRect().width : width;
    var classes = [
      "cybrense-ui-wide",
      "cybrense-ui-tight",
      "cybrense-ui-narrow",
      "cybrense-ui-phone",
      "cybrense-list-tight",
      "cybrense-list-tiny",
      "cybrense-list-nano",
      "cybrense-content-tight",
      "cybrense-content-tiny",
      "cybrense-content-nano"
    ];

    classes.forEach(function (name) {
      document.body.classList.remove(name);
    });

    document.body.classList.add("cybrense-ui-ready");

    if (width <= 720) {
      document.body.classList.add("cybrense-ui-phone");
    } else if (width <= 1180) {
      document.body.classList.add("cybrense-ui-narrow");
    } else if (width <= 1380) {
      document.body.classList.add("cybrense-ui-tight");
    } else {
      document.body.classList.add("cybrense-ui-wide");
    }

    if (contentWidth <= 380) {
      document.body.classList.add("cybrense-content-nano");
    } else if (contentWidth <= 500) {
      document.body.classList.add("cybrense-content-tiny");
    } else if (contentWidth <= 680) {
      document.body.classList.add("cybrense-content-tight");
    }

    if (listWidth <= 360) {
      document.body.classList.add("cybrense-list-nano");
    } else if (listWidth <= 440) {
      document.body.classList.add("cybrense-list-tiny");
    } else if (listWidth <= 560) {
      document.body.classList.add("cybrense-list-tight");
    }
  }

  var responsiveObserver;
  var responsiveObserverTimer;
  var responsiveObservedElements = [];

  function setupResponsiveObserver() {
    if (typeof ResizeObserver !== "function" || !document.body) {
      return;
    }

    if (!responsiveObserver) {
      responsiveObserver = new ResizeObserver(function () {
        window.clearTimeout(responsiveObserverTimer);
        responsiveObserverTimer = window.setTimeout(function () {
          syncViewportClasses();
        }, 40);
      });
    }

    ["#layout", "#layout-menu", "#layout-sidebar", "#layout-list", "#layout-content", "#messagecontframe"].forEach(function (selector) {
      var element = document.querySelector(selector);

      if (element && responsiveObservedElements.indexOf(element) === -1) {
        responsiveObserver.observe(element);
        responsiveObservedElements.push(element);
      }
    });
  }

  var LAYOUT_STORE_KEY = "cybrense.layout.v3";
  var layoutResizersReady = false;
  var resizablePanes = {
    menu: { selector: "#layout-menu", min: 196, max: 286, defaultWidth: 212 },
    sidebar: { selector: "#layout-sidebar", min: 230, max: 380, defaultWidth: 268 },
    list: { selector: "#layout-list", min: 340, max: 560, defaultWidth: 382 }
  };

  function readLayoutStore() {
    var store = null;

    try {
      store = JSON.parse(window.localStorage.getItem(LAYOUT_STORE_KEY) || "null");
    } catch (error) {
      store = null;
    }

    return store && typeof store === "object" ? store : {};
  }

  function writeLayoutStore(store) {
    try {
      window.localStorage.setItem(LAYOUT_STORE_KEY, JSON.stringify(store || {}));
    } catch (error) {
      // Keep resizing functional even when storage is unavailable.
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function paneElement(key) {
    var pane = resizablePanes[key];
    return pane ? document.querySelector(pane.selector) : null;
  }

  function clearPaneWidth(element) {
    if (!element) {
      return;
    }

    ["flex", "flex-basis", "width", "min-width", "max-width"].forEach(function (name) {
      element.style.removeProperty(name);
    });
    element.classList.remove("cybrense-resized-pane");
  }

  function setPaneWidth(element, width) {
    var value = Math.round(width) + "px";

    element.style.setProperty("flex", "0 0 " + value, "important");
    element.style.setProperty("flex-basis", value, "important");
    element.style.setProperty("width", value, "important");
    element.style.setProperty("min-width", value, "important");
    element.style.setProperty("max-width", value, "important");
    element.classList.add("cybrense-resized-pane");
  }

  function dynamicPaneMax(key) {
    var layout = document.querySelector("#layout");
    var contentMin = 330;
    var pane = resizablePanes[key];
    var used = 0;

    if (!layout || !pane) {
      return pane ? pane.max : 0;
    }

    Object.keys(resizablePanes).forEach(function (name) {
      var element;

      if (name === key) {
        return;
      }

      element = paneElement(name);
      if (element && element.offsetParent !== null) {
        used += element.getBoundingClientRect().width;
      }
    });

    return Math.max(pane.min, Math.min(pane.max, layout.getBoundingClientRect().width - used - contentMin));
  }

  function layoutCanResize() {
    return (
      isMailTask() &&
      document.querySelector("#layout") &&
      !document.body.classList.contains("cybrense-ui-narrow") &&
      !document.body.classList.contains("cybrense-ui-phone")
    );
  }

  function applyResizableLayout() {
    var store;

    if (!isMailTask()) {
      return;
    }

    setupLayoutResizers();

    if (!layoutCanResize()) {
      Object.keys(resizablePanes).forEach(function (key) {
        clearPaneWidth(paneElement(key));
      });
      return;
    }

    store = readLayoutStore();
    Object.keys(resizablePanes).forEach(function (key) {
      var pane = resizablePanes[key];
      var element = paneElement(key);
      var stored = Number(store[key]);
      var max = dynamicPaneMax(key);

      if (element && stored) {
        setPaneWidth(element, clamp(stored, pane.min, max));
      }
    });
  }

  function setupLayoutResizers() {
    var foundPane = false;

    if (!isMailTask()) {
      return;
    }

    Object.keys(resizablePanes).forEach(function (key) {
      var element = paneElement(key);
      var handle;

      if (!element) {
        return;
      }

      foundPane = true;
      handle = element.querySelector(".cybrense-layout-resizer[data-pane='" + key + "']");
      if (!handle) {
        handle = document.createElement("div");
        handle.className = "cybrense-layout-resizer";
        handle.setAttribute("data-pane", key);
        handle.setAttribute("role", "separator");
        handle.setAttribute("aria-orientation", "vertical");
        handle.setAttribute("title", "Glisser pour redimensionner");
        element.appendChild(handle);
      }

      if (handle.getAttribute("data-cybrense-bound") !== "true") {
        handle.setAttribute("data-cybrense-bound", "true");
        handle.addEventListener("pointerdown", startLayoutResize);
        handle.addEventListener("dblclick", resetLayoutPane);
      }
    });

    layoutResizersReady = foundPane;
  }

  function startLayoutResize(event) {
    var handle = event.currentTarget;
    var key = handle.getAttribute("data-pane");
    var pane = resizablePanes[key];
    var element = paneElement(key);
    var store = readLayoutStore();
    var startX;
    var startWidth;

    if (!pane || !element || !layoutCanResize()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    startX = event.clientX;
    startWidth = element.getBoundingClientRect().width;
    document.body.classList.add("cybrense-resizing");
    handle.classList.add("active");

    if (handle.setPointerCapture) {
      try {
        handle.setPointerCapture(event.pointerId);
      } catch (error) {
        // Some browsers reject capture if the pointer already moved away.
      }
    }

    function move(moveEvent) {
      var max = dynamicPaneMax(key);
      var width = clamp(startWidth + moveEvent.clientX - startX, pane.min, max);

      setPaneWidth(element, width);
      store[key] = Math.round(width);
      syncViewportClasses();
    }

    function stop() {
      document.body.classList.remove("cybrense-resizing");
      handle.classList.remove("active");
      writeLayoutStore(store);
      scheduleMailEnhancements();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  function resetLayoutPane(event) {
    var key = event.currentTarget.getAttribute("data-pane");
    var pane = resizablePanes[key];
    var element = paneElement(key);
    var store = readLayoutStore();

    if (!pane || !element) {
      return;
    }

    event.preventDefault();
    delete store[key];
    writeLayoutStore(store);
    setPaneWidth(element, pane.defaultWidth);
    scheduleMailEnhancements();
  }

  function isMailTask() {
    return document.body && document.body.classList.contains("task-mail");
  }

  function isCompactAppLayout() {
    return (
      document.body &&
      (document.body.classList.contains("cybrense-ui-phone") ||
        document.body.classList.contains("cybrense-ui-narrow"))
    );
  }

  var LABEL_STORE_KEY = "cybrense.labels.v1";
  var activeLabelFilter = "";
  var defaultLabels = [
    { id: "cybrense-team", name: "Cybrense Team", color: "blue" },
    { id: "security", name: "Securite", color: "green" },
    { id: "projects", name: "Projets", color: "purple" },
    { id: "billing", name: "Facturation", color: "yellow" },
    { id: "archive", name: "Archive", color: "gray" }
  ];

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (!value || seen[value]) {
        return false;
      }

      seen[value] = true;
      return true;
    });
  }

  function normalizeLabelList(values) {
    if (!Array.isArray(values)) {
      values = values ? [values] : [];
    }

    return unique(values.map(function (value) {
      return String(value || "").trim();
    }));
  }

  function extractEmail(value) {
    var match = String(value || "").match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    return match ? match[0].toLowerCase() : "";
  }

  function labelAccountKey() {
    var env = (window.rcmail && window.rcmail.env) || {};
    var candidates = [
      env.username,
      env.user_name,
      env.email,
      env.mail_user,
      env.login_username,
      env.identity
    ];
    var selectors = [
      "#layout-sidebar .username",
      "#layout-sidebar .user-name",
      "#layout-sidebar .header",
      "#layout-sidebar",
      "#layout-menu .username",
      "#taskmenu .username",
      ".username",
      ".user-name"
    ];
    var email = "";
    var i;
    var node;

    if (env.user && typeof env.user === "object") {
      candidates.push(env.user.email, env.user.username, env.user.name);
    } else {
      candidates.push(env.user);
    }

    if (env.current_user && typeof env.current_user === "object") {
      candidates.push(env.current_user.email, env.current_user.username, env.current_user.name);
    }

    if (Array.isArray(env.identities)) {
      env.identities.forEach(function (identity) {
        if (identity && typeof identity === "object") {
          candidates.push(identity.email, identity.name);
        } else {
          candidates.push(identity);
        }
      });
    }

    for (i = 0; i < candidates.length; i++) {
      email = extractEmail(candidates[i]);
      if (email) {
        return email;
      }
    }

    for (i = 0; i < selectors.length; i++) {
      node = document.querySelector(selectors[i]);
      email = node ? extractEmail(node.textContent) : "";
      if (email) {
        return email;
      }
    }

    return env.user_id ? "user-" + String(env.user_id) : "default";
  }

  function labelStoreKey() {
    return LABEL_STORE_KEY + "." + labelAccountKey().replace(/[^a-z0-9@._+-]+/gi, "-");
  }

  function normalizeStoreValue(value) {
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch (error) {
        value = null;
      }
    }

    return value && typeof value === "object" ? value : null;
  }

  function readRawLabelStore(storageKey) {
    try {
      if (window.rcmail && typeof window.rcmail.local_storage_get_item === "function") {
        return normalizeStoreValue(window.rcmail.local_storage_get_item(storageKey));
      }

      return normalizeStoreValue(window.localStorage.getItem(storageKey));
    } catch (error) {
      return null;
    }
  }

  function writeRawLabelStore(storageKey, store) {
    try {
      if (window.rcmail && typeof window.rcmail.local_storage_set_item === "function") {
        return window.rcmail.local_storage_set_item(storageKey, store);
      }

      window.localStorage.setItem(storageKey, JSON.stringify(store));
      return true;
    } catch (error) {
      return false;
    }
  }

  function readLabelStore() {
    var storageKey = labelStoreKey();
    var store = readRawLabelStore(storageKey);

    if (!store) {
      store = readRawLabelStore(LABEL_STORE_KEY);
      if (store) {
        writeRawLabelStore(storageKey, store);
      }
    }

    if (!store || typeof store !== "object") {
      store = {};
    }

    var labels = Array.isArray(store.labels) ? store.labels : [];
    var hiddenLabels = Array.isArray(store.hiddenLabels) ? store.hiddenLabels.map(String) : [];
    var byId = {};
    var merged = [];

    defaultLabels.concat(labels).forEach(function (label) {
      if (!label || !label.id || byId[label.id] || hiddenLabels.indexOf(String(label.id)) !== -1) {
        return;
      }

      byId[label.id] = true;
      merged.push({
        id: String(label.id),
        name: String(label.name || label.id),
        color: String(label.color || "blue")
      });
    });

    store.labels = merged;
    store.hiddenLabels = hiddenLabels;
    store.messages = store.messages && typeof store.messages === "object" ? store.messages : {};
    var validLabelIds = {};

    store.labels.forEach(function (label) {
      validLabelIds[label.id] = true;
    });

    Object.keys(store.messages).forEach(function (key) {
      var messageLabels = normalizeLabelList(store.messages[key]).filter(function (labelId) {
        return validLabelIds[labelId];
      });

      if (messageLabels.length) {
        store.messages[key] = messageLabels;
      } else {
        delete store.messages[key];
      }
    });

    return store;
  }

  function writeLabelStore(store) {
    return writeRawLabelStore(labelStoreKey(), store);
  }

  function slugifyLabel(value) {
    var slug = String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return slug || "label";
  }

  function labelById(labelId, store) {
    var labels = (store || readLabelStore()).labels;
    for (var i = 0; i < labels.length; i++) {
      if (labels[i].id === labelId) {
        return labels[i];
      }
    }

    return null;
  }

  function messageMailbox(uid) {
    if (window.rcmail && typeof window.rcmail.get_message_mailbox === "function") {
      return window.rcmail.get_message_mailbox(uid) || "";
    }

    return (window.rcmail && window.rcmail.env && window.rcmail.env.mailbox) || "INBOX";
  }

  function messageKey(uid) {
    return messageMailbox(uid) + "|" + String(uid);
  }

  function messageKeyFor(uid, mailbox) {
    return (mailbox || messageMailbox(uid)) + "|" + String(uid);
  }

  function currentMessageInfo() {
    var env = (window.rcmail && window.rcmail.env) || {};
    var uid = env.uid || env.message_uid || env._uid || "";
    var mailbox = env.mailbox || env.mbox || "";
    var match;

    try {
      var params = new URL(window.location.href).searchParams;
      uid = params.get("_uid") || uid;
      mailbox = params.get("_mbox") || mailbox;
    } catch (error) {
      match = String(window.location.href).match(/[?&]_uid=([^&]+)/);
      uid = match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : uid;

      match = String(window.location.href).match(/[?&]_mbox=([^&]+)/);
      mailbox = match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : mailbox;
    }

    if (!uid || !document.querySelector("#message-header")) {
      return null;
    }

    return {
      uid: String(uid),
      mailbox: String(mailbox || "INBOX")
    };
  }

  function rowUid(row) {
    var uid;

    if (window.rcmail && window.rcmail.message_list) {
      if (typeof window.rcmail.message_list.get_row_uid === "function") {
        uid = window.rcmail.message_list.get_row_uid(row);
        if (uid) {
          return String(uid);
        }
      }

      if (window.rcmail.message_list.rows) {
        for (uid in window.rcmail.message_list.rows) {
          if (window.rcmail.message_list.rows[uid] && window.rcmail.message_list.rows[uid].obj === row) {
            return String(uid);
          }
        }
      }
    }

    if (row.uid) {
      return String(row.uid);
    }

    uid = row.getAttribute("data-uid");
    if (uid) {
      return uid;
    }

    uid = String(row.id || "").match(/^rcmrow(.+)/);
    return uid ? uid[1] : "";
  }

  function rowForUid(uid) {
    var row = null;

    if (window.rcmail && window.rcmail.message_list && window.rcmail.message_list.rows) {
      row = window.rcmail.message_list.rows[uid] && window.rcmail.message_list.rows[uid].obj;
      if (row) {
        return row;
      }
    }

    Array.prototype.some.call(document.querySelectorAll("#messagelist tr"), function (candidate) {
      if (rowUid(candidate) === String(uid)) {
        row = candidate;
        return true;
      }

      return false;
    });

    return row;
  }

  function selectedMessageUids() {
    var selection = [];

    if (
      window.rcmail &&
      window.rcmail.message_list &&
      typeof window.rcmail.message_list.get_selection === "function"
    ) {
      selection = window.rcmail.message_list.get_selection() || [];
    }

    if (!selection.length) {
      selection = Array.prototype.map.call(document.querySelectorAll("#messagelist tr.selected"), rowUid);
    }

    return unique(selection.map(function (uid) {
      return String(uid);
    }));
  }

  function showLabelNotice(message, type) {
    if (window.rcmail && typeof window.rcmail.display_message === "function") {
      window.rcmail.display_message(message, type || "confirmation");
      return;
    }

    try {
      if (
        window.parent &&
        window.parent !== window &&
        window.parent.rcmail &&
        typeof window.parent.rcmail.display_message === "function"
      ) {
        window.parent.rcmail.display_message(message, type || "confirmation");
      }
    } catch (error) {
      return;
    }
  }

  function selectedRowsHaveLabel(uids, labelId, store) {
    return uids.length > 0 && uids.every(function (uid) {
      return normalizeLabelList(store.messages[messageKey(uid)]).indexOf(labelId) !== -1;
    });
  }

  function toggleLabelForSelection(labelId) {
    var label = labelById(labelId);
    var uids = selectedMessageUids();

    if (!label) {
      return;
    }

    if (!uids.length) {
      activeLabelFilter = activeLabelFilter === labelId ? "" : labelId;
      applyMessageLabels();
      updateLabelCounts();
      showLabelNotice(
        activeLabelFilter ? "Filtre etiquette: " + label.name : "Filtre etiquette desactive",
        "notice"
      );
      return;
    }

    var store = readLabelStore();
    var remove = selectedRowsHaveLabel(uids, labelId, store);

    uids.forEach(function (uid) {
      var key = messageKey(uid);
      var labels = normalizeLabelList(store.messages[key]);

      if (remove) {
        labels = labels.filter(function (value) {
          return value !== labelId;
        });
      } else if (labels.indexOf(labelId) === -1) {
        labels.push(labelId);
      }

      if (labels.length) {
        store.messages[key] = unique(labels);
      } else {
        delete store.messages[key];
      }
    });

    writeLabelStore(store);
    applyMessageLabels();
    updateLabelCounts();
    showLabelNotice(
      (remove ? "Etiquette retiree: " : "Etiquette ajoutee: ") + label.name,
      remove ? "notice" : "confirmation"
    );
  }

  function filterMessagesByLabel(labelId) {
    var label = labelById(labelId);

    if (!label) {
      return;
    }

    activeLabelFilter = activeLabelFilter === labelId ? "" : labelId;
    document.body.classList.toggle("cybrense-label-filter-active", !!activeLabelFilter);
    applyMessageLabels();
    syncMessageListState();
    updateLabelCounts();
    showLabelNotice(
      activeLabelFilter ? "Emails avec etiquette: " + label.name : "Filtre etiquette desactive",
      "notice"
    );
  }

  function notifyLabelChange() {
    try {
      window.dispatchEvent(new CustomEvent("cybrense-labels-updated"));
    } catch (error) {
      return;
    }

    try {
      if (window.parent && window.parent !== window) {
        window.parent.dispatchEvent(new CustomEvent("cybrense-labels-updated"));
      }
    } catch (error) {
      return;
    }
  }

  function toggleLabelForMessage(info, labelId) {
    var label = labelById(labelId);
    var store = readLabelStore();
    var key;
    var labels;
    var remove;

    if (!info || !label) {
      return;
    }

    key = messageKeyFor(info.uid, info.mailbox);
    labels = normalizeLabelList(store.messages[key]);
    remove = labels.indexOf(labelId) !== -1;

    if (remove) {
      labels = labels.filter(function (value) {
        return value !== labelId;
      });
    } else {
      labels.push(labelId);
    }

    if (labels.length) {
      store.messages[key] = unique(labels);
    } else {
      delete store.messages[key];
    }

    writeLabelStore(store);
    renderMessageLabelPicker();
    applyMessageLabels();
    syncMessageListState();
    updateLabelCounts();
    notifyLabelChange();
    showLabelNotice(
      (remove ? "Etiquette retiree: " : "Etiquette ajoutee: ") + label.name,
      remove ? "notice" : "confirmation"
    );
  }

  function createCustomLabel() {
    openLabelDialog();
  }

  function saveCustomLabel(name) {
    name = String(name || "").trim();
    if (!name) {
      return false;
    }

    var store = readLabelStore();
    var base = slugifyLabel(name);
    var id = base;
    var suffix = 2;

    while (labelById(id, store)) {
      id = base + "-" + suffix;
      suffix++;
    }

    store.hiddenLabels = (store.hiddenLabels || []).filter(function (hiddenId) {
      return hiddenId !== id;
    });
    store.labels.push({ id: id, name: name, color: "blue" });
    writeLabelStore(store);

    var current = document.querySelector(".cybrense-labels");
    if (current) {
      current.replaceWith(makeLabelsSection());
    }

    bindLabelControls();
    updateLabelCounts();
    showLabelNotice("Etiquette ajoutee: " + name, "confirmation");
    return true;
  }

  function refreshLabelUi() {
    var current = document.querySelector(".cybrense-labels");

    if (current) {
      current.replaceWith(makeLabelsSection());
    }

    bindLabelControls();
    applyMessageLabels();
    syncMessageListState();
    updateLabelCounts();
    renderMessageLabelPicker();
  }

  function deleteLabel(labelId) {
    var store = readLabelStore();
    var label = labelById(labelId, store);

    if (!label) {
      return false;
    }

    store.labels = store.labels.filter(function (item) {
      return item.id !== labelId;
    });
    store.hiddenLabels = unique((store.hiddenLabels || []).concat([labelId]));

    Object.keys(store.messages).forEach(function (key) {
      var labels = normalizeLabelList(store.messages[key]);
      labels = labels.filter(function (value) {
        return value !== labelId;
      });

      if (labels.length) {
        store.messages[key] = labels;
      } else {
        delete store.messages[key];
      }
    });

    if (activeLabelFilter === labelId) {
      activeLabelFilter = "";
    }

    writeLabelStore(store);
    refreshLabelUi();
    notifyLabelChange();
    showLabelNotice("Etiquette supprimee: " + label.name, "notice");
    return true;
  }

  function closeLabelDialog() {
    var dialog = document.querySelector(".cybrense-label-dialog");
    if (dialog) {
      dialog.remove();
    }
  }

  function openLabelDialog() {
    var old = document.querySelector(".cybrense-label-dialog");
    var dialog = document.createElement("div");

    if (old) {
      old.remove();
    }

    dialog.className = "cybrense-label-dialog";
    dialog.innerHTML = [
      '<div class="cybrense-label-dialog-card" role="dialog" aria-modal="true" aria-labelledby="cybrense-label-dialog-title">',
      '<div class="cybrense-label-dialog-head">',
      '<span class="cybrense-label-dialog-icon"></span>',
      '<div>',
      '<strong id="cybrense-label-dialog-title">Nouvelle etiquette</strong>',
      '<p>Ajoutez une etiquette pour classer vos emails.</p>',
      "</div>",
      "</div>",
      '<label for="cybrense-label-name">Nom de l etiquette</label>',
      '<input id="cybrense-label-name" type="text" maxlength="32" autocomplete="off" placeholder="Ex: Client urgent" />',
      '<div class="cybrense-label-dialog-actions">',
      '<button type="button" class="cybrense-label-cancel">Annuler</button>',
      '<button type="button" class="cybrense-label-save">Ajouter</button>',
      "</div>",
      "</div>"
    ].join("");

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.closest(".cybrense-label-cancel")) {
        closeLabelDialog();
        return;
      }

      if (event.target.closest(".cybrense-label-save")) {
        var input = dialog.querySelector("#cybrense-label-name");
        if (saveCustomLabel(input && input.value)) {
          closeLabelDialog();
        } else if (input) {
          input.focus();
          input.classList.add("is-invalid");
        }
      }
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeLabelDialog();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        var input = dialog.querySelector("#cybrense-label-name");
        if (saveCustomLabel(input && input.value)) {
          closeLabelDialog();
        } else if (input) {
          input.focus();
          input.classList.add("is-invalid");
        }
      }
    });

    document.body.appendChild(dialog);
    window.setTimeout(function () {
      var input = dialog.querySelector("#cybrense-label-name");
      if (input) {
        input.focus();
      }
    }, 0);
  }

  function makeSecurityCard() {
    var card = document.createElement("div");
    card.className = "cybrense-security-card";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = [
      '<div class="cybrense-security-orb"></div>',
      "<strong>Protection active</strong>",
      "<span>Vos communications sont protegees</span>"
    ].join("");

    return card;
  }

  function makeUsageCard() {
    var card = document.createElement("div");
    card.className = "cybrense-usage-card";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = [
      '<div class="cybrense-usage-head">',
      "<strong>Utilisation</strong>",
      "<span>14%</span>",
      "</div>",
      "<span>7.2 GB / 50 GB</span>",
      '<div class="cybrense-usage-bar"><i></i></div>'
    ].join("");

    return card;
  }

  function enhanceMenu() {
    var taskmenu = document.querySelector("#layout-menu #taskmenu");
    var oldExtras;
    if (!taskmenu) {
      return;
    }

    oldExtras = taskmenu.querySelector(".cybrense-sidebar-extras");
    if (document.body.classList.contains("task-login")) {
      if (oldExtras) {
        oldExtras.remove();
      }
      return;
    }

    var special = taskmenu.querySelector(".special-buttons");
    if (special && special.tagName.toLowerCase() === "span") {
      var replacement = document.createElement("div");
      replacement.className = special.className;
      while (special.firstChild) {
        replacement.appendChild(special.firstChild);
      }
      special.parentNode.replaceChild(replacement, special);
      special = replacement;
    }

    if (special) {
      Array.prototype.forEach.call(special.querySelectorAll("a"), function (link) {
        if (!link.classList.contains("logout")) {
          link.remove();
        }
      });
    }

    Array.prototype.forEach.call(
      taskmenu.querySelectorAll(".cybrense-security-card, .cybrense-usage-card"),
      function (card) {
        if (!card.closest(".cybrense-sidebar-extras")) {
          card.remove();
        }
      }
    );

    if (oldExtras) {
      oldExtras.remove();
    }
  }

  function makeLabelsSection() {
    var labels = document.createElement("div");
    var list = document.createElement("div");
    var store = readLabelStore();

    labels.className = "cybrense-labels";
    labels.innerHTML = [
      '<div class="cybrense-labels-head">',
      "<span>Etiquettes</span>",
      '<div class="cybrense-label-actions">',
      '<button type="button" data-label-action="create" aria-label="Ajouter une etiquette">+</button>',
      "</div>",
      "</div>"
    ].join("");

    list.className = "cybrense-label-list";

    store.labels.forEach(function (label) {
      var row = document.createElement("div");
      var button = document.createElement("button");
      var remove = document.createElement("button");
      var dot = document.createElement("i");
      var name = document.createElement("span");
      var count = document.createElement("em");

      row.className = "cybrense-label-row";
      row.setAttribute("data-color", label.color);

      button.type = "button";
      button.className = "cybrense-label-item";
      button.setAttribute("data-color", label.color);
      button.setAttribute("data-label-id", label.id);
      button.title = "Afficher les emails avec cette etiquette";

      remove.type = "button";
      remove.className = "cybrense-label-inline-delete";
      remove.setAttribute("data-label-action", "delete-one");
      remove.setAttribute("data-label-id", label.id);
      remove.setAttribute("aria-label", "Supprimer " + label.name);
      remove.title = "Supprimer " + label.name;
      remove.textContent = "x";

      name.textContent = label.name;
      count.className = "cybrense-label-count";
      count.textContent = "0";

      button.appendChild(dot);
      button.appendChild(name);
      button.appendChild(count);
      row.appendChild(button);
      row.appendChild(remove);
      list.appendChild(row);
    });

    labels.appendChild(list);

    return labels;
  }

  function enhanceFolderPane() {
    if (!isMailTask()) {
      Array.prototype.forEach.call(document.querySelectorAll(".cybrense-labels"), function (labels) {
        labels.remove();
      });
      return;
    }

    var scroller = document.querySelector("#layout-sidebar #folderlist-content");
    if (!scroller || scroller.querySelector(".cybrense-labels")) {
      return;
    }

    var list = scroller.querySelector("#mailboxlist, .folderlist, .treelist, .listing");
    var labels = makeLabelsSection();
    if (list && list.parentNode === scroller) {
      list.insertAdjacentElement("afterend", labels);
    } else {
      scroller.appendChild(labels);
    }

    bindLabelControls();
    updateLabelCounts();
  }

  function simplifyListToolbar() {
    var header = document.querySelector("#messagelist-header");
    var menuButtons;
    var keepButton;
    if (!header) {
      return;
    }

    Array.prototype.forEach.call(header.querySelectorAll(".toolbar.menu"), function (toolbar) {
      var text = (toolbar.textContent || "").toLowerCase();
      if (
        text.indexOf("selection") !== -1 ||
        text.indexOf("selectionner") !== -1 ||
        text.indexOf("fils") !== -1 ||
        text.indexOf("threads") !== -1 ||
        text.indexOf("options") !== -1
      ) {
        toolbar.classList.add("cybrense-list-toolbar-hidden");
      }
    });

    Array.prototype.forEach.call(header.querySelectorAll("a, .dropbutton"), function (item) {
      var text = (item.textContent || "").toLowerCase();
      var classes = item.className || "";
      if (
        /\b(select|threads|options)\b/.test(classes) ||
        text.indexOf("selection") !== -1 ||
        text.indexOf("selectionner") !== -1 ||
        text.indexOf("fils") !== -1 ||
        text.indexOf("threads") !== -1 ||
        text.indexOf("options") !== -1
      ) {
        item.classList.add("cybrense-list-toolbar-hidden");
      }
    });

    menuButtons = Array.prototype.filter.call(
      header.querySelectorAll("a.toolbar-menu-button, a.options, a.more, a[data-popup='listoptions-menu'], a[href='#list-menu']"),
      function (button) {
        return !button.closest(".cybrense-list-toolbar-hidden");
      }
    );

    if (menuButtons.length > 1) {
      keepButton = menuButtons[menuButtons.length - 1];
      menuButtons.forEach(function (button) {
        button.classList.toggle("cybrense-duplicate-more-hidden", button !== keepButton);
      });
    }
  }

  function closeMobileDrawers() {
    document.body.classList.remove("cybrense-mobile-menu-open");
    document.body.classList.remove("cybrense-mobile-sidebar-open");
    var menu = document.querySelector("#layout-menu");
    var sidebar = document.querySelector("#layout-sidebar");
    if (menu) {
      menu.classList.remove("cybrense-mobile-drawer-open");
    }
    if (sidebar) {
      sidebar.classList.remove("cybrense-mobile-drawer-open");
    }
  }

  function openMobileDrawer(kind) {
    var menu = document.querySelector("#layout-menu");
    var sidebar = document.querySelector("#layout-sidebar");

    if (!isCompactAppLayout()) {
      return false;
    }

    closeMobileDrawers();
    if (kind === "folders") {
      if (!sidebar) {
        return false;
      }
      sidebar.classList.add("cybrense-mobile-drawer-open");
      document.body.classList.add("cybrense-mobile-sidebar-open");
      return true;
    }

    if (!menu) {
      return false;
    }
    menu.classList.add("cybrense-mobile-drawer-open");
    document.body.classList.add("cybrense-mobile-menu-open");
    return true;
  }

  function bindMobileDrawers() {
    var layout = document.querySelector("#layout");
    var backdrop;

    if (!layout || layout.getAttribute("data-cybrense-mobile-drawers-bound") === "true") {
      return;
    }

    layout.setAttribute("data-cybrense-mobile-drawers-bound", "true");
    backdrop = document.querySelector(".cybrense-mobile-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("button");
      backdrop.type = "button";
      backdrop.className = "cybrense-mobile-backdrop";
      backdrop.setAttribute("aria-label", "Fermer le menu");
      layout.appendChild(backdrop);
    }

    document.addEventListener("click", function (event) {
      var taskButton = event.target.closest && event.target.closest("a.task-menu-button[href='#menu'], a.toolbar-menu-button[href='#menu'], a.button[href='#menu']");
      var folderButton = event.target.closest && event.target.closest("a.back-sidebar-button[href='#sidebar'], a.button[href='#sidebar']");
      var menuLink = event.target.closest && event.target.closest("#layout-menu #taskmenu a");

      if (taskButton) {
        if (openMobileDrawer("menu")) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      if (folderButton) {
        if (openMobileDrawer("folders")) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      if (menuLink && (document.body.classList.contains("cybrense-mobile-menu-open") || document.body.classList.contains("cybrense-mobile-sidebar-open"))) {
        window.setTimeout(closeMobileDrawers, 60);
      }
    }, true);

    backdrop.addEventListener("click", function (event) {
      event.preventDefault();
      closeMobileDrawers();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMobileDrawers();
      }
    });
  }

  function bindLabelControls() {
    var labels = document.querySelector(".cybrense-labels");
    if (!labels || labels.getAttribute("data-bound") === "true") {
      return;
    }

    labels.setAttribute("data-bound", "true");
    labels.addEventListener("click", function (event) {
      var createButton = event.target.closest("[data-label-action='create']");
      var deleteOneButton = event.target.closest("[data-label-action='delete-one']");
      var labelButton = event.target.closest(".cybrense-label-item");

      if (createButton) {
        event.preventDefault();
        createCustomLabel();
        return;
      }

      if (deleteOneButton) {
        event.preventDefault();
        event.stopPropagation();
        deleteLabel(deleteOneButton.getAttribute("data-label-id"));
        return;
      }

      if (labelButton) {
        event.preventDefault();
        filterMessagesByLabel(labelButton.getAttribute("data-label-id"));
      }
    });
  }

  function enhanceQuotaWidget() {
    Array.prototype.forEach.call(document.querySelectorAll("#layout-sidebar .quota-widget"), function (quota) {
      quota.classList.add("cybrense-hidden-quota");
      Array.prototype.forEach.call(quota.querySelectorAll(".cybrense-storage-action"), function (link) {
        link.remove();
      });
    });
  }

  function serviceFromText(text) {
    if (text.indexOf("mattermost") !== -1 || text.indexOf("chat.cybrense") !== -1) {
      return "mattermost";
    }

    if (
      text.indexOf("slack") !== -1 ||
      text.indexOf("code de confirmation") !== -1 ||
      text.indexOf("confirmation slack") !== -1
    ) {
      return "slack";
    }

    return "generic";
  }

  function initialsFromText(text) {
    var email = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+/i);
    var source = email ? email[0].split("@")[0] : text;
    var parts = source
      .replace(/[^a-z0-9]+/gi, " ")
      .trim()
      .split(/\s+/)
      .filter(function (part) {
        return /[a-z]/i.test(part);
      });

    if (!parts.length) {
      return "M";
    }

    if (!email && /^(pas|sans|no|objet|subject)$/i.test(parts[0])) {
      return "M";
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }

    return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
  }

  function rowAvatarText(row, fallback) {
    var sender = row.querySelector("span.fromto, span.sender, td.fromto, td.sender");
    var value = sender ? sender.textContent || "" : "";

    value = value.replace(/\s+/g, " ").trim();
    return value || fallback || "";
  }

  function makeMailAvatar(service, text) {
    var avatar = document.createElement("span");
    avatar.className = "cybrense-mail-avatar service-" + service;
    avatar.setAttribute("aria-hidden", "true");
    avatar.setAttribute("data-avatar-service", service);
    avatar.setAttribute("data-avatar-text", text || "");

    if (service === "slack") {
      avatar.innerHTML = [
        '<span class="slack-dot red"></span>',
        '<span class="slack-dot yellow"></span>',
        '<span class="slack-dot green"></span>',
        '<span class="slack-dot blue"></span>'
      ].join("");
    } else if (service === "generic") {
      avatar.textContent = initialsFromText(text);
    }

    return avatar;
  }

  function ensureMailAvatar(row, subjectCell, service, text) {
    var avatarText = rowAvatarText(row, text);
    var old = subjectCell.querySelector(".cybrense-mail-avatar");
    var next;

    if (
      old &&
      old.getAttribute("data-avatar-service") === service &&
      old.getAttribute("data-avatar-text") === avatarText
    ) {
      return;
    }

    next = makeMailAvatar(service, avatarText);
    if (old) {
      old.parentNode.replaceChild(next, old);
    } else {
      subjectCell.insertBefore(next, subjectCell.firstChild);
    }
  }

  function rowSubjectCell(row) {
    return (
      row.querySelector("td.subject") ||
      row.querySelector("td.fromto") ||
      row.querySelector("td.mail") ||
      row.querySelector("td")
    );
  }

  function normalizeMailRowCells(row, subjectCell) {
    var cells;

    if (!row || !subjectCell) {
      return;
    }

    cells = Array.prototype.filter.call(row.children, function (cell) {
      return cell && cell.tagName && cell.tagName.toLowerCase() === "td";
    });

    if (cells.length <= 1) {
      return;
    }

    subjectCell.colSpan = cells.length;
    subjectCell.setAttribute("data-cybrense-colspan", String(cells.length));

    cells.forEach(function (cell) {
      if (cell === subjectCell) {
        cell.classList.remove("cybrense-extra-cell");
        cell.removeAttribute("aria-hidden");
        return;
      }

      cell.classList.add("cybrense-extra-cell");
      cell.setAttribute("aria-hidden", "true");
    });
  }

  function renderRowAssignedLabels(row, store) {
    var uid = rowUid(row);
    var subjectCell = rowSubjectCell(row);
    var labels = uid ? normalizeLabelList(store.messages[messageKey(uid)]) : [];
    var signature = labels.join("|");
    var old = subjectCell && subjectCell.querySelector(".cybrense-assigned-labels");

    if (!subjectCell) {
      return;
    }

    if (subjectCell.getAttribute("data-cybrense-labels") === signature) {
      return;
    }

    subjectCell.setAttribute("data-cybrense-labels", signature);

    if (old) {
      old.remove();
    }

    row.classList.toggle("cybrense-has-labels", labels.length > 0);

    if (!labels.length) {
      return;
    }

    var container = document.createElement("span");
    container.className = "cybrense-assigned-labels";

    labels.forEach(function (labelId) {
      var label = labelById(labelId, store);
      var chip;

      if (!label) {
        return;
      }

      chip = document.createElement("span");
      chip.className = "cybrense-assigned-label";
      chip.setAttribute("data-color", label.color);
      chip.textContent = label.name;
      container.appendChild(chip);
    });

    subjectCell.appendChild(container);
  }

  function applyRowLabelFilter(row, store) {
    if (!activeLabelFilter) {
      row.classList.remove("cybrense-label-hidden");
      return;
    }

    var uid = rowUid(row);
    var labels = uid ? normalizeLabelList(store.messages[messageKey(uid)]) : [];
    row.classList.toggle("cybrense-label-hidden", labels.indexOf(activeLabelFilter) === -1);
    if (row.classList.contains("cybrense-label-hidden")) {
      row.classList.remove("cybrense-row-action-active");
    }
  }

  function applyMessageLabels() {
    if (!isMailTask()) {
      return;
    }

    var store = readLabelStore();
    Array.prototype.forEach.call(document.querySelectorAll("#messagelist tr"), function (row) {
      if (!row.querySelector("td")) {
        return;
      }

      renderRowAssignedLabels(row, store);
      applyRowLabelFilter(row, store);
    });
  }

  function compactMailDate(value) {
    var original = String(value || "").replace(/\s+/g, " ").trim();
    var match = original.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?/);
    var relativeMatch = original.match(/^(aujourd[’']?hui|today)\b(?:.*?(\d{1,2}:\d{2}))?/i);
    var yesterdayMatch = original.match(/^(hier|yesterday)\b(?:.*?(\d{1,2}:\d{2}))?/i);
    var parsed;

    function shortDate(date) {
      return [
        String(date.getDate()).padStart(2, "0"),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getFullYear()).slice(2)
      ].join("/");
    }

    if (relativeMatch) {
      return shortDate(new Date());
    }

    if (yesterdayMatch) {
      parsed = new Date();
      parsed.setDate(parsed.getDate() - 1);
      return shortDate(parsed);
    }

    if (!match) {
      return original;
    }

    parsed = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4] || 0),
      Number(match[5] || 0)
    );

    if (Number.isNaN(parsed.getTime())) {
      return original;
    }

    return shortDate(parsed);
  }

  function normalizeMailRowDate(row) {
    var subjectCell = rowSubjectCell(row);
    var source = row.querySelector("td.subject span.date, td.date span, span.date, td.date");
    var date = source;
    var original;
    var compact;

    if (!source) {
      return;
    }

    if (subjectCell && (!subjectCell.contains(source) || source.tagName.toLowerCase() === "td")) {
      date = subjectCell.querySelector("span.date.cybrense-row-date");

      if (!date) {
        date = document.createElement("span");
        date.className = "date cybrense-row-date";
        subjectCell.appendChild(date);
      }

      source.classList.add("cybrense-date-source");
      source.setAttribute("aria-hidden", "true");

      if (source.closest("td") && source.closest("td") !== subjectCell) {
        source.closest("td").classList.add("cybrense-date-source-cell");
        source.closest("td").setAttribute("aria-hidden", "true");
      }
    }

    original = source.getAttribute("data-cybrense-original-date") || source.textContent;
    compact = compactMailDate(original);
    date.setAttribute("data-cybrense-original-date", original);
    date.setAttribute("title", original);

    if (compact) {
      date.textContent = compact;
    }
  }

  function floatingRowMenu() {
    return document.querySelector(".listing-hover-menu");
  }

  function clearRowActionMenu() {
    var menu = floatingRowMenu();

    Array.prototype.forEach.call(document.querySelectorAll("#messagelist tr.cybrense-row-action-active"), function (row) {
      row.classList.remove("cybrense-row-action-active");
    });

    if (menu) {
      menu.classList.add("cybrense-row-action-menu-hidden");
      menu.setAttribute("aria-hidden", "true");
    }
  }

  function targetRowForActions(row) {
    if (row && row.querySelector && row.querySelector("td") && !row.classList.contains("cybrense-label-hidden")) {
      return row;
    }

    return (
      document.querySelector("#messagelist tr.cybrense-row-action-active:not(.cybrense-label-hidden)") ||
      document.querySelector("#messagelist tr.selected:not(.cybrense-label-hidden)") ||
      document.querySelector("#messagelist tr.focused:not(.cybrense-label-hidden)") ||
      document.querySelector("#messagelist tr.cybrense-row-enhanced:not(.cybrense-label-hidden)")
    );
  }

  function moveRowActionMenu(row) {
    var menu = floatingRowMenu();
    var target = targetRowForActions(row);
    var cell;

    if (!menu) {
      return;
    }

    if (!target || target.classList.contains("cybrense-label-hidden")) {
      clearRowActionMenu();
      return;
    }

    cell = rowSubjectCell(target) || target.querySelector("td");
    if (!cell) {
      clearRowActionMenu();
      return;
    }

    cell.classList.add("cybrense-row-actions-cell");
    cell.style.setProperty("position", "relative", "important");
    menu.classList.remove("cybrense-row-action-menu-hidden");
    menu.setAttribute("aria-hidden", "false");
    menu.classList.add("cybrense-row-action-menu");
    menu.style.setProperty("position", "absolute", "important");
    menu.style.setProperty("top", "50%", "important");
    menu.style.setProperty("right", "10px", "important");
    menu.style.setProperty("bottom", "auto", "important");
    menu.style.setProperty("left", "auto", "important");
    menu.style.setProperty("transform", "translateY(-50%)", "important");

    if (menu.parentNode !== cell) {
      cell.appendChild(menu);
    }
  }

  function bindRowActionTargeting() {
    var list = document.querySelector("#messagelist");
    if (!list || list.getAttribute("data-cybrense-row-actions") === "true") {
      return;
    }

    list.setAttribute("data-cybrense-row-actions", "true");
    list.addEventListener("mouseleave", function () {
      clearRowActionMenu();
    });

    list.addEventListener("mouseover", function (event) {
      var row = event.target.closest("#messagelist tr");
      if (!row || !row.querySelector("td") || row.classList.contains("cybrense-label-hidden")) {
        clearRowActionMenu();
        return;
      }

      Array.prototype.forEach.call(list.querySelectorAll(".cybrense-row-action-active"), function (activeRow) {
        if (activeRow !== row) {
          activeRow.classList.remove("cybrense-row-action-active");
        }
      });
      row.classList.add("cybrense-row-action-active");
      moveRowActionMenu(row);
      window.setTimeout(function () {
        moveRowActionMenu(row);
      }, 40);
    });

    list.addEventListener("click", function (event) {
      var row = event.target.closest("#messagelist tr");
      if (row && row.querySelector("td") && !row.classList.contains("cybrense-label-hidden")) {
        row.classList.add("cybrense-row-action-active");
        window.setTimeout(function () {
          moveRowActionMenu(row);
        }, 40);
      }
    });
  }

  function openMessageFromMobileRow(row) {
    var uid = rowUid(row);
    var mbox;

    if (!uid || !window.rcmail) {
      return;
    }

    if (window.rcmail.preview_timer) {
      window.clearTimeout(window.rcmail.preview_timer);
      window.rcmail.preview_timer = null;
    }

    mbox = typeof window.rcmail.get_message_mailbox === "function" ? window.rcmail.get_message_mailbox(uid) : "";
    if (mbox && window.rcmail.env && mbox === window.rcmail.env.drafts_mailbox && typeof window.rcmail.open_compose_step === "function") {
      window.rcmail.open_compose_step({ _draft_uid: uid, _mbox: mbox });
      return;
    }

    if (
      window.rcmail.message_list &&
      typeof window.rcmail.message_list.select === "function"
    ) {
      window.rcmail.message_list.select(uid);
      if (window.rcmail.preview_timer) {
        window.clearTimeout(window.rcmail.preview_timer);
        window.rcmail.preview_timer = null;
      }
    }

    if (typeof window.rcmail.show_message === "function") {
      window.rcmail.show_message(uid);
      return;
    }

    window.location.href = "?_task=mail&_action=show&_uid=" + encodeURIComponent(uid);
  }

  function isMobileRowOpenControl(event, row) {
    var target = event.target;

    if (!target || !row) {
      return true;
    }

    return !!target.closest(
      "button, input, select, textarea, .listing-hover-menu, .cybrense-row-action-menu, .flagged, .unflagged, .threads, .selection, .select"
    );
  }

  function bindMobileMessageOpen() {
    var list = document.querySelector("#messagelist");
    var pointerRow = null;
    var pointerX = 0;
    var pointerY = 0;

    if (!list || list.getAttribute("data-cybrense-mobile-open") === "true") {
      return;
    }

    list.setAttribute("data-cybrense-mobile-open", "true");
    function shouldOpenMobileRow(event) {
      var row;

      if (!document.body.classList.contains("cybrense-ui-phone") && !document.body.classList.contains("cybrense-ui-narrow")) {
        return null;
      }

      row = event.target.closest("#messagelist tr");
      if (!row || !row.querySelector("td") || row.classList.contains("cybrense-label-hidden")) {
        return null;
      }

      if (isMobileRowOpenControl(event, row)) {
        return null;
      }

      return row;
    }

    function openFromEvent(event, row) {
      if (!row) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }

      window.setTimeout(function () {
        openMessageFromMobileRow(row);
      }, 20);
    }

    list.addEventListener("pointerdown", function (event) {
      pointerRow = shouldOpenMobileRow(event);
      pointerX = event.clientX || 0;
      pointerY = event.clientY || 0;
    }, true);

    list.addEventListener("pointerup", function (event) {
      var row = shouldOpenMobileRow(event);
      var dx = Math.abs((event.clientX || 0) - pointerX);
      var dy = Math.abs((event.clientY || 0) - pointerY);

      if (!row || row !== pointerRow || dx > 12 || dy > 12) {
        return;
      }

      pointerRow = null;
      openFromEvent(event, row);
    }, true);

    list.addEventListener("click", function (event) {
      openFromEvent(event, shouldOpenMobileRow(event));
    }, true);
  }

  function isMobileMailLayout() {
    return (
      isMailTask() &&
      isCompactAppLayout()
    );
  }

  function setMobileMailPane(name) {
    var sidebar = document.querySelector("#layout-sidebar");
    var list = document.querySelector("#layout-list");
    var content = document.querySelector("#layout-content");
    var panes = { folders: sidebar, list: list, content: content };

    if (!isMobileMailLayout()) {
      return;
    }

    Object.keys(panes).forEach(function (key) {
      if (panes[key]) {
        panes[key].classList.toggle("selected", key === name);
      }
    });
  }

  function syncMobileMailPane() {
    if (!isMobileMailLayout()) {
      return;
    }

    if (document.body.classList.contains("action-show") || document.body.classList.contains("action-compose")) {
      setMobileMailPane("content");
      return;
    }

    setMobileMailPane("list");
  }

  function bindMobilePaneNavigation() {
    var layout = document.querySelector("#layout");

    if (!layout || layout.getAttribute("data-cybrense-mobile-pane-nav") === "true") {
      return;
    }

    layout.setAttribute("data-cybrense-mobile-pane-nav", "true");
    document.addEventListener("click", function (event) {
      var backToList;
      var menuButton;
      var folderButton;

      menuButton = event.target.closest && event.target.closest("a.task-menu-button[href='#menu'], a.toolbar-menu-button[href='#menu'], a.button[href='#menu']");
      if (menuButton && openMobileDrawer("menu")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (!isMobileMailLayout()) {
        return;
      }

      backToList = event.target.closest && event.target.closest("#layout-content > .header > a.back-list-button, #layout-content a.back-list-button");
      if (backToList) {
        event.preventDefault();
        event.stopPropagation();
        closeMobileDrawers();
        setMobileMailPane("list");
        return;
      }

      folderButton = event.target.closest && event.target.closest("a.back-sidebar-button[href='#sidebar'], a.button[href='#sidebar']");
      if (folderButton && openMobileDrawer("folders")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  }

  function updateLabelCounts() {
    var labels = document.querySelector(".cybrense-labels");
    var store;
    var counts = {};
    var mailbox;

    if (!labels) {
      return;
    }

    store = readLabelStore();
    mailbox = (window.rcmail && window.rcmail.env && window.rcmail.env.mailbox) || "";

    Object.keys(store.messages).forEach(function (key) {
      if (mailbox && key.indexOf(mailbox + "|") !== 0) {
        return;
      }

      normalizeLabelList(store.messages[key]).forEach(function (labelId) {
        counts[labelId] = (counts[labelId] || 0) + 1;
      });
    });

    Array.prototype.forEach.call(labels.querySelectorAll(".cybrense-label-item"), function (button) {
      var labelId = button.getAttribute("data-label-id");
      var count = counts[labelId] || 0;
      var counter = button.querySelector(".cybrense-label-count");

      button.classList.toggle("active", activeLabelFilter === labelId);

      if (counter) {
        counter.textContent = count ? String(count) : "";
      }
    });
  }

  function enhanceMessageList() {
    if (!isMailTask()) {
      return;
    }

    var store = readLabelStore();
    bindRowActionTargeting();
    var rows = document.querySelectorAll("#messagelist tr");
    Array.prototype.forEach.call(rows, function (row) {
      if (!row.querySelector("td")) {
        return;
      }

      var text = (row.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) {
        return;
      }

      var subjectCell = rowSubjectCell(row);

      if (!subjectCell) {
        return;
      }

      var service = serviceFromText(text.toLowerCase());
      subjectCell.classList.add("cybrense-subject-cell");
      normalizeMailRowCells(row, subjectCell);
      normalizeMailRowDate(row);

      if (row.classList.contains("cybrense-row-enhanced")) {
        row.setAttribute("data-cybrense-service", service);
        ensureMailAvatar(row, subjectCell, service, text);
        renderRowAssignedLabels(row, store);
        applyRowLabelFilter(row, store);
        return;
      }

      row.classList.add("cybrense-row-enhanced");
      row.setAttribute("data-cybrense-service", service);
      ensureMailAvatar(row, subjectCell, service, text);

      if (!subjectCell.querySelector(".cybrense-row-status")) {
        var status = document.createElement("span");
        status.className = "cybrense-row-status";
        status.setAttribute("aria-hidden", "true");
        var anchor =
          subjectCell.querySelector(".fromto") ||
          subjectCell.querySelector(".sender") ||
          subjectCell.querySelector(".subject") ||
          subjectCell.firstChild;
        subjectCell.insertBefore(status, anchor);
      }

      if (
        !row.querySelector(".cybrense-mail-tag") &&
        (service === "slack" || text.toLowerCase().indexOf("secur") !== -1)
      ) {
        var tag = document.createElement("span");
        tag.className = "cybrense-mail-tag";
        tag.textContent = service === "slack" ? "Securite" : "Cybrense";
        subjectCell.appendChild(tag);
      }

      renderRowAssignedLabels(row, store);
      applyRowLabelFilter(row, store);
    });

    moveRowActionMenu();
  }

  function enhanceWatermarkFrame() {
    var frame = document.querySelector("#messagecontframe");
    if (!frame) {
      return;
    }

    function paintFrame() {
      var doc;
      try {
        doc = frame.contentDocument;
      } catch (error) {
        return;
      }

      if (!doc || !doc.body) {
        return;
      }

      enhanceRemoteObjectsBanner(doc);
      bindRemoteObjectActions(doc);

      var frameUrl = "";
      try {
        frameUrl = frame.contentWindow.location.href;
      } catch (error) {
        frameUrl = "";
      }

      var isWatermark = frameUrl.indexOf("watermark.html") !== -1 || doc.body.childElementCount === 0;
      if (!isWatermark) {
        return;
      }

      doc.documentElement.classList.remove("dark-mode");
      doc.documentElement.style.background = "#ffffff";
      doc.body.style.cssText = [
        "height:100%",
        "margin:0",
        "overflow:hidden",
        "background:#ffffff",
        "font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        "color:#7a8798"
      ].join(";");

      if (!doc.querySelector(".cybrense-empty-pane")) {
        doc.body.innerHTML = [
          '<div class="cybrense-empty-pane" style="height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#fff;">',
          '<div style="width:66px;height:66px;border-radius:20px;background:#eef5ff;display:flex;align-items:center;justify-content:center;color:#0969ff;font-size:28px;">&#9993;</div>',
          '<strong style="color:#12213a;font-size:16px;">Aucun message selectionne</strong>',
          '<span style="font-size:13px;">Choisissez un courrier pour l afficher ici.</span>',
          "</div>"
        ].join("");
      }
    }

    if (frame.getAttribute("data-cybrense-watermark-bound") !== "true") {
      frame.setAttribute("data-cybrense-watermark-bound", "true");
      frame.addEventListener("load", paintFrame);
    }
    paintFrame();
  }

  function enhanceRemoteObjectsBanner(root) {
    var scope = root || document;
    var banners = scope.querySelectorAll("#remote-objects-message, .remote-objects-message");
    Array.prototype.forEach.call(banners, function (banner) {
      var links = banner.querySelectorAll("a");
      var target = remoteCommandTarget(scope.defaultView || window);
      var sender = remoteSenderValue(target, links[0] || banner);

      banner.classList.add("cybrense-remote-banner");
      if (isRemoteSenderTrusted(sender)) {
        hideRemoteBanner(banner);
        return;
      }

      Array.prototype.forEach.call(links, function (link, index) {
        var text = (link.textContent || "").toLowerCase();
        link.classList.add(index === 0 ? "cybrense-remote-allow" : "cybrense-remote-always");
        link.setAttribute("data-cybrense-remote-action", "true");

        if (text.indexOf("toujours") !== -1 || text.indexOf("always") !== -1) {
          link.classList.remove("cybrense-remote-allow");
          link.classList.add("cybrense-remote-always");
        }

        link.onclick = function (event) {
          return handleRemoteObjectClick(event, link, scope.defaultView || window);
        };
      });
    });
  }

  var remoteObjectActionsBound = false;
  var REMOTE_TRUST_STORE_KEY = "cybrense.remote.trusted.v1";

  function remoteTrustStoreKey() {
    return REMOTE_TRUST_STORE_KEY + "." + labelAccountKey().replace(/[^a-z0-9@._+-]+/gi, "-");
  }

  function remoteCommandTarget(contextWindow) {
    var win = contextWindow || window;

    if (win.rcmail && typeof win.rcmail.command === "function") {
      return win.rcmail;
    }

    try {
      if (win.parent && win.parent !== win && win.parent.rcmail && typeof win.parent.rcmail.command === "function") {
        return win.parent.rcmail;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function parseRemoteAlwaysArgument(link) {
    var onclick = link.getAttribute("onclick") || "";
    var match = onclick.match(/load-remote['"]?\s*,\s*([^)]+)/);
    var value;

    if (!match) {
      return true;
    }

    value = match[1].trim().replace(/;$/, "");
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    if (/^-?\d+$/.test(value)) {
      return Number(value);
    }

    return value.replace(/^['"]|['"]$/g, "");
  }

  function normalizeRemoteSender(value) {
    var match = String(value || "").match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
    return match ? match[0].toLowerCase() : "";
  }

  function readRemoteTrustStore() {
    var storageKey = remoteTrustStoreKey();
    var values;

    try {
      values = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      if (Array.isArray(values)) {
        return values;
      }

      values = JSON.parse(window.localStorage.getItem(REMOTE_TRUST_STORE_KEY) || "[]");
      if (Array.isArray(values) && values.length) {
        window.localStorage.setItem(storageKey, JSON.stringify(values));
      }

      return Array.isArray(values) ? values : [];
    } catch (error) {
      return [];
    }
  }

  function writeRemoteTrustStore(values) {
    try {
      window.localStorage.setItem(remoteTrustStoreKey(), JSON.stringify(unique(values)));
    } catch (error) {
      // Local trust is a convenience cache; server-side prefs remain authoritative.
    }
  }

  function trustRemoteSender(sender) {
    var email = normalizeRemoteSender(sender);
    var trusted;

    if (!email) {
      return;
    }

    trusted = readRemoteTrustStore().map(normalizeRemoteSender).filter(Boolean);
    if (trusted.indexOf(email) === -1) {
      trusted.push(email);
      writeRemoteTrustStore(trusted);
    }
  }

  function isRemoteSenderTrusted(sender) {
    var email = normalizeRemoteSender(sender);
    var trusted;

    if (!email) {
      return false;
    }

    trusted = readRemoteTrustStore().map(normalizeRemoteSender).filter(Boolean);
    if (trusted.indexOf(email) !== -1) {
      return true;
    }

    if (window.rcmail && window.rcmail.env && Array.isArray(window.rcmail.env.cybrense_trusted_remote_senders)) {
      return window.rcmail.env.cybrense_trusted_remote_senders.map(normalizeRemoteSender).indexOf(email) !== -1;
    }

    return false;
  }

  function hideRemoteBanner(banner) {
    if (!banner) {
      return;
    }

    banner.classList.add("cybrense-remote-authorized");
    banner.setAttribute("aria-hidden", "true");
    banner.style.setProperty("display", "none", "important");
  }

  function hideRemoteBanners(doc) {
    var scope = doc || document;
    var banners = scope.querySelectorAll("#remote-objects-message, .remote-objects-message");

    Array.prototype.forEach.call(banners, hideRemoteBanner);
  }

  function remoteSenderValue(target, link) {
    var value = target && target.env && target.env.sender;
    var doc;
    var header;
    var text;
    var match;

    if (value) {
      return normalizeRemoteSender(value);
    }

    doc = link && link.ownerDocument;
    header = doc && doc.querySelector("#message-header");
    text = [
      (link && link.textContent) || "",
      (header && header.textContent) || "",
      (doc && doc.body && doc.body.textContent) || ""
    ].join(" ");
    match = text.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
    return match ? normalizeRemoteSender(match[0]) : "";
  }

  function handleRemoteObjectClick(event, link, contextWindow) {
    var href = link && link.getAttribute("href") || "";
    var isRemoteAction = link && (
      href.indexOf("#loadremote") === 0
      || link.classList.contains("cybrense-remote-allow")
      || link.classList.contains("cybrense-remote-always")
      || link.getAttribute("data-cybrense-remote-action") === "true"
    );
    var doc = link && link.ownerDocument || document;
    var target;
    var always;
    var sender;
    var banner;

    if (!isRemoteAction) {
      return true;
    }

    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    }

    target = remoteCommandTarget(contextWindow || doc.defaultView || window);
    always = href.indexOf("always") !== -1 || link.classList.contains("cybrense-remote-always") || /toujours|always/i.test(link.textContent || "");
    sender = remoteSenderValue(target, link);
    banner = link.closest && link.closest("#remote-objects-message, .remote-objects-message");

    hideRemoteBanner(banner);

    if (always) {
      trustRemoteSender(sender);

      if (target && typeof target.http_post === "function") {
        target.http_post("plugin.cybrense_trust_sender", {
          _sender: sender
        });
      }
    }

    if (target && typeof target.command === "function") {
      target.command("load-remote", parseRemoteAlwaysArgument(link), link, event || null, true);
    }

    window.setTimeout(function () {
      hideRemoteBanners(doc);
    }, 120);

    return false;
  }

  function bindRemoteObjectActions(root) {
    var doc = root || document;
    var marker = doc.documentElement || doc.body;

    if (!doc || !marker) {
      return;
    }

    if (doc === document) {
      if (remoteObjectActionsBound) {
        return;
      }

      remoteObjectActionsBound = true;
    } else if (marker.getAttribute("data-cybrense-remote-actions-bound") === "true") {
      return;
    }

    marker.setAttribute("data-cybrense-remote-actions-bound", "true");
    doc.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("#remote-objects-message a, .remote-objects-message a");
      if (!link) {
        return;
      }

      handleRemoteObjectClick(event, link, doc.defaultView || window);
    }, true);
  }

  function renderMessageLabelPicker() {
    var info = currentMessageInfo();
    var header = document.querySelector("#message-header");
    var anchor = header && (header.querySelector(":scope > .header") || header);
    var existing = document.querySelector(".cybrense-message-labels");
    var store;
    var activeLabels;
    var list;
    var assignButton;

    if (!info || !anchor) {
      if (existing) {
        existing.remove();
      }
      return;
    }

    store = readLabelStore();
    activeLabels = normalizeLabelList(store.messages[messageKeyFor(info.uid, info.mailbox)]);

    if (!existing) {
      existing = document.createElement("div");
      existing.className = "cybrense-message-labels is-open";
      existing.innerHTML = [
        '<div class="cybrense-message-labels-top">',
        '<div class="cybrense-message-labels-title">Etiquettes</div>',
        '<button type="button" class="cybrense-label-assign-button" aria-expanded="true">Assigner</button>',
        '</div>',
        '<div class="cybrense-message-labels-list"></div>'
      ].join("");

      existing.addEventListener("click", function (event) {
        var toggle = event.target.closest(".cybrense-label-assign-button");
        var button = event.target.closest(".cybrense-message-label-chip");

        if (toggle) {
          event.preventDefault();
          existing.classList.add("is-open");
          toggle.setAttribute("aria-expanded", "true");
          return;
        }

        if (!button) {
          return;
        }

        toggleLabelForMessage(currentMessageInfo(), button.getAttribute("data-label-id"));
        existing.classList.add("is-open");
        assignButton = existing.querySelector(".cybrense-label-assign-button");
        if (assignButton) {
          assignButton.setAttribute("aria-expanded", "true");
        }
      });

      anchor.insertAdjacentElement("afterend", existing);
    }

    existing.setAttribute("data-message-key", messageKeyFor(info.uid, info.mailbox));
    existing.classList.add("is-open");
    assignButton = existing.querySelector(".cybrense-label-assign-button");
    if (assignButton) {
      assignButton.classList.add("is-status");
      assignButton.setAttribute("aria-expanded", "true");
      assignButton.setAttribute("aria-disabled", "true");
      assignButton.textContent = "Etiquettes (" + activeLabels.length + ")";
      assignButton.title = "Cliquez directement sur une etiquette pour l'ajouter ou la retirer";
    }

    list = existing.querySelector(".cybrense-message-labels-list");
    list.innerHTML = "";

    store.labels.forEach(function (label) {
      var button = document.createElement("button");
      var active = activeLabels.indexOf(label.id) !== -1;

      button.type = "button";
      button.className = "cybrense-message-label-chip";
      button.setAttribute("data-label-id", label.id);
      button.setAttribute("data-color", label.color);
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.setAttribute("aria-label", (active ? "Retirer " : "Ajouter ") + label.name);
      button.setAttribute("data-label-state", active ? "assigned" : "available");
      button.title = active ? "Retirer " + label.name : "Ajouter " + label.name;
      button.textContent = label.name;

      if (active) {
        button.classList.add("active");
      }

      list.appendChild(button);
    });
  }

  function syncMessageListState() {
    var content = document.querySelector("#messagelist-content");
    var empty;
    var activeLabel;
    if (!content) {
      return;
    }

    var hasVisibleRows = Array.prototype.some.call(document.querySelectorAll("#messagelist tr"), function (row) {
      return row.querySelector("td") && !row.classList.contains("cybrense-label-hidden");
    });

    content.classList.toggle("cybrense-has-messages", hasVisibleRows);
    document.body.classList.toggle("cybrense-label-filter-active", !!activeLabelFilter);
    if (!hasVisibleRows) {
      clearRowActionMenu();
    }

    empty = content.querySelector(".cybrense-filter-empty");
    if (!activeLabelFilter || hasVisibleRows) {
      if (empty) {
        empty.remove();
      }
      return;
    }

    activeLabel = labelById(activeLabelFilter);
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "cybrense-filter-empty";
      content.appendChild(empty);
    }

    empty.innerHTML = [
      '<div class="cybrense-filter-empty-icon"></div>',
      "<strong>Aucun email avec cette etiquette</strong>",
      "<span>",
      activeLabel ? activeLabel.name : "Etiquette",
      "</span>"
    ].join("");
  }

  var mailObserver;
  var mailEnhanceTimer;

  function runMailEnhancements() {
    syncViewportClasses();
    setupResponsiveObserver();
    applyResizableLayout();
    enhanceMenu();
    enhanceFolderPane();
    simplifyListToolbar();
    bindMobileDrawers();
    bindMobilePaneNavigation();
    bindLabelControls();
    enhanceQuotaWidget();
    enhanceMessageList();
    bindMobileMessageOpen();
    applyMessageLabels();
    syncMessageListState();
    updateLabelCounts();
    enhanceRemoteObjectsBanner();
    bindRemoteObjectActions();
    renderMessageLabelPicker();
    enhanceWatermarkFrame();
    syncMobileMailPane();
  }

  function scheduleMailEnhancements() {
    window.clearTimeout(mailEnhanceTimer);
    mailEnhanceTimer = window.setTimeout(runMailEnhancements, 80);
  }

  function watchMailScreen() {
    if (document.body.classList.contains("task-login") || mailObserver) {
      return;
    }

    var target = document.querySelector("#layout") || document.body;
    if (!target || typeof MutationObserver !== "function") {
      return;
    }

    mailObserver = new MutationObserver(scheduleMailEnhancements);
    mailObserver.observe(target, { childList: true, subtree: true });
  }

  ready(function () {
    forceLightMode();
    syncViewportClasses();
    runMailEnhancements();
    watchMailScreen();
  });

  if (window.rcmail && typeof window.rcmail.addEventListener === "function") {
    window.rcmail.addEventListener("init", function () {
      forceLightMode();
      runMailEnhancements();
      watchMailScreen();
    });

    window.rcmail.addEventListener("afterlist", scheduleMailEnhancements);
    window.rcmail.addEventListener("listupdate", scheduleMailEnhancements);
    window.rcmail.addEventListener("responseafterlist", scheduleMailEnhancements);
  }

  window.addEventListener("cybrense-labels-updated", scheduleMailEnhancements);
  window.addEventListener("resize", scheduleMailEnhancements);
  window.addEventListener("storage", function (event) {
    if (
      !event ||
      event.key === LAYOUT_STORE_KEY ||
      event.key === LABEL_STORE_KEY ||
      event.key === labelStoreKey() ||
      String(event.key || "").indexOf(LABEL_STORE_KEY + ".") !== -1
    ) {
      scheduleMailEnhancements();
    }
  });
})();
