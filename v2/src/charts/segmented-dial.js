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
