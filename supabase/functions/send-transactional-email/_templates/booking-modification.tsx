import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface BookingModificationEmailProps {
  clientName: string;
  serviceName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  providerName: string;
  address: string;
  modifiedBy: string;
  reason?: string;
}

const LOGO_URL = 'https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

export const BookingModificationEmail = ({
  clientName = 'Client',
  serviceName = 'Service',
  oldDate = '01/01/2024',
  oldTime = '09:00',
  newDate = '02/01/2024',
  newTime = '10:00',
  providerName = 'Prestataire',
  address = 'Adresse',
  modifiedBy = 'client',
  reason = '',
}: BookingModificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>📅 Votre réservation a été modifiée</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
          </Section>
          
          <Section style={heroSection}>
            <Text style={heroEmoji}>📅</Text>
            <Heading style={heading}>Réservation modifiée</Heading>
          </Section>

          <Text style={paragraph}>
            Bonjour {clientName},
          </Text>

          <Text style={paragraph}>
            Votre réservation pour <strong>{serviceName}</strong> a été modifiée
            {modifiedBy === 'provider' ? ' par votre prestataire' : ''}.
          </Text>

          {reason && (
            <Section style={reasonBox}>
              <Text style={reasonText}>
                <strong>Raison :</strong> {reason}
              </Text>
            </Section>
          )}

          <Section style={comparisonContainer}>
            <Row>
              <Column style={oldColumn}>
                <Text style={columnTitle}>❌ Ancienne date</Text>
                <Text style={dateText}>{oldDate}</Text>
                <Text style={timeText}>{oldTime}</Text>
              </Column>
              <Column style={arrowColumn}>
                <Text style={arrow}>→</Text>
              </Column>
              <Column style={newColumn}>
                <Text style={columnTitle}>✅ Nouvelle date</Text>
                <Text style={dateText}>{newDate}</Text>
                <Text style={timeText}>{newTime}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={detailsBox}>
            <Text style={detailsTitle}>📋 Détails de la réservation</Text>
            <Text style={detailItem}>
              <strong>Service :</strong> {serviceName}
            </Text>
            <Text style={detailItem}>
              <strong>Prestataire :</strong> {providerName}
            </Text>
            <Text style={detailItem}>
              <strong>Adresse :</strong> {address}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://bikawo.com/espace-personnel">
              Voir ma réservation
            </Button>
          </Section>

          <Text style={helpText}>
            Si ce changement ne vous convient pas, contactez-nous rapidement pour 
            trouver une solution.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Bikawo - Votre assistant personnel au quotidien<br />
            <Link href="https://bikawo.com" style={link}>bikawo.com</Link> | 
            <Link href="tel:+33609085390" style={link}> 06 09 08 53 90</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingModificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const logoContainer = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const logo = {
  margin: '0 auto',
};

const heroSection = {
  textAlign: 'center' as const,
  padding: '20px 0',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '0 20px 30px',
};

const heroEmoji = {
  fontSize: '48px',
  margin: '0 0 10px',
};

const heading = {
  color: '#92400e',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 20px',
};

const reasonBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px',
  borderLeft: '4px solid #ef4444',
};

const reasonText = {
  color: '#991b1b',
  fontSize: '14px',
  margin: '0',
};

const comparisonContainer = {
  margin: '30px 20px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
};

const oldColumn = {
  textAlign: 'center' as const,
  padding: '10px',
  backgroundColor: '#fee2e2',
  borderRadius: '8px',
  width: '40%',
};

const arrowColumn = {
  textAlign: 'center' as const,
  width: '20%',
  verticalAlign: 'middle' as const,
};

const newColumn = {
  textAlign: 'center' as const,
  padding: '10px',
  backgroundColor: '#dcfce7',
  borderRadius: '8px',
  width: '40%',
};

const columnTitle = {
  fontSize: '12px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  color: '#6b7280',
};

const dateText = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
  color: '#1f2937',
};

const timeText = {
  fontSize: '16px',
  margin: '4px 0 0',
  color: '#4b5563',
};

const arrow = {
  fontSize: '24px',
  color: '#9ca3af',
};

const detailsBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px',
};

const detailsTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0369a1',
  margin: '0 0 15px',
};

const detailItem = {
  fontSize: '14px',
  color: '#1e3a5f',
  margin: '8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const helpText = {
  color: '#6b7280',
  fontSize: '14px',
  textAlign: 'center' as const,
  padding: '0 20px',
  fontStyle: 'italic',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '30px 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '22px',
  textAlign: 'center' as const,
  padding: '0 20px',
};

const link = {
  color: '#f59e0b',
  textDecoration: 'underline',
};
