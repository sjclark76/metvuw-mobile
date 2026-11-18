import fs from 'node:fs'
import path from 'node:path'

import { render, screen } from '@testing-library/react'
import { useAtom } from 'jotai'

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
