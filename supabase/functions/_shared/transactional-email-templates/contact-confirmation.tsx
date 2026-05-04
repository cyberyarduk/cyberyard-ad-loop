/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  message?: string
}

const LOGO_URL =
  'https://coislwmlvrcgxdwcvoqu.supabase.co/storage/v1/object/public/email-assets/cyberyard-logo.png'

const styles = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  },
  container: { padding: '32px 28px', maxWidth: '560px' },
  header: { padding: '8px 0 24px', textAlign: 'center' as const },
  logo: { display: 'block', margin: '0 auto', maxWidth: '160px', height: 'auto' },
  h1: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1a2233',
    margin: '0 0 16px',
  },
  text: {
    fontSize: '15px',
    color: '#55575d',
    lineHeight: '1.6',
    margin: '0 0 16px',
  },
  quote: {
    borderLeft: '3px solid #FBC91B',
    padding: '8px 14px',
    margin: '16px 0',
    color: '#55575d',
    fontSize: '14px',
    whiteSpace: 'pre-wrap' as const,
  },
  hr: { borderColor: '#eeeeee', margin: '32px 0 16px' },
  footer: { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5' },
  link: { color: '#1a2233', textDecoration: 'underline' },
}

const ContactConfirmation = ({
  name = 'there',
  message = '',
}: Props) => (
  <Html>
    <Head />
    <Preview>Thanks for getting in touch with Cyberyard</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Img src={LOGO_URL} alt="Cyberyard" width="160" style={styles.logo} />
        </Section>

        <Heading style={styles.h1}>Thanks, {name} 👋</Heading>
        <Text style={styles.text}>
          We've received your enquiry and a member of the Cyberyard team will be
          in touch shortly — usually within one working day.
        </Text>

        {message ? (
          <>
            <Text style={styles.text}>For your records, here's what you sent:</Text>
            <Text style={styles.quote}>{message}</Text>
          </>
        ) : null}

        <Text style={styles.text}>
          In the meantime, feel free to explore{' '}
          <Link href="https://www.cyberyard.co.uk" style={styles.link}>
            www.cyberyard.co.uk
          </Link>
          .
        </Text>

        <Hr style={styles.hr} />
        <Text style={styles.footer}>
          Cyberyard · www.cyberyard.co.uk
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmation,
  subject: 'Thanks for getting in touch with Cyberyard',
  displayName: 'Contact Confirmation (To Sender)',
  previewData: {
    name: 'Jane',
    message: 'Hi — interested in a demo for our 4 stores.',
  },
} satisfies TemplateEntry
