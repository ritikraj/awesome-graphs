/*!
 * Awesome Graphs v2 — tooltip
 * One shared tooltip element for every chart on the page.
 */
(function (global) {
    'use strict';

    const AG = (global.AwesomeGraphs = global.AwesomeGraphs || {});
    const OFFSET = 14;

    const STYLES = `
.ag-tooltip {
    position: fixed; top: 0; left: 0; z-index: 2147483000; pointer-events: none;
    min-width: 96px; max-width: 240px; padding: 8px 12px; border-radius: 10px;
    background: var(--ag-tooltip-bg, rgba(17, 24, 39, .94)); color: var(--ag-tooltip-text, #fff);
    font: 500 13px/1.35 var(--ag-font, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
    box-shadow: 0 8px 24px rgba(0, 0, 0, .18);
    opacity: 0; transform: translateY(4px); transition: opacity .12s ease, transform .12s ease;
}
.ag-tooltip.is-visible { opacity: 1; transform: none; }
.ag-tooltip__title { display: flex; align-items: center; gap: 6px; opacity: .75; font-size: 12px; }
.ag-tooltip__swatch { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.ag-tooltip__value { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ag-tooltip__meta { font-size: 12px; font-weight: 600; }
`;

    let element = null;

    function ensureElement() {
        if (element) return element;
        const style = document.createElement('style');
        style.setAttribute('data-awesome-graphs', 'tooltip');
        style.textContent = STYLES;
        document.head.appendChild(style);

        element = document.createElement('div');
        element.className = 'ag-tooltip';
        element.setAttribute('role', 'tooltip');
        document.body.appendChild(element);
        // The tooltip is position: fixed, so any scroll would leave it floating in the wrong place.
        global.addEventListener('scroll', () => AG.tooltip.hide(), { passive: true, capture: true });
        return element;
    }

    function row(className, text, color) {
        const node = document.createElement('div');
        node.className = className;
        node.textContent = text;
        if (color) node.style.color = color;
        return node;
    }

    /** Content is always set via textContent, so data can never inject markup. */
    function render(el, content) {
        el.replaceChildren();
        if (typeof content !== 'object' || content === null) {
            el.appendChild(row('ag-tooltip__value', content));
            return;
        }
        if (content.title != null) {
            const title = row('ag-tooltip__title', '');
            if (content.color) {
                const swatch = document.createElement('span');
                swatch.className = 'ag-tooltip__swatch';
                swatch.style.background = content.color;
                title.appendChild(swatch);
            }
            title.appendChild(document.createTextNode(content.title));
            el.appendChild(title);
        }
        if (content.value != null) el.appendChild(row('ag-tooltip__value', content.value));
        if (content.meta != null) el.appendChild(row('ag-tooltip__meta', content.meta, content.metaColor));
    }

    AG.tooltip = {
        /** @param content string | { title, value, meta, metaColor, color } */
        show(content, clientX, clientY) {
            const el = ensureElement();
            render(el, content);
            const { width, height } = el.getBoundingClientRect();
            const vw = document.documentElement.clientWidth;
            const vh = document.documentElement.clientHeight;
            let x = clientX + OFFSET;
            let y = clientY + OFFSET;
            if (x + width > vw - 8) x = clientX - width - OFFSET;
            if (y + height > vh - 8) y = clientY - height - OFFSET;
            el.style.left = Math.max(8, x) + 'px';
            el.style.top = Math.max(8, y) + 'px';
            el.classList.add('is-visible');
        },

        hide() {
            if (element) element.classList.remove('is-visible');
        },
    };
})(window);
