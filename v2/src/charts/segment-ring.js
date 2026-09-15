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
