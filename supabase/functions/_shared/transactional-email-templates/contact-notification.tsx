/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string
  company?: string
  phone?: string
  message?: string
  source?: string
}

const styles = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  },
  container: { padding: '32px 28px', maxWidth: '560px' },
  h1: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1a2233',
    margin: '0 0 16px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#999999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    margin: '16px 0 4px',
  },
  value: {
    fontSize: '15px',
    color: '#1a2233',
    margin: '0',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap' as const,
  },
  hr: { borderColor: '#eeeeee', margin: '24px 0' },
  footer: { fontSize: '12px', color: '#999999', margin: '24px 0 0' },
}

const ContactNotification = ({
  name = 'Someone',
  email = 'unknown@example.com',
  company = '',
  phone = '',
  message = '',
  source = 'Website',
}: Props) => (
  <Html>
    <Head />
    <Preview>New enquiry from {name} via Cyberyard {source}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Heading style={styles.h1}>New website enquiry</Heading>
        <Text style={styles.value}>
          You have a new enquiry from the Cyberyard website.
        </Text>

        <Hr style={styles.hr} />

        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{name}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email}</Text>

        {company ? (
          <>
            <Text style={styles.label}>Company</Text>
            <Text style={styles.value}>{company}</Text>
          </>
        ) : null}

        {phone ? (
          <>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{phone}</Text>
          </>
        ) : null}

        <Text style={styles.label}>Message</Text>
        <Text style={styles.value}>{message}</Text>

        <Text style={styles.label}>Source</Text>
        <Text style={styles.value}>{source}</Text>

        <Hr style={styles.hr} />
        <Text style={styles.footer}>
          Sent from www.cyberyard.co.uk
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotification,
  subject: (d: Props) =>
    `New ${d?.source || 'website'} enquiry from ${d?.name || 'visitor'}`,
  displayName: 'Contact Notification (Internal)',
  to: 'jason@cyberyard.co.uk',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Acme Retail Ltd',
    phone: '07000 000000',
    message: 'Hi — interested in a demo for our 4 stores.',
    source: 'Book a demo',
  },
} satisfies TemplateEntry
