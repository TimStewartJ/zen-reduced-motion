// ==UserScript==
// @name           Reduced Motion for Zen
// @description    Turns off Zen animations that ignore reduced motion, while reduced motion is on.
// @include        chrome://browser/content/browser.xhtml
// ==/UserScript==

(() => {
  const BRANCH = "zen.mods.reduced-motion.";
  // Zen's own settings, and what each is set to while reduced motion is on.
  const AREAS = {
    spaces: { pref: "zen.workspaces.switch-animation-duration", value: 0 },
    "compact-sidebar": { pref: "zen.view.compact.animate-sidebar", value: false },
    downloads: { pref: "zen.downloads.download-animation", value: false },
  };
  // What each setting was before we changed it. null means Zen's default.
  const SAVED = `${BRANCH}saved`;
  const LEGACY_SAVED = "zen.mods.reduced-motion-spaces.saved-duration";
  const FLAG = "__zenReducedMotion";
  const prefs = Services.prefs;
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Every area is on by default. chrome.css reads these too, so they need a real default.
  const defaults = prefs.getDefaultBranch("");
  for (const name of Object.keys(AREAS)) {
    if (defaults.getPrefType(BRANCH + name) === prefs.PREF_INVALID) {
      defaults.setBoolPref(BRANCH + name, true);
    }
  }

  const read = pref =>
    typeof AREAS[pref]?.value === "boolean" || prefs.getPrefType(pref) === prefs.PREF_BOOL
      ? prefs.getBoolPref(pref)
      : prefs.getIntPref(pref);
  const write = (pref, value) =>
    typeof value === "boolean" ? prefs.setBoolPref(pref, value) : prefs.setIntPref(pref, value);
  const loadSaved = () => JSON.parse(prefs.getStringPref(SAVED, "{}"));
  const storeSaved = saved =>
    Object.keys(saved).length
      ? prefs.setStringPref(SAVED, JSON.stringify(saved))
      : prefs.clearUserPref(SAVED);

  // Version 1 of this mod saved only the space switch duration.
  if (prefs.prefHasUserValue(LEGACY_SAVED)) {
    const old = prefs.getIntPref(LEGACY_SAVED);
    const saved = loadSaved();
    saved[AREAS.spaces.pref] ??= old < 0 ? null : old;
    storeSaved(saved);
    prefs.clearUserPref(LEGACY_SAVED);
  }

  const reduce = ({ pref, value }, saved) => {
    if (!(pref in saved)) {
      const current = prefs.prefHasUserValue(pref) ? read(pref) : null;
      if (current === value) {
        return; // Already set this way by the user.
      }
      saved[pref] = current;
    }
    if (read(pref) !== value) {
      write(pref, value);
    }
  };

  const restore = ({ pref }, saved) => {
    if (!(pref in saved)) {
      return;
    }
    if (saved[pref] === null) {
      prefs.clearUserPref(pref);
    } else {
      write(pref, saved[pref]);
    }
    delete saved[pref];
  };

  const sync = () => {
    const saved = loadSaved();
    for (const [name, area] of Object.entries(AREAS)) {
      const wanted = query.matches && prefs.getBoolPref(BRANCH + name, true);
      (wanted ? reduce : restore)(area, saved);
    }
    storeSaved(saved);
  };

  const restoreAll = () => {
    const saved = loadSaved();
    for (const area of Object.values(AREAS)) {
      restore(area, saved);
    }
    storeSaved(saved);
  };

  const observer = {
    observe(_subject, _topic, data) {
      if (data !== SAVED) {
        sync();
      }
    },
  };

  query.addEventListener("change", sync);
  prefs.addObserver(BRANCH, observer);
  window[FLAG] = true;
  sync();

  // Sine calls this when the mod is disabled or removed, and when this window closes.
  window.addUnloadListener?.(() => {
    query.removeEventListener("change", sync);
    prefs.removeObserver(BRANCH, observer);
    delete window[FLAG];
    const othersActive = [...Services.wm.getEnumerator("navigator:browser")].some(
      w => w !== window && w[FLAG]
    );
    if (!othersActive) {
      restoreAll();
    }
  });
})();
