const sample = {
  viewBox: '0 0 32 20',
  className: 'h-5 w-8 shrink-0',
  'aria-hidden': true,
  focusable: false,
} as const

// Small drawings in the chart's own style, so what is explained is what is on it.
const WindBarb = () => (
  <svg {...sample} fill="none" stroke="#000" strokeWidth="1.2">
    <circle cx="6" cy="16" r="2" fill="#fff" />
    <path d="M6 14V3M6 3l9 3M6 7l5 2" />
  </svg>
)
const Isobar = () => (
  <svg {...sample} fill="none" stroke="#e8201a" strokeWidth="1.6">
    <path d="M2 12C9 2 17 18 30 7" />
  </svg>
)
const RainSwatches = () => (
  <svg {...sample}>
    <rect x="2" y="4" width="8" height="12" fill="#ff00ff" />
    <rect x="12" y="4" width="8" height="12" fill="#0000ff" />
    <rect x="22" y="4" width="8" height="12" fill="#00ffff" />
  </svg>
)

const rows = [
  {
    key: 'wind',
    drawing: <WindBarb />,
    text: 'Wind barbs point into the wind. A short feather is 5 knots, a long one 10, a flag 50.',
  },
  {
    key: 'pressure',
    drawing: <Isobar />,
    text: 'Red lines show air pressure in hPa. Lines close together mean strong wind.',
  },
  {
    key: 'rain',
    drawing: <RainSwatches />,
    text: 'Colours show rain in the last 6 hours, in mm (the key above).',
  },
]

/**
 * What the chart's markings mean, for someone new to them: wind barbs, pressure
 * lines and the rain colours. It sits under the rain key, which is where people
 * look when they cannot read a chart.
 */
export function HowToReadChart() {
  return (
    <section aria-labelledby="how-to-read-chart" className="mt-3 max-w-64">
      <h3
        id="how-to-read-chart"
        className="text-ink mb-1 text-[11px] font-semibold"
      >
        How to read this chart
      </h3>
      <ul className="space-y-1.5">
        {rows.map(({ key, drawing, text }) => (
          <li key={key} className="flex items-center gap-2">
            {drawing}
            <p className="text-ink-soft text-[11px] leading-snug">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
