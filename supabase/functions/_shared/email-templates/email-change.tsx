/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandHeader, BrandFooter, sharedStyles as s } from './_brand.tsx'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName, oldEmail, newEmail, confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={s.main}>
      <Container style={s.container}>
        <BrandHeader />
        <Heading style={s.h1}>Confirm your email change</Heading>
        <Text style={s.text}>
          You requested to change your email address for {siteName} from{' '}
          <Link href={`mailto:${oldEmail}`} style={s.link}>{oldEmail}</Link> to{' '}
          <Link href={`mailto:${newEmail}`} style={s.link}>{newEmail}</Link>.
        </Text>
        <Text style={s.text}>Click the button below to confirm this change:</Text>
        <Button style={s.button} href={confirmationUrl}>Confirm Email Change</Button>
        <Text style={s.footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
