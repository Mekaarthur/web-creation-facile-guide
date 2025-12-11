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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface EmergencyReplacementEmailProps {
  clientName: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  address: string;
  replacementProviderName: string;
  replacementProviderRating?: number;
  reason: string;
}

const LOGO_URL = 'https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

export const EmergencyReplacementEmail = ({
  clientName = 'Client',
  serviceName = 'Service',
  bookingDate = '01/01/2025',
  startTime = '14:00',
  address = 'Adresse',
  replacementProviderName = 'Prestataire',
  replacementProviderRating = 4.8,
  reason = 'Indisponibilité de dernière minute'
}: EmergencyReplacementEmailProps) => (
  <Html>
    <Head />
    <Preview>🚨 Changement de prestataire urgent - Nous gérons tout</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
        </Section>

        <Section style={alertHeader}>
          <Heading style={h1}>🚨 Changement urgent de prestataire</Heading>
        </Section>
        
        <Text style={text}>Bonjour {clientName},</Text>
        
        <Section style={urgentBox}>
          <Text style={urgentText}>
            ⚠️ <strong>Situation imprévue</strong>
          </Text>
          <Text style={urgentReason}>
            {reason}
          </Text>
        </Section>

        <Text style={text}>
          💛 <strong>Pas de panique !</strong> Nous avons immédiatement activé notre protocole d'urgence et trouvé un excellent prestataire de remplacement.
        </Text>

        <Section style={providerBox}>
          <Heading style={providerTitle}>Votre nouveau prestataire</Heading>
          <Text style={providerName}>
            ⭐ {replacementProviderName}
          </Text>
          <Text style={providerRating}>
            Note: {replacementProviderRating}/5 ⭐ - Prestataire vérifié ✅
          </Text>
        </Section>

        <Section style={detailsBox}>
          <Text style={detailsTitle}>Détails de votre mission (inchangés)</Text>
          <table style={{ width: '100%' }}>
            <tr>
              <td style={detailLabel}>Service:</td>
              <td style={detailValue}>{serviceName}</td>
            </tr>
            <tr>
              <td style={detailLabel}>Date:</td>
              <td style={detailValue}>{bookingDate} à {startTime}</td>
            </tr>
            <tr>
              <td style={detailLabel}>Lieu:</td>
              <td style={detailValue}>{address}</td>
            </tr>
          </table>
        </Section>

        <Text style={text}>
          Le nouveau prestataire est informé et sera présent à l'heure prévue. Votre mission se déroulera normalement.
        </Text>

        <Section style={ctaSection}>
          <Link href={`https://bikawo.com/espace-personnel`} style={button}>
            Voir les détails
          </Link>
        </Section>

        <Section style={contactBox}>
          <Text style={contactText}>
            🆘 <strong>Besoin d'aide ?</strong><br />
            Notre équipe est disponible au <strong>06 09 08 53 90</strong>
          </Text>
        </Section>

        <Text style={signature}>
          Nous sommes désolés pour ce contretemps,<br />
          L'équipe Bikawo 💛<br />
          📧 contact@bikawo.com
        </Text>
      </Container>
    </Body>
  </Html>
);

export default EmergencyReplacementEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const logoContainer = {
  textAlign: 'center' as const,
  padding: '0 0 20px',
};

const logo = {
  margin: '0 auto',
};

const alertHeader = {
  backgroundColor: '#fef2f2',
  padding: '20px',
  margin: '0 -20px 30px',
  borderBottom: '3px solid #dc2626',
};

const h1 = {
  color: '#dc2626',
  fontSize: '26px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.3',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const urgentBox = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #dc2626',
  padding: '16px',
  margin: '24px 0',
  borderRadius: '4px',
};

const urgentText = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const urgentReason = {
  color: '#7f1d1d',
  fontSize: '15px',
  margin: '0',
};

const providerBox = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  margin: '24px 0',
  borderRadius: '8px',
  border: '2px solid #059669',
  textAlign: 'center' as const,
};

const providerTitle = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
};

const providerName = {
  color: '#047857',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const providerRating = {
  color: '#059669',
  fontSize: '15px',
  margin: '0',
};

const detailsBox = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  margin: '24px 0',
  borderRadius: '8px',
};

const detailsTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  padding: '8px 0',
  width: '30%',
};

const detailValue = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '600',
  padding: '8px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const contactBox = {
  backgroundColor: '#fffbeb',
  padding: '16px',
  margin: '24px 0',
  borderRadius: '8px',
  border: '1px solid #fbbf24',
  textAlign: 'center' as const,
};

const contactText = {
  color: '#92400e',
  fontSize: '15px',
  margin: '0',
  lineHeight: '24px',
};

const signature = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0 0',
  textAlign: 'center' as const,
};
