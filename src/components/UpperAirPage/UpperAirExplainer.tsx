/**
 * What the upper air charts are, for someone who has never seen a tephigram. Closed
 * until asked for, so the charts stay first; the browser's own expand and collapse
 * control makes it work with the keyboard and a screen reader.
 */
export function UpperAirExplainer() {
  return (
    <details className="border-rule mx-auto mb-4 max-w-176 border-y px-4 py-3 md:px-0">
      <summary className="text-ink focus-visible:outline-cold cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
        What are these charts?
      </summary>
      <div className="text-ink mt-3 space-y-2 text-sm leading-relaxed">
        <p>
          Weather balloons carry instruments high into the air and measure the
          temperature and wind on the way up. They are launched at 11am and 11pm
          New Zealand time from Whenuapai, Paraparaumu and Invercargill.
        </p>
        <p>
          Each chart is a tephigram: a graph of how the temperature changes with
          height. Forecasters read it to judge how stable the air is, where
          cloud will form and how high the freezing level is.
        </p>
        <p className="text-ink-soft">
          New charts appear about 2:00 to 2:40 am and 2:00 to 2:40 pm.
        </p>
      </div>
    </details>
  )
}
