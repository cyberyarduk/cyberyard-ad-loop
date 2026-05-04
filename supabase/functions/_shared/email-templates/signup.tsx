/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandHeader, BrandFooter, sharedStyles as s } from './_brand.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={s.main}>
      <Container style={s.container}>
        <BrandHeader />
        <Heading style={s.h1}>Confirm your email</Heading>
        <Text style={s.text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={s.link}><strong>{siteName}</strong></Link>!
        </Text>
        <Text style={s.text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={s.link}>{recipient}</Link>
          ) by clicking the button below:
        </Text>
        <Button style={s.button} href={confirmationUrl}>Verify Email</Button>
        <Text style={s.footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
