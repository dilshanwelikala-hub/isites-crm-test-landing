import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import {
  createPreviewToken,
  verifyPreviewToken,
  previewEnabled,
  previewURL,
  sitePath,
  packagePath,
} from '../src/lib/preview'

let saved: { preview?: string; auth?: string; url?: string }
beforeEach(() => {
  saved = {
    preview: process.env.PREVIEW_SECRET,
    auth: process.env.PAYLOAD_SECRET,
    url: process.env.NEXT_PUBLIC_SITE_URL,
  }
  process.env.PREVIEW_SECRET = 'preview-test-key-only-not-a-real-secret-123456'
  process.env.PAYLOAD_SECRET = 'authentication-test-key-not-a-real-secret-456'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://preview.example.test'
})
afterEach(() => {
  for (const [key, value] of [
    ['PREVIEW_SECRET', saved.preview],
    ['PAYLOAD_SECRET', saved.auth],
    ['NEXT_PUBLIC_SITE_URL', saved.url],
  ]) {
    if (value === undefined) delete process.env[key!]
    else process.env[key!] = value
  }
})

test('preview links contain an expiring path-scoped signature instead of either signing key', () => {
  const path = packagePath('weekend', 'resort')
  const token = createPreviewToken(path)!
  const url = previewURL(path)!
  assert.equal(verifyPreviewToken(token, path), true)
  assert.equal(verifyPreviewToken(token, packagePath('other', 'resort')), false)
  assert.equal(verifyPreviewToken(token, packagePath('weekend', 'other')), false)
  assert.equal(verifyPreviewToken(token, path, Date.now() + 16 * 60 * 1000), false)
  assert.equal(verifyPreviewToken(`${token.slice(0, -4)}xxxx`, path), false)
  assert.equal(url.includes(process.env.PREVIEW_SECRET!), false)
  assert.equal(url.includes(process.env.PAYLOAD_SECRET!), false)
  assert.equal(previewEnabled({ preview: 'true', previewToken: token }, path), true)
  assert.equal(previewEnabled({ preview: 'true', previewToken: [token] }, path), false)
  assert.equal(previewEnabled({ previewToken: token }, path), false)
  assert.equal(verifyPreviewToken(process.env.PREVIEW_SECRET, path), false)
  assert.equal(verifyPreviewToken(process.env.PAYLOAD_SECRET, path), false)
})

test('preview fails closed when the dedicated key is missing, short, or reused from authentication', () => {
  for (const key of ['', 'short', process.env.PAYLOAD_SECRET!]) {
    process.env.PREVIEW_SECRET = key
    assert.equal(createPreviewToken('/'), null)
    assert.equal(previewURL('/'), null)
    assert.equal(verifyPreviewToken('a.b', '/'), false)
  }
})

test('preview paths encode slugs and reject unsafe destinations and malformed tokens', () => {
  assert.equal(sitePath('resort ?'), '/sites/resort%20%3F')
  assert.equal(packagePath('offer/one'), '/packages/offer%2Fone')
  for (const path of ['//outside.example', 'https://outside.example', '/?other=true', '/a\\b']) {
    assert.equal(createPreviewToken(path), null)
  }
  for (const token of [null, {}, 'invalid', 'a.b.c', 'x'.repeat(3001), 'a.@@']) {
    assert.equal(verifyPreviewToken(token, '/'), false)
  }
})
