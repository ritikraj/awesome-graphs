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
