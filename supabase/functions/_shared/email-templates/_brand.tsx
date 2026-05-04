/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Img, Section, Text, Link } from 'npm:@react-email/components@0.0.22'

export const LOGO_URL =
  'https://coislwmlvrcgxdwcvoqu.supabase.co/storage/v1/object/public/email-assets/cyberyard-logo.png'
export const SITE_URL = 'https://www.cyberyard.co.uk'
export const SITE_LABEL = 'www.cyberyard.co.uk'

export const BrandHeader = () => (
  <Section style={headerSection}>
    <Link href={SITE_URL}>
      <Img
        src={LOGO_URL}
        alt="Cyberyard"
        width="160"
        height="auto"
        style={logoStyle}
      />
    </Link>
  </Section>
)

export const BrandFooter = () => (
  <Section style={footerSection}>
    <Text style={footerText}>
      Cyberyard &middot;{' '}
      <Link href={SITE_URL} style={footerLink}>
        {SITE_LABEL}
      </Link>
    </Text>
    <Text style={footerSmall}>
      You received this email because an action was requested on your Cyberyard account.
    </Text>
  </Section>
)

const headerSection = {
  padding: '8px 0 24px',
  textAlign: 'center' as const,
}
const logoStyle = {
  display: 'block',
  margin: '0 auto',
  maxWidth: '160px',
  height: 'auto',
}
const footerSection = {
  borderTop: '1px solid #eeeeee',
  marginTop: '40px',
  paddingTop: '20px',
  textAlign: 'center' as const,
}
const footerText = {
  fontSize: '12px',
  color: '#999999',
  margin: '0 0 6px',
}
const footerSmall = {
  fontSize: '11px',
  color: '#bbbbbb',
  margin: '0',
  lineHeight: '1.5',
}
const footerLink = { color: '#999999', textDecoration: 'underline' }

export const sharedStyles = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  },
  container: { padding: '32px 28px', maxWidth: '560px' },
  h1: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#1a2233',
    margin: '0 0 20px',
    letterSpacing: '-0.01em',
  },
  text: {
    fontSize: '15px',
    color: '#55575d',
    lineHeight: '1.6',
    margin: '0 0 25px',
  },
  link: { color: '#1a2233', textDecoration: 'underline' },
  button: {
    backgroundColor: '#FBC91B',
    color: '#1a2233',
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: '12px',
    padding: '14px 24px',
    textDecoration: 'none',
  },
  footer: {
    fontSize: '12px',
    color: '#999999',
    margin: '32px 0 0',
    lineHeight: '1.5',
  },
}
