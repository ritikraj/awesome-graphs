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
