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

interface CancellationEmailProps {
  clientName: string;
  serviceName: string;
  bookingDate: string;
  cancelledBy: 'client' | 'provider';
  reason: string;
  refundAmount: number;
  refundPercentage: number;
}

export const CancellationEmail = ({
  clientName,
  serviceName,
  bookingDate,
  cancelledBy,
  reason,
  refundAmount,
  refundPercentage,
}: CancellationEmailProps) => (
  <Html>
    <Head />
    <Preview>Votre réservation a été annulée</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>❌ Réservation annulée</Heading>
        
        <Text style={text}>
          Bonjour {clientName},
        </Text>
        
        <Text style={text}>
          {cancelledBy === 'client' 
            ? 'Nous avons bien reçu votre demande d\'annulation.'
            : 'Le prestataire a dû annuler votre réservation. Nous en sommes sincèrement désolés.'}
        </Text>

        <Section style={detailsBox}>
          <Heading style={h2}>Réservation annulée</Heading>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Service :</Column>
            <Column style={detailValue}>{serviceName}</Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Date :</Column>
            <Column style={detailValue}>{bookingDate}</Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Annulé par :</Column>
            <Column style={detailValue}>{cancelledBy === 'client' ? 'Vous' : 'Le prestataire'}</Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Raison :</Column>
            <Column style={detailValue}>{reason}</Column>
          </Row>
        </Section>

        {refundAmount > 0 && (
          <Section style={refundBox}>
            <Heading style={h2}>💰 Remboursement</Heading>
            <Text style={refundText}>
              Montant remboursé : <strong>{refundAmount.toFixed(2)}€</strong> ({refundPercentage}%)
            </Text>
            <Text style={refundInfo}>
              Le remboursement sera effectué sous 3-5 jours ouvrés sur votre moyen de paiement original.
            </Text>
          </Section>
        )}

        {refundAmount === 0 && (
          <Section style={warningBox}>
            <Text style={warningText}>
              ⚠️ Aucun remboursement applicable selon nos conditions d'annulation.
            </Text>
            <Text style={warningInfo}>
              Les annulations moins de 2 heures avant la prestation ne donnent pas droit à un remboursement.
            </Text>
          </Section>
        )}

        {cancelledBy === 'provider' && (
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Nous recherchons un nouveau prestataire pour vous.</strong>
            </Text>
            <Text style={infoText}>
              Vous pouvez également effectuer une nouvelle réservation si vous le souhaitez.
              Vous recevrez un remboursement intégral.
            </Text>
          </Section>
        )}

        <Text style={footer}>
          Pour toute question, n'hésitez pas à nous contacter à support@bikawo.com<br />
          <br />
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

const refundBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #059669',
  borderRadius: '8px',
  margin: '20px',
  padding: '20px',
};

const refundText = {
  color: '#059669',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const refundInfo = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '8px 0',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  margin: '20px',
  padding: '20px',
};

const warningText = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const warningInfo = {
  color: '#78350f',
  fontSize: '14px',
  margin: '8px 0',
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

export default CancellationEmail;
