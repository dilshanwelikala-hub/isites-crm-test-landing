import type { Access, Where } from 'payload'

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const publishedContent: Where = { _status: { equals: 'published' } }
export const publishedSite: Where = {
  and: [publishedContent, { siteStatus: { equals: 'live' } }],
}

// Enforce publication in the API as well as on the public frontend. Payload also
// applies these predicates when replacing a document with a draft version.
export const readPublishedContent: Access = ({ req }) => (req.user ? true : publishedContent)
export const readPublishedSite: Access = ({ req }) => (req.user ? true : publishedSite)
export const readPublishedPackage: Access = ({ req }) =>
  req.user
    ? true
    : {
        and: [
          publishedContent,
          {
            or: [
              { site: { exists: false } },
              {
                and: [
                  { 'site._status': { equals: 'published' } },
                  { 'site.siteStatus': { equals: 'live' } },
                ],
              },
            ],
          },
        ],
      }
