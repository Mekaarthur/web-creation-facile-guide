import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface AccountDeletedEmailProps {
  clientName: string;
  deletionDate?: string;
}

const LOGO_URL = 'https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

export const AccountDeletedEmail = ({ clientName, deletionDate = new Date().toLocaleDateString('fr-FR') }: AccountDeletedEmailProps) => (
  <Html>
    <Head />
    <Preview>Votre compte a été supprimé</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
        </Section>

        <Heading style={h1}>🗑️ Compte supprimé</Heading>

        <Text style={text}>Bonjour {clientName},</Text>
        <Text style={text}>
          Nous vous confirmons que votre compte Bikawo a été supprimé le {deletionDate}.
        </Text>
        <Text style={text}>
          Si cette action n'est pas de votre initiative, contactez immédiatement notre support.
        </Text>

        <Section style={infoBox}>
          <Text style={infoTitle}>Que devient vos données ?</Text>
          <Text style={infoText}>Conformément à notre politique, vos données seront supprimées ou anonymisées.</Text>
        </Section>

        <Text style={footer}>
          Bikawo - Votre assistant personnel au quotidien<br />
          📧 contact@bikawo.com | 📞 06 09 08 53 90
        </Text>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px', borderRadius: '8px' };
const logoContainer = { textAlign: 'center' as const, padding: '20px 0' };
const logo = { margin: '0 auto' };
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold', margin: '20px 20px 20px', textAlign: 'center' as const };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px', margin: '16px 20px' };
const infoBox = { backgroundColor: '#fff7ed', borderLeft: '4px solid #f59e0b', margin: '20px', padding: '16px 20px' };
const infoTitle = { color: '#111827', fontSize: '15px', fontWeight: 'bold', margin: '0 0 8px' };
const infoText = { color: '#4b5563', fontSize: '14px', lineHeight: '22px', margin: '8px 0' };
const footer = { color: '#6b7280', fontSize: '12px', lineHeight: '20px', margin: '32px 20px', textAlign: 'center' as const };

export default AccountDeletedEmail;
