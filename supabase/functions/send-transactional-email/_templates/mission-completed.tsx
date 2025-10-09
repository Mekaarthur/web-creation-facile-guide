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

interface MissionCompletedEmailProps {
  clientName: string;
  serviceName: string;
  providerName: string;
  completedAt: string;
  bookingId: string;
}

export const MissionCompletedEmail = ({
  clientName,
  serviceName,
  providerName,
  completedAt,
  bookingId,
}: MissionCompletedEmailProps) => (
  <Html>
    <Head />
    <Preview>Prestation terminée - Partagez votre avis</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>✅ Prestation terminée</Heading>
        
        <Text style={text}>
          Bonjour {clientName},
        </Text>
        
        <Section style={completedBox}>
          <Text style={completedText}>
            🎉 Votre prestation est terminée !
          </Text>
          <Text style={timeText}>
            Terminé le : {completedAt}
          </Text>
        </Section>

        <Text style={text}>
          {providerName} a terminé votre service "<strong>{serviceName}</strong>".
        </Text>

        <Section style={reviewBox}>
          <Heading style={reviewTitle}>⭐ Donnez votre avis</Heading>
          <Text style={reviewText}>
            Votre retour est précieux ! Il aide les autres utilisateurs et permet aux prestataires de s'améliorer.
          </Text>
          <Button
            href={`https://ed681ca2-74aa-4970-8c41-139ffb8c8152.lovableproject.com/espace-personnel`}
            style={button}
          >
            Laisser un avis
          </Button>
        </Section>

        <Section style={infoBox}>
          <Text style={infoTitle}>📄 Facture disponible</Text>
          <Text style={infoText}>
            Votre facture est maintenant disponible dans votre espace client.
          </Text>
        </Section>

        <Text style={text}>
          Merci d'avoir choisi Bikawo ! Nous espérons vous revoir bientôt.
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

const completedBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #059669',
  borderRadius: '8px',
  margin: '20px',
  padding: '20px',
  textAlign: 'center' as const,
};

const completedText = {
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

const reviewBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  margin: '20px',
  padding: '24px',
  textAlign: 'center' as const,
};

const reviewTitle = {
  color: '#92400e',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const reviewText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '12px 0 20px',
};

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  margin: '8px 0',
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

export default MissionCompletedEmail;
