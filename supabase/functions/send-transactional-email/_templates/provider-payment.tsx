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
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ProviderPaymentEmailProps {
  providerName?: string;
  serviceName?: string;
  missionDate?: string;
  hoursWorked?: number;
  grossAmount?: number;
  netAmount?: number;
  paymentDate?: string;
  invoiceLink?: string;
}

export const ProviderPaymentEmail = ({
  providerName = 'Prestataire',
  serviceName = 'Service',
  missionDate = new Date().toLocaleDateString('fr-FR'),
  hoursWorked = 0,
  grossAmount = 0,
  netAmount = 0,
  paymentDate = new Date().toLocaleDateString('fr-FR'),
  invoiceLink = 'https://ed681ca2-74aa-4970-8c41-139ffb8c8152.lovableproject.com/espace-prestataire'
}: ProviderPaymentEmailProps) => (
  <Html>
    <Head />
    <Preview>Paiement effectué</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>💵 Paiement effectué</Heading>

        <Text style={text}>Bonjour {providerName},</Text>
        <Text style={text}>
          Votre rémunération pour la mission <strong>{serviceName}</strong> du {missionDate} a été traitée.
        </Text>

        <Section style={paymentBox}>
          <Text style={amountTitle}>{netAmount.toFixed(2)}€</Text>
          <Text style={amountSubtext}>Montant net versé</Text>
        </Section>

        <Section style={detailsBox}>
          <Row style={detailRow}>
            <Column style={detailLabel}>Mission :</Column>
            <Column style={detailValue}>{serviceName}</Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>Date :</Column>
            <Column style={detailValue}>{missionDate}</Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>Heures :</Column>
            <Column style={detailValue}>{hoursWorked}h</Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>Montant brut :</Column>
            <Column style={detailValue}>{grossAmount.toFixed(2)}€</Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>Montant net :</Column>
            <Column style={detailValue}><strong>{netAmount.toFixed(2)}€</strong></Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>Date de paiement :</Column>
            <Column style={detailValue}>{paymentDate}</Column>
          </Row>
        </Section>

        <Section style={infoBox}>
          <Text style={infoTitle}>💡 Délai de réception</Text>
          <Text style={infoText}>
            Le virement apparaîtra sur votre compte bancaire sous <strong>1 à 3 jours ouvrés</strong>.
          </Text>
        </Section>

        <Section style={ctaBox}>
          <Button href={invoiceLink} style={button}>
            Télécharger la fiche de rémunération
          </Button>
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
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold', margin: '40px 20px 20px' };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px', margin: '16px 20px' };
const paymentBox = { backgroundColor: '#f0fdf4', border: '3px solid #059669', borderRadius: '12px', margin: '20px', padding: '32px', textAlign: 'center' as const };
const amountTitle = { color: '#059669', fontSize: '40px', fontWeight: 'bold', margin: '0 0 8px' };
const amountSubtext = { color: '#6b7280', fontSize: '14px', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '4px 0' };
const detailsBox = { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', margin: '20px', padding: '20px' };
const detailRow = { marginBottom: '12px' };
const detailLabel = { color: '#6b7280', fontSize: '14px', width: '150px' };
const detailValue = { color: '#111827', fontSize: '14px' };
const infoBox = { backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', margin: '20px', padding: '16px 20px' };
const infoTitle = { color: '#1e40af', fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px' };
const infoText = { color: '#1e3a8a', fontSize: '14px', lineHeight: '22px', margin: '0' };
const ctaBox = { textAlign: 'center' as const, margin: '20px' };
const button = { backgroundColor: '#059669', borderRadius: '6px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 32px', margin: '8px 0' };
const footer = { color: '#6b7280', fontSize: '12px', lineHeight: '20px', margin: '32px 20px' };

export default ProviderPaymentEmail;
