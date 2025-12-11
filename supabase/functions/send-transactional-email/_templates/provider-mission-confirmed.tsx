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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

const LOGO_URL = 'https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

interface ProviderMissionConfirmedEmailProps {
  providerName?: string;
  serviceName?: string;
  bookingDate?: string;
  startTime?: string;
  clientName?: string;
  address?: string;
  missionLink?: string;
}

export const ProviderMissionConfirmedEmail = ({
  providerName = 'Prestataire',
  serviceName = 'Service',
  bookingDate = new Date().toLocaleDateString('fr-FR'),
  startTime = '14:00',
  clientName = 'Client',
  address = 'Adresse',
  missionLink = 'https://ed681ca2-74aa-4970-8c41-139ffb8c8152.lovableproject.com/espace-prestataire'
}: ProviderMissionConfirmedEmailProps) => (
  <Html>
    <Head />
    <Preview>Mission confirmée par le client</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
        </Section>
        <Heading style={h1}>✅ Mission confirmée</Heading>

        <Text style={text}>Bonjour {providerName},</Text>
        <Text style={text}>
          Excellente nouvelle ! Le client {clientName} a confirmé votre mission.
        </Text>

        <Section style={confirmedBox}>
          <Text style={confirmedIcon}>✓</Text>
          <Text style={confirmedTitle}>Mission validée</Text>
          <Text style={confirmedText}>{serviceName}</Text>
          <Text style={confirmedDate}>{bookingDate} à {startTime}</Text>
        </Section>

        <Section style={infoBox}>
          <Text style={infoTitle}>📍 Adresse de la mission</Text>
          <Text style={infoText}>{address}</Text>
        </Section>

        <Section style={reminderBox}>
          <Text style={reminderTitle}>⚠️ Rappels importants</Text>
          <Text style={reminderText}>• Arrivez à l'heure prévue</Text>
          <Text style={reminderText}>• Confirmez votre arrivée via l'app</Text>
          <Text style={reminderText}>• Contactez le client si besoin</Text>
        </Section>

        <Section style={ctaBox}>
          <Button href={missionLink} style={button}>
            Voir ma mission
          </Button>
        </Section>

        <Text style={footer}>
          Bonne mission !<br />
          L'équipe Bikawo
        </Text>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px' };
const logoContainer = { textAlign: 'center' as const, padding: '20px 0' };
const logo = { margin: '0 auto' };
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold', margin: '40px 20px 20px' };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px', margin: '16px 20px' };
const confirmedBox = { backgroundColor: '#f0fdf4', border: '3px solid #059669', borderRadius: '12px', margin: '20px', padding: '32px', textAlign: 'center' as const };
const confirmedIcon = { fontSize: '48px', color: '#059669', margin: '0 0 8px' };
const confirmedTitle = { color: '#059669', fontSize: '20px', fontWeight: 'bold', margin: '8px 0' };
const confirmedText = { color: '#111827', fontSize: '16px', margin: '8px 0' };
const confirmedDate = { color: '#6b7280', fontSize: '14px', margin: '4px 0' };
const infoBox = { backgroundColor: '#eff6ff', borderRadius: '8px', margin: '20px', padding: '16px 20px' };
const infoTitle = { color: '#1e40af', fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px' };
const infoText = { color: '#1e3a8a', fontSize: '14px', margin: '0' };
const reminderBox = { backgroundColor: '#fef3c7', borderRadius: '8px', margin: '20px', padding: '16px 20px' };
const reminderTitle = { color: '#92400e', fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px' };
const reminderText = { color: '#78350f', fontSize: '14px', lineHeight: '22px', margin: '4px 0' };
const ctaBox = { textAlign: 'center' as const, margin: '20px' };
const button = { backgroundColor: '#059669', borderRadius: '6px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 32px', margin: '8px 0' };
const footer = { color: '#6b7280', fontSize: '12px', lineHeight: '20px', margin: '32px 20px' };

export default ProviderMissionConfirmedEmail;
