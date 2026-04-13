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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre lien de connexion Bikawo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="160" height="auto" alt="Bikawo" style={logo} />
        </Section>
        <Heading style={h1}>Votre lien de connexion</Heading>
        <Text style={text}>Cliquez ci-dessous pour vous connecter à Bikawo. Ce lien expirera sous peu.</Text>
        <Section style={ctaSection}>
          <Button style={button} href={confirmationUrl}>Se connecter</Button>
        </Section>
        <Text style={footer}>Si vous n'avez pas demandé ce lien, ignorez cet email.</Text>
        <Text style={footerBrand}>L'équipe Bikawo</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, padding: '20px 0' }
const logo = { margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a4a5a', lineHeight: '1.6', margin: '0 0 20px' }
const ctaSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#d4652a', color: '#ffffff', fontSize: '15px', borderRadius: '8px', padding: '12px 28px', textDecoration: 'none', fontWeight: 'bold' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const footerBrand = { fontSize: '12px', color: '#6b7280', margin: '16px 0 0' }
