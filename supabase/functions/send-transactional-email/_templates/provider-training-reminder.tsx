import * as React from 'react';
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
} from '@react-email/components';

const LOGO_URL = 'https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

interface ProviderTrainingReminderEmailProps {
  providerName: string;
  trainingProgress: number;
}

export const ProviderTrainingReminderEmail = ({
  providerName = 'Prestataire',
  trainingProgress = 0,
}: ProviderTrainingReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>N'oubliez pas de compléter votre formation</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
          </Section>
          <Heading style={h1}>Formation obligatoire en attente</Heading>
          
          <Text style={text}>Bonjour {providerName},</Text>
          
          <Text style={text}>
            Nous remarquons que vous n'avez pas encore complété la formation obligatoire Bikawo.
          </Text>

          <Section style={progressBox}>
            <Text style={progressText}>
              Progression actuelle : {trainingProgress}%
            </Text>
            <div style={progressBar}>
              <div style={{...progressFill, width: `${trainingProgress}%`}} />
            </div>
          </Section>

          <Text style={text}>
            Cette formation est indispensable pour :
          </Text>

          <ul style={list}>
            <li style={listItem}>✓ Comprendre nos standards de qualité</li>
            <li style={listItem}>✓ Connaître vos droits et obligations</li>
            <li style={listItem}>✓ Activer votre compte prestataire</li>
          </ul>

          <Button
            href={`${process.env.SUPABASE_URL?.replace('.supabase.co', '.lovable.app')}/espace-prestataire`}
            style={button}
          >
            Reprendre la formation
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Bikawo - Formation et Excellence
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ProviderTrainingReminderEmail;

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

const progressBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const progressText = {
  color: '#404040',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
  textAlign: 'center' as const,
};

const progressBar = {
  backgroundColor: '#e9ecef',
  borderRadius: '10px',
  height: '20px',
  overflow: 'hidden',
};

const progressFill = {
  backgroundColor: '#0066FF',
  height: '100%',
  transition: 'width 0.3s ease',
};

const list = {
  margin: '16px 0',
  padding: '0 0 0 20px',
};

const listItem = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '26px',
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