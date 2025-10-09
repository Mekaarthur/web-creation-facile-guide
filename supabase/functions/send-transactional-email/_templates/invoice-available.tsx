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

interface InvoiceAvailableEmailProps {
  clientName?: string;
  invoiceNumber?: string;
  serviceName?: string;
  totalAmount?: number;
  invoiceDate?: string;
  invoiceLink?: string;
}

export const InvoiceAvailableEmail = ({
  clientName = 'Client',
  invoiceNumber = 'INV-2025-001',
  serviceName = 'Service',
  totalAmount = 0,
  invoiceDate = new Date().toLocaleDateString('fr-FR'),
  invoiceLink = 'https://ed681ca2-74aa-4970-8c41-139ffb8c8152.lovableproject.com/espace-personnel'
}: InvoiceAvailableEmailProps) => (
  <Html>
    <Head />
    <Preview>Votre facture est disponible</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📄 Facture disponible</Heading>

        <Text style={text}>Bonjour {clientName},</Text>
        <Text style={text}>
          Votre facture pour la prestation <strong>{serviceName}</strong> est maintenant disponible.
        </Text>

        <Section style={invoiceBox}>
          <Text style={invoiceIcon}>🧾</Text>
          <Text style={invoiceNumber}>Facture N° {invoiceNumber}</Text>
          <Text style={invoiceDate}>Date : {invoiceDate}</Text>
          <Text style={invoiceAmount}>{totalAmount.toFixed(2)}€ TTC</Text>
        </Section>

        <Section style={ctaBox}>
          <Button href={invoiceLink} style={button}>
            Télécharger ma facture
          </Button>
        </Section>

        <Section style={infoBox}>
          <Text style={infoTitle}>💡 Bon à savoir</Text>
          <Text style={infoText}>
            • Votre facture est disponible 24/7 dans votre espace personnel
          </Text>
          <Text style={infoText}>
            • Elle peut être utilisée pour vos demandes de remboursement CAF/employeur
          </Text>
          <Text style={infoText}>
            • Un duplicata est toujours disponible en cas de besoin
          </Text>
        </Section>

        <Text style={footer}>
          Cordialement,<br />
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
const invoiceBox = { backgroundColor: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: '8px', margin: '20px', padding: '32px', textAlign: 'center' as const };
const invoiceIcon = { fontSize: '48px', margin: '0 0 16px' };
const invoiceNumber = { color: '#111827', fontSize: '18px', fontWeight: 'bold', margin: '8px 0' };
const invoiceDate = { color: '#6b7280', fontSize: '14px', margin: '4px 0' };
const invoiceAmount = { color: '#059669', fontSize: '28px', fontWeight: 'bold', margin: '16px 0 0' };
const ctaBox = { textAlign: 'center' as const, margin: '20px' };
const button = { backgroundColor: '#3b82f6', borderRadius: '6px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 32px', margin: '8px 0' };
const infoBox = { backgroundColor: '#eff6ff', borderRadius: '8px', margin: '20px', padding: '16px 20px' };
const infoTitle = { color: '#1e40af', fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px' };
const infoText = { color: '#1e3a8a', fontSize: '14px', lineHeight: '22px', margin: '6px 0' };
const footer = { color: '#6b7280', fontSize: '12px', lineHeight: '20px', margin: '32px 20px' };

export default InvoiceAvailableEmail;
