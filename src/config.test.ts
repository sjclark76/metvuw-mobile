async function loadConfig() {
  vi.resetModules()
  return (await import('./config')).config
}

describe('config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('uses the production URL Vercel provides', async () => {
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'metvuw.example.com')

    expect((await loadConfig()).baseUrl).toBe('https://metvuw.example.com')
  })

  // The fallback used to be a personal ngrok tunnel, which ended up in canonical
  // and OpenGraph URLs of every build made outside Vercel.
  test('falls back to the local dev server, not a tunnel', async () => {
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')

    expect((await loadConfig()).baseUrl).toBe('http://localhost:3002')
  })

  test('has a single metvuw source URL (the cloudFront alias is gone)', async () => {
    const config = await loadConfig()

    expect(config.metvuwBaseUrl).toBe('https://metvuw.com/')
    expect(config).not.toHaveProperty('cloudFrontUrl')
  })

  test('takes the AdSense publisher id from the environment, with the site default', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT_ID', '')
    expect((await loadConfig()).adsenseClientId).toBe('ca-pub-9572839501955022')

    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT_ID', 'ca-pub-1111111111111111')
    expect((await loadConfig()).adsenseClientId).toBe('ca-pub-1111111111111111')
  })
})
