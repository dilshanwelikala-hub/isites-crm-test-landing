import assert from 'node:assert/strict'
import { test } from 'node:test'
import { withDOM } from '@lexical/headless/dom'
import sharp from 'sharp'

test('patched HTML parser still supports the editor server-side DOM helper', () => {
  const text = withDOM((window) => {
    const document = new window.DOMParser().parseFromString(
      '<p>Editor compatibility check</p>',
      'text/html',
    )
    return document.body.textContent
  })
  assert.equal(text, 'Editor compatibility check')
})

test('patched image processor can decode resize and encode media variants', async () => {
  const png = await sharp({ create: { width: 12, height: 8, channels: 3, background: '#314339' } })
    .png()
    .toBuffer()
  const variant = await sharp(png).resize({ width: 6 }).webp().toBuffer()
  const metadata = await sharp(variant).metadata()
  assert.equal(metadata.width, 6)
  assert.equal(metadata.height, 4)
  assert.equal(metadata.format, 'webp')
})
