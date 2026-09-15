/*!
 * Awesome Graphs v2 — interactive showcase
 * Every card is generated from the DEMOS config below: chart options, the sliders
 * that drive them, optional variants and toggles, plus live, copyable code.
 */
(function () {
    'use strict';

    const AG = window.AwesomeGraphs;
    const charts = [];

    /* ============================================================ helpers */

    function h(tag, attrs = {}, ...children) {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (value == null || value === false) return;
            if (key === 'class') el.className = value;
            else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
            else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
            else el.setAttribute(key, value === true ? '' : value);
        });
        children.flat(Infinity).forEach((child) => {
            if (child == null || child === false) return;
            el.append(child instanceof Node ? child : document.createTextNode(String(child)));
        });
        return el;
    }

    const icon = (paths) => {
        const wrap = document.createElement('span');
        wrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
        return wrap.firstChild;
    };
    const ICONS = {
        replay: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/>',
        shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
        reset: '<path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/><circle cx="12" cy="12" r="1.5"/>',
        link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    };

    const clone = (value) => JSON.parse(JSON.stringify(value));
    const randomInt = (min, max) => Math.round(min + Math.random() * (max - min));
    const getIn = (obj, path) => path.reduce((node, key) => (node == null ? undefined : node[key]), obj);

    /** Build the smallest options patch that sets `path` (top-level key, or key + array index). */
    function patchFor(options, path, value) {
        const [key, index] = path;
        if (index === undefined) return { [key]: value };
        const list = options[key].slice();
        list[index] = value;
        return { [key]: list };
    }

    let toastTimer = 0;
    function toast(message) {
        let el = document.querySelector('.ag-toast');
        if (!el) {
            el = h('div', { class: 'ag-toast', role: 'status', 'aria-live': 'polite' });
            document.body.append(el);
        }
        el.textContent = message;
        el.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('is-visible'), 1600);
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            const area = h('textarea', { style: { position: 'fixed', opacity: '0' } });
            area.value = text;
            document.body.append(area);
            area.select();
            document.execCommand('copy');
            area.remove();
        }
        toast('Copied to clipboard');
    }

    /* ====================================================== code rendering */

    const escapeHtml = (str) => str.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function highlight(code) {
        const pattern = /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|\b(const|let|new|await|null|true|false)\b|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\s*:)|([A-Za-z_$][\w$]*)(?=\()/g;
        const kinds = ['com', 'str', 'kw', 'num', 'key', 'fn'];
        let html = '';
        let last = 0;
        code.replace(pattern, (match, ...groups) => {
            const offset = groups[kinds.length];
            const kind = kinds[groups.slice(0, kinds.length).findIndex((g) => g !== undefined)];
            html += escapeHtml(code.slice(last, offset)) + `<span class="tok-${kind}">${escapeHtml(match)}</span>`;
            last = offset + match.length;
            return match;
        });
        return html + escapeHtml(code.slice(last));
    }

    /** Serialize options as a readable JS object literal. */
    function literal(value, depth = 0) {
        const pad = '    '.repeat(depth);
        if (value === null) return 'null';
        if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        if (typeof value === 'number') return String(Math.round(value * 100) / 100);
        if (typeof value !== 'object') return String(value);
        if (Array.isArray(value)) {
            const inline = `[${value.map((v) => literal(v, depth + 1)).join(', ')}]`;
            if (inline.length <= 60 && !inline.includes('\n')) return inline;
            return `[\n${value.map((v) => `${pad}    ${literal(v, depth + 1)}`).join(',\n')}\n${pad}]`;
        }
        const entries = Object.entries(value).filter(([, v]) => v !== undefined);
        return `{\n${entries.map(([k, v]) => `${pad}    ${k}: ${literal(v, depth + 1)}`).join(',\n')}\n${pad}}`;
    }

    function codeBlock(text, label = 'JavaScript') {
        const code = h('code');
        const block = h('div', { class: 'ag-code' },
            h('div', { class: 'ag-code__bar' },
                h('span', {}, label),
                h('button', { class: 'ag-code__copy', type: 'button', onClick: () => copyText(code.textContent) }, 'Copy')),
            h('pre', {}, code));
        block.setCode = (source) => (code.innerHTML = highlight(source));
        block.setCode(text);
        return block;
    }

    /* =========================================================== demo data */

    const LOGO = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
        '<path d="M50 12a38 38 0 1 1-38 38" fill="none" stroke="#ee8a2f" stroke-width="14" stroke-linecap="round"/>' +
        '<path d="M50 34a16 16 0 1 1-16 16" fill="none" stroke="#5b7bb0" stroke-width="12" stroke-linecap="round"/></svg>');

    const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const SKILLS = ['Speed', 'Power', 'Range', 'Agility', 'Stamina'];

    const range = (label, path, min, max, extra = {}) => ({ label, path, min, max, step: 1, ...extra });
    const compareToggle = (hint, snapshot) => ({
        id: 'compare',
        label: 'Compare to baseline',
        hint,
        on: (o) => ({ baseline: snapshot(o) }),
        off: () => ({ baseline: null }),
    });
    const DELTA_LEGEND = (color) => [[color, 'Current'], ['var(--ag-success)', 'Increase'], ['var(--ag-danger)', 'Decrease']];

    const DEMOS = [
        {
            type: 'segment-ring',
            name: 'Segment Ring',
            legacy: 'TypeOne',
            color: '#c35d9f',
            description: 'Several scores on one ring. Each segment grows outward with its value and the centre shows the average.',
            options: {
                values: [426, 515, 140, 251, 690],
                labels: WEEKDAYS,
                tooltips: WEEKDAY_NAMES,
                badge: 'A',
                max: 900,
            },
            fields: (o) => [{ legend: 'Values', items: o.values.map((_, i) => range(o.tooltips[i], ['values', i], 0, o.max, { basePath: ['baseline', i] })) }],
            toggles: [compareToggle('Freeze the current values, then move a slider', (o) => o.values.slice())],
            legend: DELTA_LEGEND('#c35d9f'),
            randomize: (o) => ({ values: o.values.map(() => randomInt(60, 880)) }),
        },
        {
            type: 'arc-gauge',
            name: 'Arc Gauge',
            legacy: 'TypeTwo',
            color: '#5b7bb0',
            description: 'One value against a maximum. Turn on comparison to show how far it moved from a previous reading.',
            options: {
                value: 500,
                max: 900,
                label: 'Monthly score',
                badge: 'E',
            },
            fields: () => [{ legend: 'Value', items: [range('Monthly score', ['value'], 0, 900, { basePath: ['baseline'] })] }],
            variants: [
                { label: 'Square', patch: { rounded: false } },
                { label: 'Rounded', patch: { rounded: true } },
            ],
            toggles: [compareToggle('Freeze the current value, then move the slider', (o) => o.value)],
            legend: DELTA_LEGEND('#5b7bb0'),
            randomize: () => ({ value: randomInt(40, 880) }),
        },
        {
            type: 'combo-ring',
            name: 'Combo Ring',
            legacy: 'TypeThree',
            color: '#ee8a2f',
            description: 'Three related views in one shape: segment bars outside, a progress arc inside and a radar shape in the core.',
            options: {
                bars: [426, 515, 140, 251, 690],
                barLabels: WEEKDAY_NAMES,
                arc: 500,
                arcLabel: 'Weekly goal',
                shape: [426, 555, 740, 351, 300],
                shapeLabels: SKILLS,
                score: 800,
                max: 900,
            },
            fields: (o) => [
                { legend: 'Outer bars', items: o.bars.map((_, i) => range(o.barLabels[i], ['bars', i], 0, o.max, { basePath: ['baseline', 'bars', i] })) },
                { legend: 'Inner arc', items: [range(o.arcLabel, ['arc'], 0, o.max, { basePath: ['baseline', 'arc'] })] },
                { legend: 'Core shape', collapsed: true, items: o.shape.map((_, i) => range(o.shapeLabels[i], ['shape', i], 0, o.max)) },
            ],
            variants: [
                { label: 'Score', patch: { score: 800, image: null } },
                { label: 'Image', patch: { score: null, image: LOGO } },
            ],
            toggles: [compareToggle('Freeze bars and arc, then move a slider', (o) => ({ bars: o.bars.slice(), arc: o.arc }))],
            legend: DELTA_LEGEND('#ee8a2f'),
            randomize: (o) => ({
                bars: o.bars.map(() => randomInt(60, 880)),
                arc: randomInt(60, 880),
                shape: o.shape.map(() => randomInt(200, 880)),
            }),
        },
        {
            type: 'radar',
            name: 'Radar',
            legacy: 'TypeFour',
            color: '#2aa7ae',
            description: 'Compare dimensions side by side. Hover a point for its value; a dashed outline shows the baseline.',
            options: {
                values: [426, 555, 740, 351, 300],
                labels: SKILLS,
                max: 900,
            },
            fields: (o) => [{ legend: 'Values', items: o.values.map((_, i) => range(o.labels[i], ['values', i], 0, o.max, { basePath: ['baseline', i] })) }],
            variants: [
                { label: '5 rings', patch: { rings: 5 } },
                { label: '10 rings', patch: { rings: 10 } },
            ],
            toggles: [compareToggle('Keep the current shape as a dashed outline', (o) => o.values.slice())],
            legend: [['#2aa7ae', 'Current'], ['var(--ag-muted)', 'Baseline (dashed)']],
            randomize: (o) => ({ values: o.values.map(() => randomInt(120, 880)) }),
        },
        {
            type: 'concentric-arcs',
            name: 'Concentric Arcs',
            legacy: 'TypeFive',
            color: '#ee8a2f',
            description: 'Nested arcs for related totals. Hover a ring and the centre switches to that ring’s value.',
            options: {
                values: [500, 600],
                labels: ['Revenue', 'Target'],
                max: 900,
            },
            fields: (o) => [{ legend: 'Rings', items: o.values.map((_, i) => range(o.labels[i], ['values', i], 0, o.max)) }],
            variants: [
                { label: '1 ring', patch: { values: [500], labels: ['Revenue'] } },
                { label: '2 rings', patch: { values: [500, 600], labels: ['Revenue', 'Target'] } },
                { label: '3 rings', patch: { values: [500, 600, 420], labels: ['Revenue', 'Target', 'Last year'] } },
            ],
            defaultVariant: 1,
            toggles: [{ id: 'image', label: 'Centre image', hint: 'Show a logo instead of the value', on: () => ({ image: LOGO }), off: () => ({ image: null }) }],
            randomize: (o) => ({ values: o.values.map(() => randomInt(80, 880)) }),
        },
        {
            type: 'segmented-dial',
            name: 'Segmented Dial',
            legacy: 'TypeSix',
            color: '#5b7bb0',
            description: 'A percentage split into zones. Zones can share one colour or read like a traffic light.',
            options: {
                value: 15,
                label: 'Completion',
            },
            fields: () => [{ legend: 'Value', items: [range('Completion (%)', ['value'], 0, 100)] }],
            variants: [
                { label: '3 zones', patch: { segments: 3 } },
                { label: '4 zones', patch: { segments: 4 } },
                { label: '5 zones', patch: { segments: 5 } },
            ],
            toggles: [{
                id: 'zones', label: 'Zone colours', hint: 'Colour each zone from red to green',
                on: () => ({ colors: { zones: ['#e5484d', '#f5a524', '#e8c63a', '#7cc05a', '#1f9d63'] } }),
                off: () => ({ colors: { zones: null } }),
            }],
            randomize: () => ({ value: randomInt(0, 100) }),
        },
        {
            type: 'needle-meter',
            name: 'Needle Meter',
            legacy: 'TypeSeven',
            color: '#ee8a2f',
            description: 'A reading against an accepted range. The status under the needle updates as the value crosses a limit.',
            options: {
                value: -50,
                range: 300,
                limits: [-20, 20],
                label: 'Drift',
                captions: ['Drift from target, in units', 'Values inside the limits are accepted'],
            },
            fields: () => [
                { legend: 'Reading', items: [range('Value', ['value'], -150, 150)] },
                { legend: 'Limits', items: [range('Lower limit', ['limits', 0], -120, 0), range('Upper limit', ['limits', 1], 0, 120)] },
            ],
            toggles: [{ id: 'limits', label: 'Limit labels', hint: 'Numbers next to the limit ticks', checked: true, on: () => ({ showLimits: true }), off: () => ({ showLimits: false }) }],
            randomize: () => ({ value: randomInt(-150, 150) }),
        },
    ];

    /* ================================================================ cards */

    function createCard(demo) {
        const Chart = AG.charts[demo.type];
        const variantIndex = demo.variants ? demo.defaultVariant || 0 : -1;
        const initial = clone({ ...demo.options, ...(demo.variants ? demo.variants[variantIndex].patch : {}) });
        (demo.toggles || []).forEach((toggle) => {
            if (toggle.checked) Object.assign(initial, toggle.on(initial));
        });

        let options = clone(initial);
        const state = { variant: variantIndex, toggles: new Set((demo.toggles || []).filter((t) => t.checked).map((t) => t.id)) };

        /* ---- DOM ---- */
        const chartSlot = h('div', { class: 'ag-stage__chart' });
        const legend = h('div', { class: 'ag-stage__legend', hidden: true },
            (demo.legend || []).map(([color, text]) => h('span', {}, h('i', { style: { background: color } }), text)));
        const stage = h('div', { class: 'ag-stage' },
            h('div', { class: 'ag-stage__tools' },
                h('button', { class: 'ag-btn ag-btn--sm', type: 'button', title: 'Replay animation', onClick: () => chart.replay() }, icon(ICONS.replay), 'Replay')),
            chartSlot,
            legend);

        const controls = h('div', { class: 'ag-controls' });
        const code = codeBlock('');

        const card = h('article', { class: 'ag-card', id: demo.type, 'aria-labelledby': demo.type + '-title' },
            h('header', { class: 'ag-card__head' },
                h('div', {},
                    h('h2', { id: demo.type + '-title' },
                        h('span', { class: 'ag-nav__dot', style: { background: demo.color } }),
                        demo.name),
                    h('p', {}, demo.description)),
                h('span', { class: 'ag-chip', title: 'Name in the classic (v1) library' }, 'v1: ' + demo.legacy)),
            h('div', { class: 'ag-card__body' }, stage, controls),
            h('div', { class: 'ag-card__code' }, code));

        const chart = new Chart(chartSlot, clone(options));
        charts.push(chart);

        /* ---- behaviour ---- */
        function syncCode() {
            const shown = clone(options);
            if (shown.image) shown.image = 'logo.svg';
            Object.keys(shown).forEach((key) => shown[key] === null && delete shown[key]);
            code.setCode(
                `const chart = new AwesomeGraphs.${Chart.name}('#chart', ${literal(shown)});\n\n` +
                `// Later: animate from what is on screen to new data\n` +
                `chart.update({ ${updateHint()} });`);
        }

        function updateHint() {
            const key = ['values', 'bars', 'value'].find((k) => k in options);
            return `${key}: ${literal(options[key])}`;
        }

        function apply(patch, transition) {
            options = AG.utils.deepMerge(options, clone(patch));
            chart.update(patch, transition);
            legend.hidden = !options.baseline;
            syncFields();
            syncCode();
        }

        const fieldRefs = [];

        function syncFields() {
            fieldRefs.forEach(({ field, input, output, delta }) => {
                const value = getIn(options, field.path);
                input.value = value;
                input.style.setProperty('--fill', ((value - field.min) / (field.max - field.min)) * 100 + '%');
                output.textContent = value;
                const base = field.basePath ? getIn(options, field.basePath) : undefined;
                if (base == null) {
                    delta.textContent = '';
                    delta.className = 'ag-field__delta';
                } else {
                    delta.textContent = AG.utils.formatDelta(value - base);
                    delta.className = 'ag-field__delta' + (value > base ? ' is-up' : value < base ? ' is-down' : '');
                }
            });
        }

        function buildControls() {
            fieldRefs.length = 0;
            controls.replaceChildren();

            if (demo.variants) {
                const group = h('div', { class: 'ag-segmented', role: 'group', 'aria-label': 'Variant' });
                demo.variants.forEach((variant, index) => {
                    group.append(h('button', {
                        type: 'button',
                        'aria-pressed': String(index === state.variant),
                        onClick: () => {
                            if (index === state.variant) return;
                            state.variant = index;
                            apply(variant.patch);
                            buildControls();
                        },
                    }, variant.label));
                });
                controls.append(group);
            }

            demo.fields(options).forEach((group) => {
                // Long groups start collapsed so the chart stays in view.
                const fieldset = group.collapsed
                    ? h('details', { class: 'ag-controls__group' }, h('summary', { class: 'ag-controls__legend' }, group.legend))
                    : h('fieldset', { class: 'ag-controls__group' }, h('legend', { class: 'ag-controls__legend' }, group.legend));
                group.items.forEach((field) => {
                    const id = `${demo.type}-${field.path.join('-')}`;
                    const output = h('output', { for: id });
                    const delta = h('span', { class: 'ag-field__delta' });
                    const input = h('input', {
                        id, class: 'ag-range', type: 'range', min: field.min, max: field.max, step: field.step,
                        onInput: (event) => apply(patchFor(options, field.path, Number(event.target.value)), { duration: 280 }),
                    });
                    input.style.setProperty('--accent', demo.color);
                    fieldset.append(h('div', { class: 'ag-field' },
                        h('label', { class: 'ag-field__row', for: id }, h('span', {}, field.label), h('span', {}, output, delta)),
                        input));
                    fieldRefs.push({ field, input, output, delta });
                });
                controls.append(fieldset);
            });

            (demo.toggles || []).forEach((toggle) => {
                const input = h('input', {
                    type: 'checkbox',
                    checked: state.toggles.has(toggle.id),
                    onChange: (event) => {
                        if (event.target.checked) state.toggles.add(toggle.id);
                        else state.toggles.delete(toggle.id);
                        apply(event.target.checked ? toggle.on(options) : toggle.off(options));
                    },
                });
                controls.append(h('label', { class: 'ag-switch' },
                    h('span', {}, toggle.label, h('small', {}, toggle.hint)),
                    input,
                    h('span', { class: 'ag-switch__track', 'aria-hidden': 'true' })));
            });

            controls.append(h('div', { class: 'ag-controls__actions' },
                h('button', { class: 'ag-btn', type: 'button', onClick: () => apply(demo.randomize(options)) }, icon(ICONS.shuffle), 'Randomize'),
                h('button', {
                    class: 'ag-btn', type: 'button',
                    onClick: () => {
                        // Undo every toggle first so keys that only toggles set (baseline, image, colours…) are cleared too.
                        const undo = Object.assign({}, ...(demo.toggles || []).map((t) => t.off(options)));
                        chart.update({ ...undo, ...clone(initial) });
                        options = clone(initial);
                        state.variant = variantIndex;
                        state.toggles = new Set((demo.toggles || []).filter((t) => t.checked).map((t) => t.id));
                        legend.hidden = !options.baseline;
                        buildControls();
                        syncCode();
                    },
                }, icon(ICONS.reset), 'Reset')));

            syncFields();
        }

        buildControls();
        syncCode();
        return card;
    }

    /* =============================================================== page */

    function buildGallery() {
        const nav = document.getElementById('ag-nav');
        const cards = document.getElementById('ag-cards');
        if (!nav || !cards) return;

        DEMOS.forEach((demo) => {
            cards.append(createCard(demo));
            nav.append(h('li', {},
                h('a', { href: '#' + demo.type },
                    h('span', { class: 'ag-nav__dot', style: { background: demo.color } }),
                    demo.name,
                    h('small', {}, demo.legacy.replace('Type', '')))));
        });

        // Scroll-spy
        const links = new Map(Array.from(nav.querySelectorAll('a')).map((a) => [a.hash.slice(1), a]));
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((link) => link.removeAttribute('aria-current'));
                const active = links.get(entry.target.id);
                if (active) {
                    active.setAttribute('aria-current', 'true');
                    active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                }
            });
        }, { rootMargin: '-35% 0px -60% 0px' });
        cards.querySelectorAll('.ag-card').forEach((card) => spy.observe(card));
    }

    function buildHero() {
        const slots = document.querySelectorAll('[data-hero-chart]');
        const presets = {
            combo: ['combo-ring', { bars: [520, 610, 380, 450, 760], arc: 640, shape: [600, 480, 760, 420, 540], score: 812, size: 300 }],
            radar: ['radar', { values: [620, 480, 760, 540, 700], labels: SKILLS, size: 220 }],
            dial: ['segmented-dial', { value: 72, label: 'Completion', size: 220 }],
        };
        slots.forEach((slot) => {
            const [type, options] = presets[slot.dataset.heroChart];
            charts.push(AG.create(type, slot, options));
        });
    }

    function highlightStaticCode() {
        document.querySelectorAll('.ag [data-code]').forEach((node) => {
            const source = node.textContent.replace(/^\n+|\s+$/g, '');
            const block = codeBlock(source, node.dataset.code || 'JavaScript');
            node.replaceWith(block);
        });
    }

    function setupTheme() {
        const root = document.documentElement;
        const buttons = document.querySelectorAll('[data-theme-choice]');
        const current = () => root.dataset.agTheme || 'auto';
        const refresh = () => charts.forEach((chart) => chart.render());

        function choose(choice) {
            if (choice === 'auto') delete root.dataset.agTheme;
            else root.dataset.agTheme = choice;
            try {
                localStorage.setItem('ag-theme', choice);
            } catch (error) { /* storage unavailable */ }
            buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === choice)));
            refresh();
        }

        buttons.forEach((button) => button.addEventListener('click', () => choose(button.dataset.themeChoice)));
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === current())));
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refresh);
    }

    highlightStaticCode();
    buildHero();
    buildGallery();
    setupTheme();

    // Exposed for poking around in the console.
    window.AwesomeGraphsShowcase = { charts, demos: DEMOS };
})();
