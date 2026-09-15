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
