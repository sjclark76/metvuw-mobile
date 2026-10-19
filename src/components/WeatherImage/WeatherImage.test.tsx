import { render, screen } from '@testing-library/react'
import React from 'react'

import WeatherImage from './WeatherImage'

describe('Weather Image', () => {
  const renderImage = (
    props: Partial<React.ComponentProps<typeof WeatherImage>> = {},
  ) =>
    render(
      <WeatherImage
        chartType="Rain"
        imageAlt="foo"
        imageSrc="baa"
        isHighPriority={false}
        {...props}
      />,
    ).container.querySelector('img')!

  // Explicit assertions in place of a snapshot, which also recorded the
  // placeholder props ("foo", "baa") and so said nothing about what matters.
  test('shows the chart with its alt text and source, at the full width of its box', () => {
    const image = renderImage({
      imageAlt: 'Rain forecast for 6pm',
      imageSrc: '/a.webp',
    })

    expect(image).toHaveAccessibleName('Rain forecast for 6pm')
    expect(image).toHaveAttribute('src', '/a.webp')
    expect(image).toHaveStyle({
      display: 'block',
      width: '100%',
      height: 'auto',
    })
  })

  test.each([
    ['Rain', 565, 396],
    ['Radar', 565, 540],
    ['Satellite', 840, 607],
    ['Upper Air', 760, 690],
  ] as const)(
    'reserves the %s chart size so the page does not shift as it loads',
    (chartType, width, height) => {
      const image = renderImage({ chartType })

      expect(image).toHaveAttribute('width', String(width))
      expect(image).toHaveAttribute('height', String(height))
    },
  )

  test('asks for high fetch priority only for the chart that is shown first', () => {
    expect(renderImage({ isHighPriority: true })).toHaveAttribute(
      'fetchpriority',
      'high',
    )
    expect(renderImage({ isHighPriority: false })).toHaveAttribute(
      'fetchpriority',
      'low',
    )
  })

  test('says so, instead of rendering a broken image, when there is no source', () => {
    const { container } = render(
      <WeatherImage
        chartType="Rain"
        imageAlt="foo"
        imageSrc={undefined}
        isHighPriority={false}
      />,
    )

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByTestId('weather-image-placeholder')).toHaveTextContent(
      'Image not available',
    )
  })

  test('offers no small variant for a satellite chart that is not proxied', () => {
    const image = renderImage({
      chartType: 'Satellite',
      imageSrc: '/plain.webp',
    })

    expect(image).not.toHaveAttribute('srcset')
    expect(image).toHaveAttribute('width', '840')
  })

  test('offers a small and a full upper air chart from the proxy', () => {
    const src =
      '/api/fallback-image?chartType=Upper+Air&variant=primary&url=https%3A%2F%2Fmetvuw.com%2Fupperair%2Fa.png'
    const image = renderImage({ chartType: 'Upper Air', imageSrc: src })

    expect(image?.getAttribute('srcset')).toMatch(
      /variant=small.* 300w, .*variant=primary.* 760w/,
    )
    expect(image?.getAttribute('sizes')).toContain('760px')
  })

  test('swaps the folder for the small variant of a stored satellite image', () => {
    const src = 'https://x.supabase.co/storage/v1/object/public/images/s.webp'
    const image = renderImage({ chartType: 'Satellite', imageSrc: src })

    expect(image?.getAttribute('srcset')).toContain('/small-images/s.webp 300w')
  })

  test('never offers a small variant for rain or radar', () => {
    const src = '/api/fallback-image?chartType=Rain&variant=primary&url=x'

    expect(
      renderImage({ chartType: 'Rain', imageSrc: src }),
    ).not.toHaveAttribute('srcset')
    expect(
      renderImage({ chartType: 'Radar', imageSrc: src }),
    ).not.toHaveAttribute('srcset')
  })

  test('decodes images asynchronously', () => {
    const { container } = render(
      <WeatherImage
        chartType="Rain"
        imageAlt="foo"
        imageSrc="baa"
        isHighPriority={false}
      />,
    )

    expect(container.querySelector('img')).toHaveAttribute('decoding', 'async')
  })

  test('passes the loading strategy through to the img', () => {
    const { container } = render(
      <WeatherImage
        chartType="Rain"
        imageAlt="foo"
        imageSrc="baa"
        isHighPriority={false}
        loading="lazy"
      />,
    )

    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy')
  })

  // The animated viewers swap the src of one image, so they must stay eager.
  test('leaves loading unset by default', () => {
    const { container } = render(
      <WeatherImage
        chartType="Rain"
        imageAlt="foo"
        imageSrc="baa"
        isHighPriority={false}
      />,
    )

    expect(container.querySelector('img')).not.toHaveAttribute('loading')
  })

  test('satellite proxy image uses small variant srcset', () => {
    const { container } = render(
      <WeatherImage
        chartType="Satellite"
        imageAlt="proxy"
        imageSrc="/api/fallback-image?chartType=Satellite&variant=primary&url=https%3A%2F%2Fmetvuw.com%2Fsatellite%2Fbig%2F2026022500.jpg"
        isHighPriority={false}
      />,
    )

    const image = container.querySelector('img')
    expect(image?.getAttribute('srcset')).toContain('variant=small')
  })
})
