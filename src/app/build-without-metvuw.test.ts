import { existsSync } from 'node:fs'
import { join } from 'node:path'

import * as home from './home/[region]/page'
import * as radar from './radar/[code]/page'
import * as region from './regions/[name]/page'
import * as satellite from './satellite/[[...rest]]/page'
import * as upperAir from './upperair/[[...balloon]]/page'

// A chart page built ahead of time fetches metvuw.com during the build, so the
// build failed whenever metvuw was down and no deploy could go out (a fix
// included). Every chart page is therefore a route with a parameter that builds
// nothing ahead of time: rendered on its first visit, then cached.
describe('the chart pages', () => {
  test.each([
    ['home', home],
    ['regions', region],
    ['radar', radar],
    ['satellite', satellite],
    ['upper air', upperAir],
  ])(
    '%s builds no page ahead of time, and is cached once visited',
    (_, page) => {
      expect(page.generateStaticParams()).toEqual([])
      expect(page.revalidate).toBe(3600)
    },
  )

  test('the root is not a page of its own (it is rewritten to the home page)', () => {
    expect(existsSync(join(process.cwd(), 'src/app/page.tsx'))).toBe(false)
  })
})
