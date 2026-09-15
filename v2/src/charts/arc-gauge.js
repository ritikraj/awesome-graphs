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
