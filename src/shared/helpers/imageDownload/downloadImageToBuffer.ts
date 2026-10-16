import { allowedOriginFor } from '@/shared/helpers/dataSource/allowedSourceUrl'

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024
const MAX_REDIRECTS = 3
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

export class UpstreamImageError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'UpstreamImageError'
  }
}

interface DownloadOptions {
  timeoutMs?: number
  maxBytes?: number
}

async function readBodyWithLimit(response: Response, maxBytes: number) {
  const declaredLength = Number(response.headers.get('content-length'))
  if (declaredLength > maxBytes) {
    throw new UpstreamImageError(`image too large (${declaredLength} bytes)`)
  }

  const reader = response.body?.getReader()
  if (!reader) return Buffer.alloc(0)

  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) {
      await reader.cancel()
      throw new UpstreamImageError(`image too large (over ${maxBytes} bytes)`)
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}

// The request URL is built from our configured origin plus only the path and
// query of the caller-supplied URL, so the host being fetched is never
// attacker-controlled. Returns undefined when the URL isn't allowed.
function requestUrlFor(url: URL): string | undefined {
  const origin = allowedOriginFor(url)
  return origin === undefined
    ? undefined
    : `${origin}${url.pathname}${url.search}`
}

/**
 * Downloads an image from an allowed source URL. Redirects are never followed
 * implicitly: each hop is re-checked against the allowlist (up to
 * MAX_REDIRECTS). The whole exchange, including reading the body, is bounded by
 * a timeout, and the response must be a 2xx `image/*` no larger than maxBytes.
 * Every failure is an UpstreamImageError.
 */
export async function downloadImageToBuffer(
  url: string,
  {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
  }: DownloadOptions = {},
) {
  try {
    let current = new URL(url)
    let requestUrl = requestUrlFor(current)
    if (requestUrl === undefined) {
      throw new UpstreamImageError('source url not allowed')
    }

    const signal = AbortSignal.timeout(timeoutMs)
    let response = await fetch(requestUrl, { redirect: 'manual', signal })

    for (let hops = 0; REDIRECT_STATUSES.has(response.status); hops++) {
      const location = response.headers.get('location')
      if (hops >= MAX_REDIRECTS || !location) {
        throw new UpstreamImageError('too many redirects', response.status)
      }
      current = new URL(location, current)
      requestUrl = requestUrlFor(current)
      if (requestUrl === undefined) {
        throw new UpstreamImageError(
          'redirect target not allowed',
          response.status,
        )
      }
      response = await fetch(requestUrl, { redirect: 'manual', signal })
    }

    if (!response.ok) {
      throw new UpstreamImageError(
        `upstream responded ${response.status}`,
        response.status,
      )
    }

    const contentType = response.headers.get('content-type') ?? undefined
    if (!contentType?.startsWith('image/')) {
      throw new UpstreamImageError(
        `response is not an image (${contentType ?? 'no content-type'})`,
        response.status,
      )
    }

    return {
      fileBuffer: await readBodyWithLimit(response, maxBytes),
      contentType,
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`error [downloadImageToBuffer] ${url}`)
    if (e instanceof UpstreamImageError) throw e
    if (e instanceof Error && e.name === 'TimeoutError') {
      throw new UpstreamImageError('upstream request timed out')
    }
    throw new UpstreamImageError(
      e instanceof Error ? e.message : 'upstream request failed',
    )
  }
}
