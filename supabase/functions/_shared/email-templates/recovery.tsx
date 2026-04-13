/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://bikawo.fr/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Réinitialisez votre mot de passe Bikawo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="160" height="auto" alt="Bikawo" style={logo} />
        </Section>
        <Heading style={h1}>🔐 Réinitialisez votre mot de passe</Heading>
        <Text style={text}>
          Nous avons reçu une demande de réinitialisation de votre mot de passe Bikawo. Cliquez ci-dessous pour en choisir un nouveau.
        </Text>
        <Section style={ctaSection}>
          <Button style={button} href={confirmationUrl}>Créer un nouveau mot de passe</Button>
        </Section>
        <Text style={hint}>⏱️ Ce lien expire dans 24 heures.</Text>
        <Text style={footer}>Si vous n'avez pas fait cette demande, ignorez cet email.</Text>
        <Text style={footerBrand}>L'équipe Bikawo</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, padding: '20px 0' }
const logo = { margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a4a5a', lineHeight: '1.6', margin: '0 0 20px' }
const ctaSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#d4652a', color: '#ffffff', fontSize: '15px', borderRadius: '8px', padding: '12px 28px', textDecoration: 'none', fontWeight: 'bold' as const }
const hint = { fontSize: '13px', color: '#6b7280', margin: '0 0 20px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const footerBrand = { fontSize: '12px', color: '#6b7280', margin: '16px 0 0' }
