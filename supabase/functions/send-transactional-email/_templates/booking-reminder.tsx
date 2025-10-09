import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface BookingReminderEmailProps {
  clientName: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  address: string;
  providerName: string;
}

export const BookingReminderEmail = ({
  clientName,
  serviceName,
  bookingDate,
  startTime,
  address,
  providerName,
}: BookingReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Rappel : Votre prestation est demain</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⏰ Rappel de prestation</Heading>
        
        <Text style={text}>
          Bonjour {clientName},
        </Text>
        
        <Text style={highlightText}>
          Votre prestation est prévue demain !
        </Text>

        <Section style={detailsBox}>
          <Row style={detailRow}>
            <Column style={detailLabel}>Service :</Column>
            <Column style={detailValue}><strong>{serviceName}</strong></Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Date :</Column>
            <Column style={detailValue}><strong>{bookingDate}</strong></Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Heure :</Column>
            <Column style={detailValue}><strong>{startTime}</strong></Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Adresse :</Column>
            <Column style={detailValue}>{address}</Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Prestataire :</Column>
            <Column style={detailValue}>{providerName}</Column>
          </Row>
        </Section>

        <Section style={infoBox}>
          <Text style={infoTitle}>📋 Préparez la prestation :</Text>
          <Text style={infoText}>
            • Assurez-vous d'être présent à l'adresse indiquée<br />
            • Préparez l'espace si nécessaire<br />
            • Vous recevrez une notification quand le prestataire arrivera
          </Text>
        </Section>

        <Section style={warningBox}>
          <Text style={warningText}>
            ⚠️ <strong>Besoin d'annuler ?</strong>
          </Text>
          <Text style={warningInfo}>
            Les annulations moins de 24h avant donnent droit à un remboursement de 50%. 
            Moins de 2h avant : aucun remboursement.
          </Text>
        </Section>

        <Text style={footer}>
          À demain !<br />
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

const highlightText = {
  color: '#059669',
  fontSize: '18px',
  fontWeight: 'bold',
  lineHeight: '28px',
  margin: '8px 20px',
  textAlign: 'center' as const,
};

const detailsBox = {
  backgroundColor: '#eff6ff',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  margin: '20px',
  padding: '20px',
};

const detailRow = {
  marginBottom: '12px',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  width: '100px',
};

const detailValue = {
  color: '#111827',
  fontSize: '14px',
};

const infoBox = {
  backgroundColor: '#f9fafb',
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

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  margin: '20px',
  padding: '16px',
};

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const warningInfo = {
  color: '#78350f',
  fontSize: '13px',
  margin: '4px 0',
};

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '32px 20px',
};

export default BookingReminderEmail;
