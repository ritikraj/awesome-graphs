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
