// ==UserScript==
// @name           Reduced Motion Spaces
// @description    Switch spaces instantly when reduced motion is on.
// @include        chrome://browser/content/browser.xhtml
// ==/UserScript==

(() => {
  const DURATION = "zen.workspaces.switch-animation-duration";
  // The duration the user had before we set it to 0. -1 means Zen's default.
  const SAVED = "zen.mods.reduced-motion-spaces.saved-duration";
  const FLAG = "__zenReducedMotionSpaces";
  const prefs = Services.prefs;
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");

  const reduce = () => {
    if (!prefs.prefHasUserValue(SAVED)) {
      const saved = prefs.prefHasUserValue(DURATION) ? prefs.getIntPref(DURATION) : -1;
      if (saved === 0) {
        return; // Already instant by the user's own choice.
      }
      prefs.setIntPref(SAVED, saved);
    }
    prefs.setIntPref(DURATION, 0);
  };

  const restore = () => {
    if (!prefs.prefHasUserValue(SAVED)) {
      return;
    }
    const saved = prefs.getIntPref(SAVED);
    if (saved < 0) {
      prefs.clearUserPref(DURATION);
    } else {
      prefs.setIntPref(DURATION, saved);
    }
    prefs.clearUserPref(SAVED);
  };

  const apply = () => (query.matches ? reduce() : restore());

  query.addEventListener("change", apply);
  window[FLAG] = true;
  apply();

  // Sine calls this when the mod is disabled or removed, and when this window closes.
  window.addUnloadListener?.(() => {
    query.removeEventListener("change", apply);
    delete window[FLAG];
    const othersActive = [...Services.wm.getEnumerator("navigator:browser")].some(
      w => w !== window && w[FLAG]
    );
    if (!othersActive) {
      restore();
    }
  });
})();
