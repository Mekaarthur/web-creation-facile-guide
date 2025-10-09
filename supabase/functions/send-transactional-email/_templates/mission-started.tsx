import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface MissionStartedEmailProps {
  clientName: string;
  serviceName: string;
  providerName: string;
  startedAt: string;
}

export const MissionStartedEmail = ({
  clientName,
  serviceName,
  providerName,
  startedAt,
}: MissionStartedEmailProps) => (
  <Html>
    <Head />
    <Preview>Votre prestation a commencé</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🚀 Prestation en cours</Heading>
        
        <Text style={text}>
          Bonjour {clientName},
        </Text>
        
        <Section style={startedBox}>
          <Text style={startedText}>
            ✅ {providerName} a commencé votre prestation
          </Text>
          <Text style={timeText}>
            Démarrage : {startedAt}
          </Text>
        </Section>

        <Text style={text}>
          Le prestataire est en train d'exécuter votre service "<strong>{serviceName}</strong>".
        </Text>

        <Section style={infoBox}>
          <Text style={infoTitle}>💬 Besoin de communiquer ?</Text>
          <Text style={infoText}>
            Vous pouvez contacter le prestataire via la messagerie de votre espace client si nécessaire.
          </Text>
        </Section>

        <Text style={text}>
          Vous recevrez une notification lorsque la prestation sera terminée.
        </Text>

        <Text style={footer}>
          L'équipe Bikawo
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 20px 20px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
};

const startedBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #059669',
  borderRadius: '8px',
  margin: '20px',
  padding: '20px',
  textAlign: 'center' as const,
};

const startedText = {
  color: '#059669',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const timeText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '4px 0',
};

const infoBox = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #3b82f6',
  margin: '20px',
  padding: '16px 20px',
};

const infoTitle = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const infoText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '32px 20px',
};

export default MissionStartedEmail;
