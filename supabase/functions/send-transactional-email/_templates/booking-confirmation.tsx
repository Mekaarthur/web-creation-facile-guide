import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface BookingConfirmationEmailProps {
  clientName: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  address: string;
  totalPrice: number;
  bookingId: string;
}

export const BookingConfirmationEmail = ({
  clientName,
  serviceName,
  bookingDate,
  startTime,
  endTime,
  address,
  totalPrice,
  bookingId,
}: BookingConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Votre réservation {serviceName} est confirmée</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>✅ Réservation confirmée</Heading>
        
        <Text style={text}>
          Bonjour {clientName},
        </Text>
        
        <Text style={text}>
          Votre réservation a bien été enregistrée. Nous sommes en train de vous assigner le meilleur prestataire disponible.
        </Text>

        <Section style={detailsBox}>
          <Heading style={h2}>Détails de votre réservation</Heading>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Service :</Column>
            <Column style={detailValue}>{serviceName}</Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Date :</Column>
            <Column style={detailValue}>{bookingDate}</Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Horaires :</Column>
            <Column style={detailValue}>{startTime} - {endTime}</Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Adresse :</Column>
            <Column style={detailValue}>{address}</Column>
          </Row>
          
          <Hr style={hr} />
          
          <Row style={detailRow}>
            <Column style={detailLabel}><strong>Prix total :</strong></Column>
            <Column style={priceValue}><strong>{totalPrice.toFixed(2)}€</strong></Column>
          </Row>
        </Section>

        <Section style={infoBox}>
          <Text style={infoText}>
            📱 <strong>Prochaines étapes :</strong>
          </Text>
          <Text style={infoText}>
            1. Vous recevrez un email dès qu'un prestataire sera assigné<br />
            2. Le prestataire confirmera sa disponibilité<br />
            3. Vous recevrez un rappel 24h avant la prestation
          </Text>
        </Section>

        <Text style={text}>
          Vous pouvez suivre l'état de votre réservation dans votre espace client.
        </Text>

        <Text style={footer}>
          Numéro de réservation : {bookingId}<br />
          <br />
          Pour toute question, contactez-nous à support@bikawo.com<br />
          <br />
          L'équipe Bikawo
        </Text>
      </Container>
    </Body>
  </Html>
);

// Styles
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
  padding: '0',
};

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 15px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
};

const detailsBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
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
  width: '120px',
};

const detailValue = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '500',
};

const priceValue = {
  color: '#059669',
  fontSize: '16px',
  fontWeight: 'bold',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const infoBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  margin: '20px',
  padding: '16px',
};

const infoText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '32px 20px',
};

export default BookingConfirmationEmail;
