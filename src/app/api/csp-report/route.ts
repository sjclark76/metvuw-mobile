/**
 * What the Content-Security-Policy would have blocked, as browsers report it (see
 * securityHeaders). Each report is logged as one line, `[csp] {...}`, so the
 * Vercel logs show what the policy needs before it is enforced.
 *
 * Browsers send two shapes: report-uri (Firefox, Safari) posts
 * `{"csp-report": {...}}` with kebab-case fields; the Reporting API (Chrome)
 * posts an array of `{type: "csp-violation", body: {...}}` with camelCase ones.
 */

// A report is well under 2 KB; anything far larger is not one.
const MAX_BODY_BYTES = 64 * 1024
const MAX_REPORTS = 20

// Violations caused by the visitor's browser extensions, not the site.
const EXTENSION = /^(chrome|moz|safari(-web)?|ms-browser)-extension:/

type Fields = Record<string, unknown>

interface CspViolation {
  page: string
  directive: string
  blocked: string
  source: string
  disposition: string
}

const text = (value: unknown) => (typeof value === 'string' ? value : '')

// Query strings are dropped: ad URLs carry long ones that say nothing about
// what was blocked.
function withoutQuery(url: string) {
  return url.replace(/[?#].*$/, '')
}

function violation(fields: Fields): CspViolation {
  const pick = (kebab: string, camel: string) =>
    text(fields[kebab]) || text(fields[camel])
  const sourceFile = pick('source-file', 'sourceFile')
  const line = fields['line-number'] ?? fields.lineNumber
  return {
    page: withoutQuery(pick('document-uri', 'documentURL')),
    directive:
      pick('effective-directive', 'effectiveDirective') ||
      pick('violated-directive', 'violatedDirective'),
    blocked: withoutQuery(pick('blocked-uri', 'blockedURL')),
    source: sourceFile
      ? `${withoutQuery(sourceFile)}${typeof line === 'number' ? `:${line}` : ''}`
      : '',
    disposition: pick('disposition', 'disposition'),
  }
}

function readReports(payload: unknown): CspViolation[] {
  const fields: Fields[] = []
  if (Array.isArray(payload)) {
    for (const report of payload) {
      if (report?.type === 'csp-violation' && report.body) {
        fields.push(report.body)
      }
    }
  } else if (
    payload &&
    typeof payload === 'object' &&
    'csp-report' in payload &&
    payload['csp-report']
  ) {
    fields.push(payload['csp-report'] as Fields)
  }
  return fields
    .slice(0, MAX_REPORTS)
    .map(violation)
    .filter(
      (v) =>
        v.directive && !EXTENSION.test(v.blocked) && !EXTENSION.test(v.source),
    )
}

const noContent = () => new Response(null, { status: 204 })

export async function POST(request: Request) {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) return new Response(null, { status: 413 })

  const body = await request.text()
  if (body.length > MAX_BODY_BYTES) return new Response(null, { status: 413 })

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return new Response(null, { status: 400 })
  }

  for (const report of readReports(payload)) {
    // eslint-disable-next-line no-console
    console.warn(`[csp] ${JSON.stringify(report)}`)
  }
  // The browser does nothing with the answer.
  return noContent()
}
