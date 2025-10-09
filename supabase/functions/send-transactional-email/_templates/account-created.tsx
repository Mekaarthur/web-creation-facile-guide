import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface AccountCreatedEmailProps {
  clientName: string;
  appUrl?: string; // base URL of the app
}

export const AccountCreatedEmail = ({ clientName, appUrl = 'https://ed681ca2-74aa-4970-8c41-139ffb8c8152.lovableproject.com' }: AccountCreatedEmailProps) => (
  <Html>
    <Head />
    <Preview>Bienvenue chez Bikawo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Compte créé avec succès</Heading>

        <Text style={text}>Bonjour {clientName},</Text>
        <Text style={text}>
          Votre compte Bikawo a été créé avec succès. Vous pouvez dès maintenant vous connecter et compléter votre profil.
        </Text>

        <Section style={ctaBox}>
          <Button href={`${appUrl}/auth`} style={button}>Se connecter</Button>
        </Section>

        <Section style={infoBox}>
          <Text style={infoTitle}>Besoin d'aide ?</Text>
          <Text style={infoText}>Répondez simplement à cet email, nous sommes là pour vous aider.</Text>
        </Section>

        <Text style={footer}>L'équipe Bikawo</Text>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px' };
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold', margin: '40px 20px 20px' };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px', margin: '16px 20px' };
const ctaBox = { textAlign: 'center' as const, margin: '20px' };
const button = { backgroundColor: '#3b82f6', borderRadius: '6px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 32px', margin: '8px 0' };
const infoBox = { backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', margin: '20px', padding: '16px 20px' };
const infoTitle = { color: '#111827', fontSize: '15px', fontWeight: 'bold', margin: '0 0 8px' };
const infoText = { color: '#4b5563', fontSize: '14px', lineHeight: '22px', margin: '8px 0' };
const footer = { color: '#6b7280', fontSize: '12px', lineHeight: '20px', margin: '32px 20px' };

export default AccountCreatedEmail;
