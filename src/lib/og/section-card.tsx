/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'

export const ogImageSize = { width: 1200, height: 630 }
export const ogImageContentType = 'image/png'

const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://siouxland.online')

interface SectionOgImageProps {
  eyebrow: string
  title: string
  date?: string | null
  metrics?: string[]
  fallbackMetric?: string | null
  footerPath: string
  footerNote: string
  imageTopBadge: string
  imagePanelEyebrow: string
  imagePanelTitle: string
  imagePanelBody: string
  imagePath?: string
}

export function getOgAssetUrl(path: string) {
  return new URL(path, SITE_URL).toString()
}

function getTitleFontSize(title: string) {
  if (title.length > 80) return 46
  if (title.length > 58) return 52
  return 60
}

export function createSectionOgImage({
  eyebrow,
  title,
  date,
  metrics = [],
  fallbackMetric,
  footerPath,
  footerNote,
  imageTopBadge,
  imagePanelEyebrow,
  imagePanelTitle,
  imagePanelBody,
  imagePath = '/siouxlandbridge-evening.jpeg',
}: SectionOgImageProps) {
  const displayMetrics = metrics.length > 0
    ? metrics
    : fallbackMetric
      ? [fallbackMetric]
      : []

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #18110d 0%, #2a1b12 58%, #4a2d18 100%)',
          padding: '26px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top right, rgba(229, 179, 92, 0.22), transparent 32%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            borderRadius: '30px',
            overflow: 'hidden',
            border: '1px solid rgba(247, 234, 216, 0.14)',
            background: 'rgba(15, 10, 7, 0.22)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '64%',
              height: '100%',
              padding: '42px 44px 38px',
              background: 'linear-gradient(180deg, #f7ead8 0%, #efe1cd 100%)',
              color: '#2d2117',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '34px',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '0.24em',
                  color: '#6f5846',
                }}
              >
                SIOUXLAND ONLINE
              </span>
              <span
                style={{
                  fontSize: '18px',
                  color: '#8d745f',
                }}
              >
                Local signal for the 712
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'flex-start',
                borderRadius: '999px',
                padding: '10px 16px',
                marginBottom: '18px',
                background: '#b75f31',
                color: '#fff8ef',
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {eyebrow}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flex: 1,
              }}
            >
              {date && (
                <p
                  style={{
                    color: '#b15b30',
                    fontSize: '24px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {date}
                </p>
              )}

              <h1
                style={{
                  color: '#221711',
                  fontSize: `${getTitleFontSize(title)}px`,
                  fontWeight: 800,
                  margin: 0,
                  lineHeight: 1.05,
                  letterSpacing: '-0.04em',
                }}
              >
                {title}
              </h1>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {displayMetrics.map(metric => (
                  <div
                    key={metric}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '11px 16px',
                      borderRadius: '999px',
                      background: '#fff8ef',
                      border: '1px solid rgba(177, 91, 48, 0.18)',
                      color: '#6b4e3d',
                      fontSize: '18px',
                      fontWeight: 700,
                    }}
                  >
                    {metric}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <p
                  style={{
                    color: '#8d745f',
                    fontSize: '18px',
                    margin: 0,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {footerPath}
                </p>
                <p
                  style={{
                    color: '#8d745f',
                    fontSize: '18px',
                    margin: 0,
                  }}
                >
                  {footerNote}
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              width: '36%',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <img
              src={getOgAssetUrl(imagePath)}
              alt=""
              width="432"
              height="630"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(24, 16, 11, 0.12) 0%, rgba(24, 16, 11, 0.62) 100%)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                display: 'flex',
                borderRadius: '999px',
                padding: '10px 14px',
                background: 'rgba(20, 14, 10, 0.68)',
                border: '1px solid rgba(255, 248, 239, 0.18)',
                color: '#fff3e0',
                fontSize: '15px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {imageTopBadge}
            </div>

            <div
              style={{
                position: 'absolute',
                left: '24px',
                right: '24px',
                bottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '22px',
                borderRadius: '22px',
                background: 'rgba(20, 14, 10, 0.62)',
                border: '1px solid rgba(255, 248, 239, 0.16)',
                color: '#fff6ec',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#f6c78b',
                }}
              >
                {imagePanelEyebrow}
              </span>
              <span
                style={{
                  fontSize: '34px',
                  fontWeight: 800,
                  lineHeight: 1.05,
                }}
              >
                {imagePanelTitle}
              </span>
              <span
                style={{
                  fontSize: '18px',
                  lineHeight: 1.35,
                  color: '#f5dfc7',
                }}
              >
                {imagePanelBody}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...ogImageSize }
  )
}
