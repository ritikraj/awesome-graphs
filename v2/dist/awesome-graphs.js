/*! Awesome Graphs v2 — bundled 2026-09-15. Source: v2/src */

/* ---- src/core/utils.js ---- */
/*!
 * Awesome Graphs v2 — core utilities
 * Pure helpers for math, data interpolation, DOM lookup and canvas drawing.
 */
(function (global) {
    'use strict';

    const AG = (global.AwesomeGraphs = global.AwesomeGraphs || {});
    const TAU = Math.PI * 2;

    /* ---------------------------------------------------------------- math */

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const lerp = (from, to, t) => from + (to - from) * t;
    const sum = (values) => values.reduce((total, v) => total + (Number(v) || 0), 0);
    const average = (values) => (values.length ? sum(values) / values.length : 0);
    const normalizeAngle = (angle) => ((angle % TAU) + TAU) % TAU;

    const polar = (cx, cy, radius, angle) => ({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
    });

    const easings = {
        linear: (t) => t,
        easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
        easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        easeOutBack: (t) => {
            const c1 = 1.4;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        },
    };

    /* ---------------------------------------------------------------- data */

    const isPlainObject = (value) =>
        value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;

    /** Deep merge plain objects. Arrays and other values are replaced, never merged. */
    function deepMerge(target, ...sources) {
        sources.forEach((source) => {
            if (!isPlainObject(source)) return;
            Object.keys(source).forEach((key) => {
                const value = source[key];
                if (isPlainObject(value)) {
                    target[key] = deepMerge(isPlainObject(target[key]) ? target[key] : {}, value);
                } else if (Array.isArray(value)) {
                    target[key] = value.slice();
                } else if (value !== undefined) {
                    target[key] = value;
                }
            });
        });
        return target;
    }

    /**
     * Interpolate between two data structures made of numbers, arrays and plain objects.
     * Missing `from` values start at 0; non-numeric `to` values snap immediately.
     */
    function interpolate(from, to, t) {
        if (typeof to === 'number') return lerp(typeof from === 'number' ? from : 0, to, t);
        if (Array.isArray(to)) return to.map((v, i) => interpolate(Array.isArray(from) ? from[i] : undefined, v, t));
        if (isPlainObject(to)) {
            const out = {};
            Object.keys(to).forEach((key) => {
                out[key] = interpolate(isPlainObject(from) ? from[key] : undefined, to[key], t);
            });
            return out;
        }
        return to;
    }

    /** Same shape as `value`, with every number replaced by 0. */
    function zeroed(value) {
        if (typeof value === 'number') return 0;
        if (Array.isArray(value)) return value.map(zeroed);
        if (isPlainObject(value)) {
            const out = {};
            Object.keys(value).forEach((key) => (out[key] = zeroed(value[key])));
            return out;
        }
        return value;
    }

    /* ----------------------------------------------------------- formatting */

    function formatNumber(value, decimals = 0) {
        return Number(value).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    function formatDelta(value, decimals = 0) {
        const rounded = Number(value.toFixed(decimals));
        if (rounded === 0) return '±0';
        return (rounded > 0 ? '+' : '−') + formatNumber(Math.abs(rounded), decimals);
    }

    /* ------------------------------------------------------------------ dom */

    /** Accepts an Element, an element id ("chart") or a CSS selector ("#chart .slot"). */
    function resolveElement(target) {
        if (target instanceof Element) return target;
        if (typeof target === 'string') {
            const el = document.getElementById(target) || document.querySelector(target);
            if (el) return el;
        }
        throw new Error('[AwesomeGraphs] Could not find target element: ' + String(target));
    }

    const prefersReducedMotion = () =>
        typeof global.matchMedia === 'function' && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* -------------------------------------------------------------- drawing */

    const draw = {
        /** Stroke an arc. `width` is the stroke thickness, centred on `r`. */
        arc(ctx, { cx, cy, r, start, end, width, color, cap = 'butt', alpha = 1 }) {
            if (end - start <= 0 || width <= 0 || r <= 0) return;
            ctx.save();
            ctx.globalAlpha *= alpha;
            ctx.beginPath();
            ctx.arc(cx, cy, r, start, end);
            ctx.lineWidth = width;
            ctx.lineCap = cap;
            ctx.strokeStyle = color;
            ctx.stroke();
            ctx.restore();
        },

        /** Fill the annular sector between radii r0 and r1. */
        band(ctx, { cx, cy, r0, r1, start, end, color, alpha = 1 }) {
            if (r1 - r0 <= 0.01) return;
            draw.arc(ctx, { cx, cy, r: (r0 + r1) / 2, width: r1 - r0, start, end, color, alpha });
        },

        polygon(ctx, points, { stroke, fill, width = 1, alpha = 1, fillAlpha = 1, dash = null }) {
            if (!points.length) return;
            ctx.save();
            ctx.globalAlpha *= alpha;
            ctx.beginPath();
            points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.closePath();
            if (fill) {
                ctx.save();
                ctx.globalAlpha *= fillAlpha;
                ctx.fillStyle = fill;
                ctx.fill();
                ctx.restore();
            }
            if (stroke) {
                if (dash) ctx.setLineDash(dash);
                ctx.lineJoin = 'round';
                ctx.lineWidth = width;
                ctx.strokeStyle = stroke;
                ctx.stroke();
            }
            ctx.restore();
        },

        circle(ctx, { x, y, r, fill, stroke, width = 1, alpha = 1 }) {
            ctx.save();
            ctx.globalAlpha *= alpha;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, TAU);
            if (fill) {
                ctx.fillStyle = fill;
                ctx.fill();
            }
            if (stroke) {
                ctx.lineWidth = width;
                ctx.strokeStyle = stroke;
                ctx.stroke();
            }
            ctx.restore();
        },

        line(ctx, from, to, { color, width = 1, cap = 'butt', alpha = 1 }) {
            ctx.save();
            ctx.globalAlpha *= alpha;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.lineWidth = width;
            ctx.lineCap = cap;
            ctx.strokeStyle = color;
            ctx.stroke();
            ctx.restore();
        },

        roundRect(ctx, x, y, w, h, radius, fill) {
            const r = Math.min(radius, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();
        },

        text(ctx, str, x, y, { size = 14, weight = 400, color, align = 'center', baseline = 'alphabetic', family, alpha = 1 }) {
            ctx.save();
            ctx.globalAlpha *= alpha;
            ctx.font = `${weight} ${size}px ${family}`;
            ctx.textAlign = align;
            ctx.textBaseline = baseline;
            ctx.fillStyle = color;
            ctx.fillText(String(str), x, y);
            ctx.restore();
        },

        /** Word-wrap text inside `maxWidth`. Uses the context's current font. Returns the line count. */
        wrapText(ctx, str, x, y, maxWidth, lineHeight) {
            const words = String(str).split(/\s+/).filter(Boolean);
            let line = '';
            let lines = 0;
            words.forEach((word) => {
                const candidate = line ? line + ' ' + word : word;
                if (ctx.measureText(candidate).width > maxWidth && line) {
                    ctx.fillText(line, x, y + lines * lineHeight);
                    lines++;
                    line = word;
                } else {
                    line = candidate;
                }
            });
            if (line) {
                ctx.fillText(line, x, y + lines * lineHeight);
                lines++;
            }
            return lines;
        },
    };

    AG.utils = {
        TAU,
        clamp,
        lerp,
        sum,
        average,
        polar,
        normalizeAngle,
        easings,
        deepMerge,
        interpolate,
        zeroed,
        formatNumber,
        formatDelta,
        resolveElement,
        prefersReducedMotion,
        draw,
    };
})(window);

/* ---- src/core/tooltip.js ---- */
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

/* ---- src/core/base-chart.js ---- */
/*!
 * Awesome Graphs v2 — BaseChart
 * Owns everything that isn't chart-specific: canvas + HiDPI sizing, theming,
 * time-based animation, hit regions, tooltips, accessibility and teardown.
 *
 * A chart subclass only implements:
 *   static id / static defaults / static viewBox
 *   getState(options)          -> the numeric data that should animate
 *   draw(ctx, state, theme)    -> paint one frame in viewBox units
 *   describe()                 -> screen-reader summary
 *   transitionFrom(prev, next) -> (optional) seed newly-appearing data
 */
(function (global) {
    'use strict';

    const AG = (global.AwesomeGraphs = global.AwesomeGraphs || {});
    const { clamp, deepMerge, interpolate, zeroed, easings, normalizeAngle, formatNumber, formatDelta,
        resolveElement, prefersReducedMotion, draw } = AG.utils;

    const INSTANCE = Symbol('awesomeGraphsChart');

    class BaseChart {
        constructor(target, options = {}) {
            this.el = resolveElement(target);
            if (this.el[INSTANCE]) this.el[INSTANCE].destroy();
            this.el[INSTANCE] = this;

            this.options = deepMerge({}, BaseChart.defaults, this.constructor.defaults, options);
            this.viewBox = this.constructor.viewBox;
            this.regions = [];
            this.hoverKey = null;
            this.state = zeroed(this.getState(this.options));

            this._scale = 0;
            this._frame = 0;
            this._entered = false;

            this._mount();
            this._bindPointer();
            this._observe();
        }

        /* ------------------------------------------------------ public API */

        /**
         * Merge new options and animate from what's on screen to the new data.
         * @param {object} options  partial options; arrays replace, objects merge
         * @param {{animate?: boolean, duration?: number}} [transition]
         * @returns {Promise<this>} resolves when the transition finishes
         */
        update(options = {}, { animate = true, duration = this.options.animation.duration } = {}) {
            deepMerge(this.options, options);
            const next = this.getState(this.options);
            if (!this._entered) {
                // Not on screen yet: the entrance animation will pick up the latest data.
                return Promise.resolve(this);
            }
            this.state = this.transitionFrom(this.state, next);
            return this._animateTo(next, animate ? duration : 0);
        }

        /** Replay the entrance animation from zero. */
        replay() {
            this.state = zeroed(this.getState(this.options));
            return this._animateTo(this.getState(this.options), this.options.animation.duration);
        }

        destroy() {
            cancelAnimationFrame(this._frame);
            if (this._resizeObserver) this._resizeObserver.disconnect();
            if (this._intersectionObserver) this._intersectionObserver.disconnect();
            this.canvas.removeEventListener('pointermove', this._onPointerMove);
            this.canvas.removeEventListener('pointerdown', this._onPointerMove);
            this.canvas.removeEventListener('pointerleave', this._onPointerLeave);
            this.canvas.remove();
            AG.tooltip.hide();
            delete this.el[INSTANCE];
        }

        /* -------------------------------------------- subclass extension points */

        getState() {
            return {};
        }

        // eslint-disable-next-line no-unused-vars
        draw(ctx, state, theme) {}

        describe() {
            return this.constructor.label || 'Chart';
        }

        transitionFrom(prev) {
            return prev;
        }

        /* ------------------------------------------------- helpers for charts */

        /** Register an interactive area for the current frame. */
        addRegion(key, shape, tooltip) {
            this.regions.push({ key, shape, tooltip });
        }

        /** 1 when nothing (or this key) is hovered, dimmed otherwise. */
        emphasis(key) {
            return this.hoverKey === null || this.hoverKey === key ? 1 : 0.4;
        }

        format(value) {
            return this.options.format ? this.options.format(value) : formatNumber(value);
        }

        deltaColor(delta) {
            if (Math.round(delta) > 0) return this.theme.success;
            if (Math.round(delta) < 0) return this.theme.danger;
            return this.theme.muted;
        }

        deltaTooltip(value, base) {
            if (base == null) return {};
            const delta = value - base;
            return { meta: formatDelta(delta) + ' vs baseline', metaColor: this.deltaColor(delta) };
        }

        text(str, x, y, opts = {}) {
            draw.text(this.ctx, str, x, y, { family: this.theme.font, color: this.theme.text, ...opts });
        }

        /** Small rounded square with a letter, e.g. the "A" marker from v1. */
        drawBadge(label, x, y, color) {
            if (!label) return;
            draw.roundRect(this.ctx, x - 11, y - 11, 22, 22, 6, color);
            this.text(label, x, y + 0.5, { size: 12, weight: 700, color: '#fff', baseline: 'middle' });
        }

        /** Big number with a muted "/ max" underneath. */
        drawTotal(value, cx, cy, { size = 38, max = this.options.max } = {}) {
            this.text(this.format(value), cx, cy, { size, weight: 700, baseline: 'middle' });
            if (max != null) {
                this.text('/ ' + this.format(max), cx, cy + size * 0.72, { size: 13, color: this.theme.muted, baseline: 'middle' });
            }
        }

        drawDelta(delta, x, y, { size = 20, align = 'right' } = {}) {
            this.text(formatDelta(delta), x, y, { size, weight: 700, align, color: this.deltaColor(delta), baseline: 'middle' });
        }

        /** Draw an image contained in the box. Loads lazily and re-renders once ready. */
        drawImage(src, x, y, width, height) {
            this._images = this._images || new Map();
            let image = this._images.get(src);
            if (!image) {
                image = new Image();
                image.onload = () => this.render();
                image.src = src;
                this._images.set(src, image);
            }
            if (!image.complete || !image.naturalWidth) return;
            const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
            const w = image.naturalWidth * ratio;
            const h = image.naturalHeight * ratio;
            this.ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
        }

        /* --------------------------------------------------------- internals */

        _mount() {
            const { width, height } = this.viewBox;
            const canvas = document.createElement('canvas');
            canvas.className = 'ag-canvas';
            canvas.setAttribute('role', 'img');
            Object.assign(canvas.style, {
                display: 'block',
                width: '100%',
                maxWidth: this.options.size + 'px',
                height: 'auto',
                aspectRatio: `${width} / ${height}`,
                margin: '0 auto',
                touchAction: 'manipulation',
                background: 'transparent',
            });
            this.el.replaceChildren(canvas);
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
        }

        _observe() {
            this._resizeObserver = new ResizeObserver(() => this._resize());
            this._resizeObserver.observe(this.canvas);

            const enter = () => {
                if (this._entered) return;
                this._entered = true;
                const target = this.getState(this.options);
                if (this.options.animation.onVisible) this._animateTo(target, this.options.animation.duration);
                else this._animateTo(target, 0);
            };

            if (!this.options.animation.onVisible || typeof IntersectionObserver === 'undefined') {
                enter();
                return;
            }
            this._intersectionObserver = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    this._intersectionObserver.disconnect();
                    enter();
                }
            }, { threshold: 0.35 });
            this._intersectionObserver.observe(this.canvas);
        }

        _resize() {
            const cssWidth = this.canvas.clientWidth;
            if (!cssWidth) return; // hidden (e.g. inside an inactive tab)
            const dpr = global.devicePixelRatio || 1;
            const { width, height } = this.viewBox;
            this.canvas.width = Math.round(cssWidth * dpr);
            this.canvas.height = Math.round((cssWidth * height / width) * dpr);
            this._scale = (cssWidth / width) * dpr;
            this.render();
        }

        _animateTo(target, duration) {
            cancelAnimationFrame(this._frame);
            const from = this.state;
            if (duration <= 0 || prefersReducedMotion()) {
                this.state = target;
                this.render();
                return Promise.resolve(this);
            }
            const ease = easings[this.options.animation.easing] || easings.easeOutCubic;
            const startedAt = performance.now();
            return new Promise((resolve) => {
                const tick = (now) => {
                    const t = clamp((now - startedAt) / duration, 0, 1);
                    this.state = t === 1 ? target : interpolate(from, target, ease(t));
                    this.render();
                    if (t < 1) this._frame = requestAnimationFrame(tick);
                    else resolve(this);
                };
                this._frame = requestAnimationFrame(tick);
            });
        }

        render() {
            if (!this._scale) return;
            const { ctx, canvas } = this;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(this._scale, 0, 0, this._scale, 0, 0);
            this.regions = [];
            this.theme = this._readTheme();
            this.draw(ctx, this.state, this.theme);
            canvas.setAttribute('aria-label', this.describe());
        }

        _readTheme() {
            const css = getComputedStyle(this.el);
            const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
            const colors = this.options.colors;
            return {
                text: colors.text || token('--ag-text', css.color || '#111827'),
                muted: colors.muted || token('--ag-muted', '#6b7280'),
                grid: colors.grid || token('--ag-grid', 'rgba(127, 127, 127, .25)'),
                surface: colors.surface || token('--ag-surface', '#ffffff'),
                success: colors.success || token('--ag-success', '#22a06b'),
                danger: colors.danger || token('--ag-danger', '#e5484d'),
                font: token('--ag-font', css.fontFamily || 'system-ui, sans-serif'),
            };
        }

        _bindPointer() {
            this._onPointerMove = (event) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * this.viewBox.width;
                const y = ((event.clientY - rect.top) / rect.height) * this.viewBox.height;
                const region = this._hitTest(x, y);
                const key = region ? region.key : null;

                if (region && this.options.tooltip && region.tooltip) {
                    const content = typeof region.tooltip === 'function' ? region.tooltip() : region.tooltip;
                    AG.tooltip.show(content, event.clientX, event.clientY);
                } else {
                    AG.tooltip.hide();
                }
                this.canvas.style.cursor = region ? 'pointer' : '';
                if (key !== this.hoverKey) {
                    this.hoverKey = key;
                    this.render();
                }
            };
            this._onPointerLeave = (event) => {
                if (event.pointerType === 'touch') return; // keep tap-tooltips readable
                AG.tooltip.hide();
                if (this.hoverKey !== null) {
                    this.hoverKey = null;
                    this.render();
                }
            };
            this.canvas.addEventListener('pointermove', this._onPointerMove);
            this.canvas.addEventListener('pointerdown', this._onPointerMove);
            this.canvas.addEventListener('pointerleave', this._onPointerLeave);
        }

        _hitTest(x, y) {
            for (let i = this.regions.length - 1; i >= 0; i--) {
                const { shape } = this.regions[i];
                if (shape.type === 'circle') {
                    if (Math.hypot(x - shape.x, y - shape.y) <= shape.r) return this.regions[i];
                } else if (shape.type === 'band') {
                    const distance = Math.hypot(x - shape.cx, y - shape.cy);
                    if (distance < shape.r0 || distance > shape.r1) continue;
                    const angle = normalizeAngle(Math.atan2(y - shape.cy, x - shape.cx) - shape.start);
                    if (angle <= shape.end - shape.start) return this.regions[i];
                }
            }
            return null;
        }
    }

    BaseChart.viewBox = { width: 300, height: 300 };
    BaseChart.defaults = {
        size: 320,           // max rendered width in CSS px; the chart shrinks to fit its container
        max: 900,            // value that fills a bar / arc completely
        tooltip: true,
        format: null,        // (value) => string
        colors: {},          // fill, success, danger, text, muted, grid, surface
        animation: {
            duration: 900,   // ms
            easing: 'easeOutCubic',
            onVisible: true, // wait until the chart scrolls into view
        },
    };

    AG.version = '2.0.0';
    AG.BaseChart = BaseChart;
    AG.charts = {};

    /** Register a chart type so it can be created with AwesomeGraphs.create(id, …). */
    AG.register = (Chart) => {
        AG.charts[Chart.id] = Chart;
        AG[Chart.name] = Chart;
        return Chart;
    };

    AG.create = (type, target, options) => {
        const Chart = AG.charts[type];
        if (!Chart) throw new Error(`[AwesomeGraphs] Unknown chart type "${type}". Known: ${Object.keys(AG.charts).join(', ')}`);
        return new Chart(target, options);
    };
})(window);

/* ---- src/charts/segment-ring.js ---- */
/*!
 * Awesome Graphs v2 — SegmentRing (v1: TypeOne)
 * A three-quarter ring split into segments; each segment's thickness is its value.
 */
(function (global) {
    'use strict';

    const AG = global.AwesomeGraphs;
    const { average, clamp, polar, draw } = AG.utils;

    const CX = 150;
    const CY = 150;
    const INNER = 64;
    const BAND = 46;
    const LABEL_RADIUS = INNER + BAND + 22;

    class SegmentRing extends AG.BaseChart {
        getState({ values, baseline, total }) {
            return {
                values: values.slice(),
                baseline: baseline ? baseline.slice() : null,
                total: total != null ? total : average(values),
            };
        }

        transitionFrom(prev, next) {
            return next.baseline && !prev.baseline ? { ...prev, baseline: prev.values } : prev;
        }

        draw(ctx, state, theme) {
            const { labels, tooltips, badge, startAngle, sweep, gap, colors, max } = this.options;
            const fill = colors.fill;
            const count = state.values.length;
            const slice = sweep / count;
            const radiusOf = (value) => INNER + clamp(value / max, 0, 1) * BAND;

            state.values.forEach((value, i) => {
                const start = startAngle + i * slice + gap / 2;
                const end = startAngle + (i + 1) * slice - gap / 2;
                const alpha = this.emphasis(i);
                const base = state.baseline ? state.baseline[i] : null;

                draw.band(ctx, { cx: CX, cy: CY, r0: INNER, r1: INNER + BAND, start, end, color: fill, alpha: 0.16 });

                if (base == null) {
                    draw.band(ctx, { cx: CX, cy: CY, r0: INNER, r1: radiusOf(value), start, end, color: fill, alpha });
                } else {
                    draw.band(ctx, { cx: CX, cy: CY, r0: INNER, r1: radiusOf(Math.min(value, base)), start, end, color: fill, alpha });
                    if (value > base) {
                        draw.band(ctx, { cx: CX, cy: CY, r0: radiusOf(base), r1: radiusOf(value), start, end, color: theme.success, alpha });
                    } else if (value < base) {
                        draw.band(ctx, { cx: CX, cy: CY, r0: radiusOf(value), r1: radiusOf(base), start, end, color: theme.danger, alpha: alpha * 0.85 });
                    }
                }

                const label = labels[i];
                if (label) {
                    const pos = polar(CX, CY, LABEL_RADIUS, (start + end) / 2);
                    this.text(label, pos.x, pos.y, { size: 14, weight: 600, color: fill, baseline: 'middle', alpha });
                }

                const target = this.options.values[i];
                const targetBase = this.options.baseline ? this.options.baseline[i] : null;
                this.addRegion(i, { type: 'band', cx: CX, cy: CY, r0: INNER - 4, r1: INNER + BAND + 4, start, end }, () => ({
                    title: tooltips[i] || label || `Segment ${i + 1}`,
                    value: this.format(target),
                    color: fill,
                    ...this.deltaTooltip(target, targetBase),
                }));
            });

            this.drawBadge(badge, CX, CY - 44, fill);
            this.drawTotal(state.total, CX, CY - 2);

            if (state.baseline) {
                this.drawDelta(average(state.values) - average(state.baseline), 272, 262, { size: 24 });
            }
        }

        describe() {
            const { values, labels, max } = this.options;
            const parts = values.map((v, i) => `${labels[i] || 'Segment ' + (i + 1)}: ${this.format(v)}`);
            return `Segment ring out of ${this.format(max)}. ${parts.join(', ')}.`;
        }
    }

    SegmentRing.id = 'segment-ring';
    SegmentRing.label = 'Segment ring';
    SegmentRing.defaults = {
        values: [],
        labels: [],
        tooltips: [],
        baseline: null,       // number[] — draws increases/decreases against these values
        total: null,          // centre number; defaults to the average of `values`
        badge: null,          // short text in the rounded marker above the total
        startAngle: Math.PI / 2,
        sweep: Math.PI * 1.5,
        gap: 0.04,            // radians between segments
        colors: { fill: '#c35d9f' },
    };

    AG.register(SegmentRing);
})(window);

/* ---- src/charts/arc-gauge.js ---- */
/*!
 * Awesome Graphs v2 — ArcGauge (v1: TypeTwo)
 * A single three-quarter arc filled up to a value.
 */
(function (global) {
    'use strict';

    const AG = global.AwesomeGraphs;
    const { clamp, draw } = AG.utils;

    const CX = 150;
    const CY = 150;
    const RADIUS = 92;
    const WIDTH = 40;

    class ArcGauge extends AG.BaseChart {
        getState({ value, baseline }) {
            return { value, baseline: baseline != null ? baseline : null };
        }

        transitionFrom(prev, next) {
            return next.baseline != null && prev.baseline == null ? { ...prev, baseline: prev.value } : prev;
        }

        draw(ctx, state, theme) {
            const { startAngle, sweep, max, colors, badge, label, rounded } = this.options;
            const fill = colors.fill;
            const cap = rounded ? 'round' : 'butt';
            const angleOf = (value) => startAngle + clamp(value / max, 0, 1) * sweep;
            const arc = (from, to, color, alpha = 1) =>
                draw.arc(ctx, { cx: CX, cy: CY, r: RADIUS, width: WIDTH, start: angleOf(from), end: angleOf(to), color, cap, alpha });
            const alpha = this.emphasis('arc');

            arc(0, max, fill, 0.16);
            if (state.baseline == null) {
                arc(0, state.value, fill, alpha);
            } else {
                arc(0, Math.min(state.value, state.baseline), fill, alpha);
                if (state.value > state.baseline) arc(state.baseline, state.value, theme.success, alpha);
                if (state.value < state.baseline) arc(state.value, state.baseline, theme.danger, alpha * 0.85);
                this.drawDelta(state.value - state.baseline, 272, 262, { size: 24 });
            }

            this.addRegion('arc', {
                type: 'band', cx: CX, cy: CY, r0: RADIUS - WIDTH / 2, r1: RADIUS + WIDTH / 2, start: startAngle, end: startAngle + sweep,
            }, () => ({
                title: label,
                value: this.format(this.options.value),
                color: fill,
                ...this.deltaTooltip(this.options.value, this.options.baseline),
            }));

            this.drawBadge(badge, CX, CY - 44, fill);
            this.drawTotal(state.value, CX, CY - 2);
        }

        describe() {
            return `${this.options.label}: ${this.format(this.options.value)} out of ${this.format(this.options.max)}.`;
        }
    }

    ArcGauge.id = 'arc-gauge';
    ArcGauge.label = 'Arc gauge';
    ArcGauge.defaults = {
        value: 0,
        baseline: null,       // number — draws the change against this value
        label: 'Value',       // tooltip title
        badge: null,
        rounded: false,
        startAngle: Math.PI / 2,
        sweep: Math.PI * 1.5,
        colors: { fill: '#5b7bb0' },
    };

    AG.register(ArcGauge);
})(window);

/* ---- src/charts/combo-ring.js ---- */
/*!
 * Awesome Graphs v2 — ComboRing (v1: TypeThree)
 * Three views in one: outer segment bars, an inner arc and a radar shape in the core.
 */
(function (global) {
    'use strict';

    const AG = global.AwesomeGraphs;
    const { average, clamp, polar, draw, TAU } = AG.utils;

    const CX = 150;
    const CY = 150;
    const BAR_INNER = 82;
    const BAR_BAND = 34;
    const ARC_RADIUS = 59;
    const ARC_WIDTH = 22;
    const SHAPE_RADIUS = 42;

    class ComboRing extends AG.BaseChart {
        getState({ bars, arc, shape, score, baseline }) {
            return {
                bars: bars.slice(),
                arc,
                shape: shape.slice(),
                score: score != null ? score : null,
                baseline: baseline ? { bars: baseline.bars.slice(), arc: baseline.arc } : null,
            };
        }

        transitionFrom(prev, next) {
            return next.baseline && !prev.baseline ? { ...prev, baseline: { bars: prev.bars, arc: prev.arc } } : prev;
        }

        draw(ctx, state, theme) {
            const fill = this.options.colors.fill;
            const base = state.baseline;

            this._drawBars(ctx, state, theme, fill);
            this._drawArc(ctx, state, theme, fill);
            this._drawShape(ctx, state, fill);

            // Bottom-right quadrant: score, optional image and the combined change.
            if (state.score != null) {
                this.drawTotal(state.score, 222, 238, { size: 30 });
            } else if (this.options.image) {
                this.drawImage(this.options.image, 180, 186, 84, 84);
            }
            if (base) {
                const delta = (average(state.bars) - average(base.bars)) + (state.arc - base.arc);
                this.drawDelta(delta, 222, 200, { size: 16, align: 'center' });
            }
        }

        _drawBars(ctx, state, theme, fill) {
            const { startAngle, sweep, gap, max, barLabels } = this.options;
            const slice = sweep / state.bars.length;
            const radiusOf = (value) => BAR_INNER + clamp(value / max, 0, 1) * BAR_BAND;

            state.bars.forEach((value, i) => {
                const key = 'bar-' + i;
                const start = startAngle + i * slice + gap / 2;
                const end = startAngle + (i + 1) * slice - gap / 2;
                const alpha = this.emphasis(key);
                const base = state.baseline ? state.baseline.bars[i] : null;
                const band = (from, to, color, a = alpha) =>
                    draw.band(ctx, { cx: CX, cy: CY, r0: radiusOf(from), r1: radiusOf(to), start, end, color, alpha: a });

                band(0, max, fill, 0.16);
                if (base == null) {
                    band(0, value, fill);
                } else {
                    band(0, Math.min(value, base), fill);
                    if (value > base) band(base, value, theme.success);
                    if (value < base) band(value, base, theme.danger, alpha * 0.85);
                }

                const target = this.options.bars[i];
                const targetBase = this.options.baseline ? this.options.baseline.bars[i] : null;
                this.addRegion(key, { type: 'band', cx: CX, cy: CY, r0: BAR_INNER - 3, r1: BAR_INNER + BAR_BAND + 3, start, end }, () => ({
                    title: barLabels[i] || `Bar ${i + 1}`,
                    value: this.format(target),
                    color: fill,
                    ...this.deltaTooltip(target, targetBase),
                }));
            });
        }

        _drawArc(ctx, state, theme, fill) {
            const { startAngle, sweep, max, arcLabel } = this.options;
            const angleOf = (value) => startAngle + clamp(value / max, 0, 1) * sweep;
            const alpha = this.emphasis('arc');
            const arc = (from, to, color, a = alpha) =>
                draw.arc(ctx, { cx: CX, cy: CY, r: ARC_RADIUS, width: ARC_WIDTH, start: angleOf(from), end: angleOf(to), color, alpha: a });
            const base = state.baseline ? state.baseline.arc : null;

            arc(0, max, fill, 0.16);
            if (base == null) {
                arc(0, state.arc, fill);
            } else {
                arc(0, Math.min(state.arc, base), fill);
                if (state.arc > base) arc(base, state.arc, theme.success);
                if (state.arc < base) arc(state.arc, base, theme.danger, alpha * 0.85);
            }

            this.addRegion('arc', {
                type: 'band', cx: CX, cy: CY, r0: ARC_RADIUS - ARC_WIDTH / 2, r1: ARC_RADIUS + ARC_WIDTH / 2, start: startAngle, end: startAngle + sweep,
            }, () => ({
                title: arcLabel,
                value: this.format(this.options.arc),
                color: fill,
                ...this.deltaTooltip(this.options.arc, this.options.baseline ? this.options.baseline.arc : null),
            }));
        }

        _drawShape(ctx, state, fill) {
            const { max, shapeLabels } = this.options;
            const count = state.shape.length;
            const points = state.shape.map((value, i) =>
                polar(CX, CY, clamp(value / max, 0, 1) * SHAPE_RADIUS, -Math.PI / 2 + (i * TAU) / count));

            draw.polygon(ctx, points, { stroke: fill, fill, width: 2.5, fillAlpha: 0.14, alpha: this.hoverKey === null || String(this.hoverKey).startsWith('shape') ? 1 : 0.4 });

            points.forEach((point, i) => {
                const key = 'shape-' + i;
                const hovered = this.hoverKey === key;
                if (hovered) draw.circle(ctx, { x: point.x, y: point.y, r: 4.5, fill, stroke: this.theme.surface, width: 2 });
                this.addRegion(key, { type: 'circle', x: point.x, y: point.y, r: 9 }, () => ({
                    title: shapeLabels[i] || `Point ${i + 1}`,
                    value: this.format(this.options.shape[i]),
                    color: fill,
                }));
            });
        }

        describe() {
            const { bars, arc, arcLabel, shape, max, score } = this.options;
            return `Combo ring out of ${this.format(max)}. Bars: ${bars.map((v) => this.format(v)).join(', ')}. ` +
                `${arcLabel}: ${this.format(arc)}. Shape: ${shape.map((v) => this.format(v)).join(', ')}.` +
                (score != null ? ` Score: ${this.format(score)}.` : '');
        }
    }

    ComboRing.id = 'combo-ring';
    ComboRing.label = 'Combo ring';
    ComboRing.defaults = {
        bars: [],
        barLabels: [],
        arc: 0,
        arcLabel: 'Arc value',
        shape: [],
        shapeLabels: [],
        score: null,          // number shown in the open quadrant
        image: null,          // image URL shown in the open quadrant when there is no score
        baseline: null,       // { bars: number[], arc: number }
        startAngle: Math.PI / 2,
        sweep: Math.PI * 1.5,
        gap: 0.05,
        colors: { fill: '#ee8a2f' },
    };

    AG.register(ComboRing);
})(window);

/* ---- src/charts/radar.js ---- */
/*!
 * Awesome Graphs v2 — Radar (v1: TypeFour)
 * Values plotted on spokes around a circular grid.
 */
(function (global) {
    'use strict';

    const AG = global.AwesomeGraphs;
    const { clamp, polar, draw, TAU } = AG.utils;

    const CX = 150;
    const CY = 150;
    const RADIUS = 102;
    const LABEL_OFFSET = 20;

    class Radar extends AG.BaseChart {
        getState({ values, baseline }) {
            return { values: values.slice(), baseline: baseline ? baseline.slice() : null };
        }

        transitionFrom(prev, next) {
            return next.baseline && !prev.baseline ? { ...prev, baseline: prev.values } : prev;
        }

        draw(ctx, state, theme) {
            const { labels, tooltips, rings, max, colors } = this.options;
            const fill = colors.fill;
            const count = state.values.length;
            const angleOf = (i) => -Math.PI / 2 + (i * TAU) / count;
            const pointsFor = (values) => values.map((v, i) => polar(CX, CY, clamp(v / max, 0, 1) * RADIUS, angleOf(i)));

            // Grid
            for (let ring = 1; ring <= rings; ring++) {
                draw.circle(ctx, { x: CX, y: CY, r: (RADIUS * ring) / rings, stroke: theme.grid, width: 1 });
            }
            for (let i = 0; i < count; i++) {
                draw.line(ctx, { x: CX, y: CY }, polar(CX, CY, RADIUS, angleOf(i)), { color: theme.grid, width: 1 });
            }

            if (state.baseline) {
                draw.polygon(ctx, pointsFor(state.baseline), { stroke: theme.muted, width: 1.5, dash: [4, 4] });
            }

            const points = pointsFor(state.values);
            draw.polygon(ctx, points, { stroke: fill, fill, width: 3, fillAlpha: 0.18 });

            points.forEach((point, i) => {
                const hovered = this.hoverKey === i;
                draw.circle(ctx, { x: point.x, y: point.y, r: hovered ? 6 : 3.5, fill, stroke: theme.surface, width: 2 });

                const label = labels[i];
                if (label) {
                    const pos = polar(CX, CY, RADIUS + LABEL_OFFSET, angleOf(i));
                    this.text(label, pos.x, pos.y, { size: 14, weight: 600, color: fill, baseline: 'middle', alpha: this.emphasis(i) });
                }

                const target = this.options.values[i];
                const targetBase = this.options.baseline ? this.options.baseline[i] : null;
                this.addRegion(i, { type: 'circle', x: point.x, y: point.y, r: 12 }, () => ({
                    title: tooltips[i] || label || `Axis ${i + 1}`,
                    value: this.format(target),
                    color: fill,
                    ...this.deltaTooltip(target, targetBase),
                }));
            });
        }

        describe() {
            const { values, labels, max } = this.options;
            return `Radar chart out of ${this.format(max)}. ` +
                values.map((v, i) => `${labels[i] || 'Axis ' + (i + 1)}: ${this.format(v)}`).join(', ') + '.';
        }
    }

    Radar.id = 'radar';
    Radar.label = 'Radar';
    Radar.defaults = {
        values: [],
        labels: [],
        tooltips: [],
        baseline: null,       // number[] — drawn as a dashed outline
        rings: 5,
        colors: { fill: '#2aa7ae' },
    };

    AG.register(Radar);
})(window);

/* ---- src/charts/concentric-arcs.js ---- */
/*!
 * Awesome Graphs v2 — ConcentricArcs (v1: TypeFive)
 * One or more nested three-quarter arcs, outermost first.
 */
(function (global) {
    'use strict';

    const AG = global.AwesomeGraphs;
    const { clamp, draw } = AG.utils;

    const CX = 150;
    const CY = 150;
    const OUTER_RADIUS = 106;

    class ConcentricArcs extends AG.BaseChart {
        getState({ values }) {
            return { values: values.slice() };
        }

        draw(ctx, state) {
            const { labels, max, startAngle, sweep, width, spacing, rounded, colors, centerText, image } = this.options;
            const fill = colors.fill;
            const cap = rounded ? 'round' : 'butt';

            state.values.forEach((value, i) => {
                const r = OUTER_RADIUS - i * (width + spacing);
                if (r - width / 2 <= 0) return;
                const palette = colors.rings && colors.rings[i] ? colors.rings[i] : fill;
                const alpha = this.emphasis(i);
                const end = startAngle + clamp(value / max, 0, 1) * sweep;

                draw.arc(ctx, { cx: CX, cy: CY, r, width, start: startAngle, end: startAngle + sweep, color: palette, alpha: 0.16 });
                draw.arc(ctx, { cx: CX, cy: CY, r, width, start: startAngle, end, color: palette, cap, alpha });

                this.addRegion(i, { type: 'band', cx: CX, cy: CY, r0: r - width / 2 - spacing / 2, r1: r + width / 2 + spacing / 2, start: startAngle, end: startAngle + sweep }, () => ({
                    title: labels[i] || `Ring ${i + 1}`,
                    value: this.format(this.options.values[i]),
                    color: palette,
                }));
            });

            // Centre content only when the innermost ring leaves enough room.
            const innermost = OUTER_RADIUS - (state.values.length - 1) * (width + spacing) - width / 2;
            if (innermost < 34) return;
            if (image) {
                const size = Math.min(56, innermost * 1.1);
                this.drawImage(image, CX - size / 2, CY - size / 2, size, size);
            } else {
                const hovered = typeof this.hoverKey === 'number' ? this.hoverKey : 0;
                const text = centerText != null ? centerText : this.format(state.values[hovered]);
                const size = Math.min(34, innermost * 0.62);
                this.text(text, CX, CY - 2, { size, weight: 700, baseline: 'middle' });
                if (centerText == null && labels[hovered]) {
                    this.text(labels[hovered], CX, CY + size * 0.72, { size: 12, color: this.theme.muted, baseline: 'middle' });
                }
            }
        }

        describe() {
            const { values, labels, max } = this.options;
            return `Concentric arcs out of ${this.format(max)}. ` +
                values.map((v, i) => `${labels[i] || 'Ring ' + (i + 1)}: ${this.format(v)}`).join(', ') + '.';
        }
    }

    ConcentricArcs.id = 'concentric-arcs';
    ConcentricArcs.label = 'Concentric arcs';
    ConcentricArcs.defaults = {
        values: [],           // outermost ring first
        labels: [],
        width: 26,
        spacing: 8,
        rounded: false,
        centerText: null,     // defaults to the (hovered) ring's value
        image: null,          // image URL drawn in the centre instead of text
        startAngle: Math.PI / 2,
        sweep: Math.PI * 1.5,
        colors: { fill: '#ee8a2f', rings: null },
    };

    AG.register(ConcentricArcs);
})(window);

/* ---- src/charts/segmented-dial.js ---- */
/*!
 * Awesome Graphs v2 — SegmentedDial (v1: TypeSix)
 * A percentage dial split into equal zones, open at the bottom.
 */
(function (global) {
    'use strict';

    const AG = global.AwesomeGraphs;
    const { clamp, draw } = AG.utils;

    const CX = 150;
    const CY = 150;
    const RADIUS = 88;
    const WIDTH = 42;

    class SegmentedDial extends AG.BaseChart {
        getState({ value }) {
            return { value };
        }

        draw(ctx, state) {
            const { segments, gap, startAngle, sweep, max, colors, label, suffix } = this.options;
            const slice = sweep / segments;
            const filledTo = startAngle + clamp(state.value / max, 0, 1) * sweep;
            const alpha = this.emphasis('dial');

            for (let i = 0; i < segments; i++) {
                const color = (colors.zones && colors.zones[i]) || colors.fill;
                const start = startAngle + i * slice + (i === 0 ? 0 : gap / 2);
                const end = startAngle + (i + 1) * slice - (i === segments - 1 ? 0 : gap / 2);
                draw.arc(ctx, { cx: CX, cy: CY, r: RADIUS, width: WIDTH, start, end, color, alpha: 0.16 });
                draw.arc(ctx, { cx: CX, cy: CY, r: RADIUS, width: WIDTH, start, end: Math.min(end, filledTo), color, alpha });
            }

            this.addRegion('dial', {
                type: 'band', cx: CX, cy: CY, r0: RADIUS - WIDTH / 2, r1: RADIUS + WIDTH / 2, start: startAngle, end: startAngle + sweep,
            }, () => ({ title: label, value: this.format(this.options.value) + suffix, color: colors.fill }));

            // Centre value with a smaller suffix, measured so the pair stays centred.
            const number = this.format(state.value);
            ctx.font = `700 42px ${this.theme.font}`;
            const numberWidth = ctx.measureText(number).width;
            ctx.font = `600 18px ${this.theme.font}`;
            const suffixWidth = suffix ? ctx.measureText(suffix).width + 2 : 0;
            const left = CX - (numberWidth + suffixWidth) / 2;
            this.text(number, left, CY + 2, { size: 42, weight: 700, align: 'left', baseline: 'middle' });
            if (suffix) {
                this.text(suffix, left + numberWidth + 2, CY - 6, { size: 18, weight: 600, align: 'left', baseline: 'middle', color: this.theme.muted });
            }
            if (label) this.text(label, CX, CY + 32, { size: 12, color: this.theme.muted, baseline: 'middle' });
        }

        describe() {
            return `${this.options.label || 'Dial'}: ${this.format(this.options.value)}${this.options.suffix}.`;
        }
    }

    SegmentedDial.id = 'segmented-dial';
    SegmentedDial.label = 'Segmented dial';
    SegmentedDial.defaults = {
        value: 0,
        max: 100,
        suffix: '%',
        label: '',
        segments: 3,
        gap: 0.06,            // radians between zones
        startAngle: Math.PI * 0.75,
        sweep: Math.PI * 1.5,
        colors: { fill: '#5b7bb0', zones: null },
    };

    AG.register(SegmentedDial);
})(window);

/* ---- src/charts/needle-meter.js ---- */
/*!
 * Awesome Graphs v2 — NeedleMeter (v1: TypeSeven)
 * A half-dial with a needle, an accepted range ("limits") and optional side captions.
 */
(function (global) {
    'use strict';

    const AG = global.AwesomeGraphs;
    const { clamp, polar, formatNumber, draw } = AG.utils;

    const CX = 150;
    const CY = 142;
    const RADIUS = 92;
    const WIDTH = 26;
    const OVERHANG = 0.25; // radians the arc extends below the horizontal on each side

    class NeedleMeter extends AG.BaseChart {
        getState({ value }) {
            return { value };
        }

        /** Top of the dial is 0; ±range/2 sits on the horizontal. */
        angleOf(value) {
            const halfSweep = Math.PI / 2 + OVERHANG;
            return -Math.PI / 2 + clamp((value * Math.PI) / this.options.range, -halfSweep, halfSweep);
        }

        draw(ctx, state, theme) {
            const { limits, showLimits, captions, colors, label } = this.options;
            const fill = colors.fill;
            const needle = colors.needle || theme.text;
            const start = Math.PI - OVERHANG;
            const end = Math.PI * 2 + OVERHANG;
            const [low, high] = limits;
            const alpha = this.emphasis('meter');

            // Arc: faded outside the limits, solid inside.
            draw.arc(ctx, { cx: CX, cy: CY, r: RADIUS, width: WIDTH, start, end, color: fill, alpha: 0.3 * alpha });
            draw.arc(ctx, { cx: CX, cy: CY, r: RADIUS, width: WIDTH, start: this.angleOf(low), end: this.angleOf(high), color: fill, alpha });

            [low, high].forEach((limit) => {
                const angle = this.angleOf(limit);
                draw.line(ctx, polar(CX, CY, RADIUS - WIDTH / 2 - 1, angle), polar(CX, CY, RADIUS + WIDTH / 2 + 1, angle), { color: theme.surface, width: 2.5 });
                if (showLimits) {
                    const pos = polar(CX, CY, RADIUS + WIDTH / 2 + 13, angle);
                    this.text(formatNumber(limit), pos.x, pos.y, { size: 12, weight: 600, color: theme.muted, baseline: 'middle' });
                }
            });

            this.addRegion('meter', {
                type: 'band', cx: CX, cy: CY, r0: RADIUS - WIDTH / 2, r1: RADIUS + WIDTH / 2, start, end,
            }, () => ({
                title: label,
                value: this.format(this.options.value),
                meta: `Limits ${formatNumber(low)} to ${formatNumber(high)}`,
                color: fill,
            }));

            this._drawNeedle(ctx, this.angleOf(state.value), needle, theme);

            // Readout under the pivot
            const target = this.options.value;
            const status = target < low ? ['Below limit', theme.danger] : target > high ? ['Above limit', theme.danger] : ['Within limits', theme.success];
            this.text(this.format(state.value), CX, CY + 42, { size: 26, weight: 700, baseline: 'middle' });
            this.text(status[0], CX, CY + 64, { size: 12, weight: 600, color: status[1], baseline: 'middle' });

            // Side captions
            ctx.save();
            ctx.font = `600 12px ${theme.font}`;
            ctx.fillStyle = theme.muted;
            ctx.textBaseline = 'middle';
            if (captions[0]) {
                ctx.textAlign = 'left';
                draw.wrapText(ctx, captions[0], 8, CY + 36, 90, 15);
            }
            if (captions[1]) {
                ctx.textAlign = 'right';
                draw.wrapText(ctx, captions[1], 292, CY + 36, 90, 15);
            }
            ctx.restore();
        }

        _drawNeedle(ctx, angle, color, theme) {
            const tip = polar(CX, CY, RADIUS + WIDTH / 2 - 6, angle);
            const normal = angle + Math.PI / 2;
            const baseHalf = 7;
            const tipHalf = 1.5;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(CX + baseHalf * Math.cos(normal), CY + baseHalf * Math.sin(normal));
            ctx.lineTo(tip.x + tipHalf * Math.cos(normal), tip.y + tipHalf * Math.sin(normal));
            ctx.quadraticCurveTo(tip.x + 3 * Math.cos(angle), tip.y + 3 * Math.sin(angle),
                tip.x - tipHalf * Math.cos(normal), tip.y - tipHalf * Math.sin(normal));
            ctx.lineTo(CX - baseHalf * Math.cos(normal), CY - baseHalf * Math.sin(normal));
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();
            draw.circle(ctx, { x: CX, y: CY, r: 10, fill: color });
            draw.circle(ctx, { x: CX, y: CY, r: 3.5, fill: theme.surface });
        }

        describe() {
            const { value, limits, label } = this.options;
            return `${label}: ${this.format(value)}. Accepted range ${formatNumber(limits[0])} to ${formatNumber(limits[1])}.`;
        }
    }

    NeedleMeter.id = 'needle-meter';
    NeedleMeter.label = 'Needle meter';
    NeedleMeter.viewBox = { width: 300, height: 240 };
    NeedleMeter.defaults = {
        value: 0,
        range: 200,           // total span of the half circle, centred on 0
        limits: [-20, 20],
        showLimits: true,
        captions: [],         // [left, right]
        label: 'Value',
        colors: { fill: '#ee8a2f', needle: null },
    };

    AG.register(NeedleMeter);
})(window);
