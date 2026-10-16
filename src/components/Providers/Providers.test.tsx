import fs from 'node:fs'
import path from 'node:path'

import { render, screen } from '@testing-library/react'
import { useAtom } from 'jotai'
import * as m from 'motion/react-m'

import { isMenuOpenAtom } from '@/components/Atoms/GlobalState'

import { Providers } from './Providers'

function MenuState() {
  const [open] = useAtom(isMenuOpenAtom)
  return <p>{open ? 'open' : 'closed'}</p>
}

describe('<Providers />', () => {
  test('gives the page its own jotai store', () => {
    render(
      <Providers>
        <MenuState />
      </Providers>,
    )

    expect(screen.getByText('closed')).toBeInTheDocument()
  })

  test('lets lazy `m` components render without the full motion bundle', () => {
    render(
      <Providers>
        <m.p animate={{ opacity: 1 }}>animated</m.p>
      </Providers>,
    )

    expect(screen.getByText('animated')).toBeInTheDocument()
  })

  // `strict` makes the full `motion` component throw, so nobody can quietly add
  // it back and pull the whole feature set into every page's bundle.
  test('rejects the full `motion` component', async () => {
    const { motion } = await import('motion/react')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      render(
        <Providers>
          <motion.p animate={{ opacity: 1 }}>heavy</motion.p>
        </Providers>,
      ),
    ).toThrow(/LazyMotion/)
    consoleError.mockRestore()
  })
})

// A 'use client' layout ships the whole shell to the browser and cannot export
// metadata or viewport; the client parts live in <Providers /> instead.
describe('root layout', () => {
  test('runs on the host, not in the browser', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../app/layout.tsx'),
      'utf8',
    )

    expect(source).not.toMatch(/^\s*['"]use client['"]/m)
  })
})
