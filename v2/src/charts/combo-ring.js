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
