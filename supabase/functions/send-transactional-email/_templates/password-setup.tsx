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

interface PasswordSetupEmailProps {
  clientName: string;
  setupLink?: string; // link to password creation/reset page
}

export const PasswordSetupEmail = ({ clientName, setupLink = 'https://ed681ca2-74aa-4970-8c41-139ffb8c8152.lovableproject.com/update-password' }: PasswordSetupEmailProps) => (
  <Html>
    <Head />
    <Preview>Créez votre mot de passe</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔐 Créez votre mot de passe</Heading>

        <Text style={text}>Bonjour {clientName},</Text>
        <Text style={text}>
          Pour sécuriser votre compte, veuillez créer votre mot de passe en cliquant sur le bouton ci-dessous.
        </Text>

        <Section style={ctaBox}>
          <Button href={setupLink} style={button}>Créer mon mot de passe</Button>
          <Text style={hint}>Ce lien est valable pendant 24 heures.</Text>
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
const button = { backgroundColor: '#10b981', borderRadius: '6px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 32px', margin: '8px 0' };
const hint = { color: '#6b7280', fontSize: '12px', marginTop: '8px' };
const footer = { color: '#6b7280', fontSize: '12px', lineHeight: '20px', margin: '32px 20px' };

export default PasswordSetupEmail;
