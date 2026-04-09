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
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

const LOGO_URL = 'https://bikawo.fr/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

interface RefundProcessedEmailProps {
  clientName?: string;
  serviceName?: string;
  refundAmount?: number;
  originalAmount?: number;
  refundReason?: string;
}

export const RefundProcessedEmail = ({
  clientName = 'Client',
  serviceName = 'Service',
  refundAmount = 0,
  originalAmount = 0,
  refundReason = 'Remboursement',
}: RefundProcessedEmailProps) => {
  // Conversion robuste en nombre
  const refundAmountValue = Number(refundAmount) || 0;
  const originalAmountValue = Number(originalAmount) || 0;
  
  return (
  <Html>
    <Head />
    <Preview>Remboursement effectué</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
        </Section>
        <Heading style={h1}>💰 Remboursement effectué</Heading>
        
        <Text style={text}>
          Bonjour {clientName},
        </Text>
        
        <Text style={text}>
          Nous vous confirmons que votre remboursement a été traité avec succès.
        </Text>

        <Section style={refundBox}>
          <Heading style={refundTitle}>
            {refundAmountValue.toFixed(2)}€
          </Heading>
          <Text style={refundSubtext}>
            Montant remboursé
          </Text>
        </Section>

        <Section style={detailsBox}>
          <Row style={detailRow}>
            <Column style={detailLabel}>Service :</Column>
            <Column style={detailValue}>{serviceName}</Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Montant initial :</Column>
            <Column style={detailValue}>{originalAmountValue.toFixed(2)}€</Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Montant remboursé :</Column>
            <Column style={detailValue}><strong>{refundAmountValue.toFixed(2)}€</strong></Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Raison :</Column>
            <Column style={detailValue}>{refundReason}</Column>
          </Row>
        </Section>

        <Section style={infoBox}>
          <Text style={infoTitle}>ℹ️ Délai de traitement</Text>
          <Text style={infoText}>
            Le remboursement apparaîtra sur votre compte bancaire sous <strong>3 à 5 jours ouvrés</strong>, 
            selon votre établissement bancaire.
          </Text>
        </Section>

        <Text style={text}>
          Si vous avez des questions concernant ce remboursement, n'hésitez pas à nous contacter.
        </Text>

        <Text style={footer}>
          Cordialement,<br />
          L'équipe Bikawo<br />
          support@bikawo.com
        </Text>
      </Container>
    </Body>
  </Html>
  );
};

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

const logoContainer = { textAlign: 'center' as const, padding: '20px 0' };
const logo = { margin: '0 auto' };

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

const refundBox = {
  backgroundColor: '#f0fdf4',
  border: '3px solid #059669',
  borderRadius: '12px',
  margin: '20px',
  padding: '32px',
  textAlign: 'center' as const,
};

const refundTitle = {
  color: '#059669',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const refundSubtext = {
  color: '#6b7280',
  fontSize: '14px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '4px 0',
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
  width: '140px',
};

const detailValue = {
  color: '#111827',
  fontSize: '14px',
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

export default RefundProcessedEmail;
