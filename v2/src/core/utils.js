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
