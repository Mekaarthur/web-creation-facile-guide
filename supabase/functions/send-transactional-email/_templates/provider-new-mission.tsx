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
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

const LOGO_URL = 'https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

interface ProviderNewMissionEmailProps {
  providerName?: string;
  serviceName?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  clientNotes?: string;
  missionLink?: string;
}

export const ProviderNewMissionEmail = ({
  providerName = 'Prestataire',
  serviceName = 'Service',
  bookingDate = new Date().toLocaleDateString('fr-FR'),
  startTime = '14:00',
  endTime = '18:00',
  address = 'Adresse',
  clientNotes = '',
  missionLink = 'https://ed681ca2-74aa-4970-8c41-139ffb8c8152.lovableproject.com/espace-prestataire'
}: ProviderNewMissionEmailProps) => (
  <Html>
    <Head />
    <Preview>Nouvelle mission disponible</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
        </Section>
        <Heading style={h1}>🎯 Nouvelle mission disponible</Heading>

        <Text style={text}>Bonjour {providerName},</Text>
        <Text style={text}>
          Une nouvelle mission correspond à votre profil et vous a été attribuée.
        </Text>

        <Section style={missionBox}>
          <Text style={missionTitle}>{serviceName}</Text>
          <Row style={detailRow}>
            <Column style={detailLabel}>📅 Date :</Column>
            <Column style={detailValue}>{bookingDate}</Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>⏰ Horaires :</Column>
            <Column style={detailValue}>{startTime} - {endTime}</Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>📍 Lieu :</Column>
            <Column style={detailValue}>{address}</Column>
          </Row>
        </Section>

        {clientNotes && (
          <Section style={notesBox}>
            <Text style={notesTitle}>💬 Notes du client</Text>
            <Text style={notesText}>{clientNotes}</Text>
          </Section>
        )}

        <Section style={ctaBox}>
          <Button href={missionLink} style={button}>
            Voir les détails de la mission
          </Button>
          <Text style={hint}>Veuillez confirmer votre disponibilité dans les 2 heures</Text>
        </Section>

        <Text style={footer}>
          L'équipe Bikawo<br />
          support@bikawo.com
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
const missionBox = { backgroundColor: '#f0f9ff', border: '2px solid #3b82f6', borderRadius: '8px', margin: '20px', padding: '20px' };
const missionTitle = { color: '#1e40af', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px' };
const detailRow = { marginBottom: '8px' };
const detailLabel = { color: '#6b7280', fontSize: '14px', width: '100px' };
const detailValue = { color: '#111827', fontSize: '14px', fontWeight: '500' };
const notesBox = { backgroundColor: '#fef3c7', borderRadius: '8px', margin: '20px', padding: '16px 20px' };
const notesTitle = { color: '#92400e', fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px' };
const notesText = { color: '#78350f', fontSize: '14px', lineHeight: '22px', margin: '0' };
const ctaBox = { textAlign: 'center' as const, margin: '20px' };
const button = { backgroundColor: '#3b82f6', borderRadius: '6px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 32px', margin: '8px 0' };
const hint = { color: '#6b7280', fontSize: '12px', marginTop: '8px' };
const footer = { color: '#6b7280', fontSize: '12px', lineHeight: '20px', margin: '32px 20px' };

export default ProviderNewMissionEmail;
