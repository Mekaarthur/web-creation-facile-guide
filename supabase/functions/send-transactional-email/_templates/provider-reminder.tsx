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

interface ProviderReminderEmailProps {
  providerName?: string;
  serviceName?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  clientPhone?: string;
  missionLink?: string;
}

export const ProviderReminderEmail = ({
  providerName = 'Prestataire',
  serviceName = 'Service',
  bookingDate = new Date().toLocaleDateString('fr-FR'),
  startTime = '14:00',
  endTime = '18:00',
  address = 'Adresse',
  clientPhone = '',
  missionLink = 'https://ed681ca2-74aa-4970-8c41-139ffb8c8152.lovableproject.com/espace-prestataire'
}: ProviderReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Rappel : Mission demain</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⏰ Rappel : Mission demain</Heading>

        <Text style={text}>Bonjour {providerName},</Text>
        <Text style={text}>
          Nous vous rappelons que vous avez une mission prévue <strong>demain</strong>.
        </Text>

        <Section style={missionBox}>
          <Text style={missionTitle}>📋 {serviceName}</Text>
          <Text style={missionDetail}>📅 {bookingDate}</Text>
          <Text style={missionDetail}>⏰ {startTime} - {endTime}</Text>
          <Text style={missionDetail}>📍 {address}</Text>
          {clientPhone && (
            <Text style={missionDetail}>📞 {clientPhone}</Text>
          )}
        </Section>

        <Section style={checklistBox}>
          <Text style={checklistTitle}>✓ Checklist avant la mission</Text>
          <Text style={checklistItem}>□ Confirmer votre trajet et prévoir le temps de transport</Text>
          <Text style={checklistItem}>□ Préparer le matériel nécessaire</Text>
          <Text style={checklistItem}>□ Vérifier les notes du client</Text>
          <Text style={checklistItem}>□ Avoir votre téléphone chargé pour le check-in</Text>
        </Section>

        <Section style={ctaBox}>
          <Button href={missionLink} style={button}>
            Voir les détails
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
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold', margin: '40px 20px 20px' };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px', margin: '16px 20px' };
const missionBox = { backgroundColor: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '8px', margin: '20px', padding: '20px', textAlign: 'center' as const };
const missionTitle = { color: '#92400e', fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px' };
const missionDetail = { color: '#78350f', fontSize: '14px', lineHeight: '22px', margin: '6px 0' };
const checklistBox = { backgroundColor: '#eff6ff', borderRadius: '8px', margin: '20px', padding: '16px 20px' };
const checklistTitle = { color: '#1e40af', fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px' };
const checklistItem = { color: '#1e3a8a', fontSize: '14px', lineHeight: '24px', margin: '6px 0' };
const ctaBox = { textAlign: 'center' as const, margin: '20px' };
const button = { backgroundColor: '#f59e0b', borderRadius: '6px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 32px', margin: '8px 0' };
const footer = { color: '#6b7280', fontSize: '12px', lineHeight: '20px', margin: '32px 20px' };

export default ProviderReminderEmail;
