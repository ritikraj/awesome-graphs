# Awesome Graphs v2

A rebuild of the original `awesome-graph.js` (v1): the same seven radial canvas charts with a cleaner API and structure.
Open `index.html` and switch to the **New** tab to try them.

## Use it

```html
<script src="v2/dist/awesome-graphs.js"></script>
<div id="weekly"></div>
<script>
    const chart = new AwesomeGraphs.SegmentRing('#weekly', {
        values: [426, 515, 140, 251, 690],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    });

    // Animates from the current frame to the new data
    chart.update({ values: [480, 500, 220, 251, 610] });

    // Show changes against a baseline (replaces v1's buildChanged(), and it animates)
    chart.update({ baseline: [426, 515, 140, 251, 690] });
</script>
```

| v1          | v2               |
|-------------|------------------|
| `TypeOne`   | `SegmentRing`    |
| `TypeTwo`   | `ArcGauge`       |
| `TypeThree` | `ComboRing`      |
| `TypeFour`  | `Radar`          |
| `TypeFive`  | `ConcentricArcs` |
| `TypeSix`   | `SegmentedDial`  |
| `TypeSeven` | `NeedleMeter`    |

Shared API: `update(options, { animate, duration })`, `replay()`, `render()`, `destroy()`.
Shared options: `max`, `size`, `format`, `colors`, `tooltip`, `animation`.
Charts pick up `--ag-text`, `--ag-muted`, `--ag-grid`, `--ag-surface`, `--ag-success`, `--ag-danger` and `--ag-font` from CSS, so they follow your theme. Call `render()` after changing the theme.

## Layout

```
v2/
├── src/
│   ├── core/
│   │   ├── utils.js        math, interpolation, DOM lookup, canvas drawing helpers
│   │   ├── tooltip.js      one shared, XSS-safe tooltip
│   │   └── base-chart.js   canvas + HiDPI sizing, animation, hit regions, theming, lifecycle
│   └── charts/             one file per chart; each only defines getState(), draw(), describe()
├── dist/awesome-graphs.js  single-file bundle (generated)
├── demo/                   showcase page: tabs.js, showcase.js (config-driven cards), showcase.css
└── build.sh                rebuilds dist/ with `sh v2/build.sh`
```

## Adding a chart

```js
class Donut extends AwesomeGraphs.BaseChart {
    getState({ value }) { return { value }; }          // numbers here are animated
    draw(ctx, state, theme) { /* draw in a 300×300 box */ }
    describe() { return `Donut: ${this.options.value}`; }
}
Donut.id = 'donut';
Donut.defaults = { value: 0, colors: { fill: '#5b7bb0' } };
AwesomeGraphs.register(Donut);
```

## What changed from v1

- **Sharp and responsive:** canvases scale with `devicePixelRatio` and resize with their container, replacing the fixed `300 × multiplier` size.
- **Time-based animation with easing:** it runs when the chart scrolls into view, respects `prefers-reduced-motion`, and `update()` animates between any two states.
- **One options object** replaces order-dependent setter chains, and settings are no longer silently reset by `build()`.
- **No hardcoded logos:** about 75 KB of base64 images are replaced by an optional `image` option.
- **Hit regions** are declared while drawing, so hover matches exactly what is drawn. Hovering also dims the other parts.
- **No globals are modified:** v1 reassigned `window.onresize` on every mouse move.
- **Accessible:** each canvas gets `role="img"` and a generated `aria-label`.
