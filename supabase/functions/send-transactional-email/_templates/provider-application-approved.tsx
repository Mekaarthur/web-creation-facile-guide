import * as React from 'npm:react@18.3.1';
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
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22';

const LOGO_URL = 'https://bikawo.com/bikawo-logo.png';

interface ProviderApplicationApprovedEmailProps {
  providerName: string;
  setupLink: string;
  siteUrl?: string;
}

export const ProviderApplicationApprovedEmail = ({
  providerName = 'Prestataire',
  setupLink = 'https://bikawo.com/auth/provider',
  siteUrl = 'https://bikawo.com',
}: ProviderApplicationApprovedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Votre candidature Bikawo a été approuvée — activez votre compte</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
          </Section>
          <Heading style={h1}>Votre candidature est approuvée !</Heading>

          <Text style={text}>Bonjour {providerName},</Text>

          <Text style={text}>
            Bonne nouvelle ! Notre équipe a examiné votre candidature et nous avons le plaisir de vous informer qu'elle a été <strong>approuvée</strong>.
          </Text>

          <Section style={approvalBox}>
            <Text style={approvalText}>Candidature approuvée</Text>
            <Text style={approvalSub}>
              Finalisez votre inscription pour commencer à recevoir des missions
            </Text>
          </Section>

          <Text style={text}>
            <strong>Prochaines étapes :</strong>
          </Text>

          <ul style={list}>
            <li style={listItem}>Créez votre mot de passe via le lien ci-dessous</li>
            <li style={listItem}>Acceptez le mandat de facturation</li>
            <li style={listItem}>Attendez la validation de votre dossier (24-48h)</li>
            <li style={listItem}>Commencez à recevoir des missions</li>
          </ul>

          <Button href={setupLink} style={button}>
            Activer mon compte prestataire
          </Button>

          <Text style={noteText}>
            Ce lien est valable 24 heures. Passé ce délai, contactez-nous à support@bikawo.com.
          </Text>

          <Hr style={hr} />

          <Section style={supportBox}>
            <Text style={supportText}>
              Une question ? Notre équipe est disponible pour vous accompagner.
            </Text>
            <Text style={supportContact}>
              support@bikawo.com | 06 09 08 53 90
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Bikawo — Ensemble, construisons votre réussite
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ProviderApplicationApprovedEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const logoContainer = { textAlign: 'center' as const, padding: '20px 0' };
const logo = { margin: '0 auto' };

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 30px',
  textAlign: 'center' as const,
};

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const approvalBox = {
  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  borderRadius: '12px',
  padding: '30px',
  margin: '30px 0',
  textAlign: 'center' as const,
};

const approvalText = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const approvalSub = {
  color: '#ffffff',
  fontSize: '15px',
  margin: '0',
  opacity: 0.9,
};

const list = {
  margin: '16px 0',
  padding: '0 0 0 20px',
};

const listItem = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '32px',
  marginBottom: '8px',
};

const button = {
  backgroundColor: '#0066FF',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 28px',
  margin: '24px auto',
};

const noteText = {
  color: '#8898aa',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '8px 0 24px',
};

const supportBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
};

const supportText = {
  color: '#404040',
  fontSize: '14px',
  margin: '0 0 8px',
};

const supportContact = {
  color: '#0066FF',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
};

const hr = {
  borderColor: '#e6e6e6',
  margin: '32px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
};
