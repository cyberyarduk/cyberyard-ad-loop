/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandHeader, BrandFooter, sharedStyles as s } from './_brand.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={s.main}>
      <Container style={s.container}>
        <BrandHeader />
        <Heading style={s.h1}>Reset your password</Heading>
        <Text style={s.text}>
          We received a request to reset your password for {siteName}. Click the
          button below to choose a new password.
        </Text>
        <Button style={s.button} href={confirmationUrl}>Reset Password</Button>
        <Text style={s.footer}>
          If you didn't request a password reset, you can safely ignore this email.
          Your password will not be changed.
        </Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
