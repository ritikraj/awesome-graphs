/*!
 * Page shell: Classic (v1) / New (v2) tabs.
 * Accessible tablist with arrow-key navigation and deep links (#classic, #new, or any id inside a panel).
 */
(function () {
    'use strict';

    const tabs = Array.from(document.querySelectorAll('[role="tab"][data-tab]'));
    if (!tabs.length) return;

    const panelOf = (tab) => document.getElementById(tab.getAttribute('aria-controls'));

    function select(name, { focus = false } = {}) {
        const current = document.documentElement.dataset.activeTab;
        tabs.forEach((tab) => {
            const active = tab.dataset.tab === name;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            panelOf(tab).hidden = !active;
            if (active && focus) tab.focus();
        });
        document.documentElement.dataset.activeTab = name;
        if (current !== name) window.dispatchEvent(new CustomEvent('ag:tabchange', { detail: { tab: name } }));
    }

    /** Work out which tab a URL hash belongs to. */
    function tabFromHash(hash) {
        const id = decodeURIComponent(hash.replace(/^#/, ''));
        if (!id) return null;
        const direct = tabs.find((tab) => tab.dataset.tab === id);
        if (direct) return direct.dataset.tab;
        const target = document.getElementById(id);
        const panel = target && target.closest('[role="tabpanel"]');
        const owner = panel && tabs.find((tab) => panelOf(tab) === panel);
        return owner ? owner.dataset.tab : null;
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            select(tab.dataset.tab);
            history.replaceState(null, '', '#' + tab.dataset.tab);
            window.scrollTo({ top: 0 });
        });
        tab.addEventListener('keydown', (event) => {
            const last = tabs.length - 1;
            const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: last }[event.key];
            if (next === undefined) return;
            event.preventDefault();
            const target = tabs[(next + tabs.length) % tabs.length];
            select(target.dataset.tab, { focus: true });
            history.replaceState(null, '', '#' + target.dataset.tab);
        });
    });

    /** Select the tab owning the hash, then scroll to the anchor (the browser can't scroll into a hidden panel). */
    function followHash() {
        const name = tabFromHash(location.hash);
        if (!name) return false;
        select(name);
        const anchor = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (anchor && anchor.getAttribute('role') !== 'tabpanel') requestAnimationFrame(() => anchor.scrollIntoView());
        return true;
    }

    window.addEventListener('hashchange', followHash);
    // Default: whichever tab the markup marks as selected (New/v2).
    const initial = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
    if (!followHash()) select(initial.dataset.tab);
})();
