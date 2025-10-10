import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface BookingRescheduledEmailProps {
  clientName: string;
  serviceName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  providerName?: string;
  reason?: string;
}

export const BookingRescheduledEmail = ({
  clientName = 'Client',
  serviceName = 'Service',
  oldDate = '01/01/2025',
  oldTime = '14:00',
  newDate = '02/01/2025',
  newTime = '15:00',
  providerName = 'votre prestataire',
  reason
}: BookingRescheduledEmailProps) => (
  <Html>
    <Head />
    <Preview>Votre réservation a été reportée 📅</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nouvelle date pour votre mission</Heading>
        
        <Text style={text}>Bonjour {clientName},</Text>
        
        <Text style={text}>
          Votre <strong>{serviceName}</strong> avec {providerName} a été reporté.
        </Text>

        {reason && (
          <Section style={reasonBox}>
            <Text style={reasonText}>
              📝 Raison: {reason}
            </Text>
          </Section>
        )}

        <Section style={dateBox}>
          <table style={{ width: '100%' }}>
            <tr>
              <td style={dateCell}>
                <Text style={dateLabel}>Ancienne date</Text>
                <Text style={dateValue}>
                  ❌ {oldDate} à {oldTime}
                </Text>
              </td>
              <td style={arrowCell}>
                <Text style={arrow}>→</Text>
              </td>
              <td style={dateCell}>
                <Text style={dateLabel}>Nouvelle date</Text>
                <Text style={dateValueNew}>
                  ✅ {newDate} à {newTime}
                </Text>
              </td>
            </tr>
          </table>
        </Section>

        <Text style={text}>
          💛 Nous nous excusons pour ce changement et ferons tout notre possible pour que cette nouvelle date vous convienne parfaitement.
        </Text>

        <Section style={ctaSection}>
          <Link href={`https://bikawo.com/espace-personnel`} style={button}>
            Voir ma réservation
          </Link>
        </Section>

        <Text style={footer}>
          Si cette nouvelle date ne vous convient pas, n'hésitez pas à nous contacter.
        </Text>

        <Text style={signature}>
          Avec toute notre compréhension,<br />
          L'équipe Bikawo 💛
        </Text>
      </Container>
    </Body>
  </Html>
);

export default BookingRescheduledEmail;

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

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 30px',
  lineHeight: '1.3',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const reasonBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  padding: '16px',
  margin: '24px 0',
  borderRadius: '4px',
};

const reasonText = {
  color: '#92400e',
  fontSize: '15px',
  margin: '0',
};

const dateBox = {
  backgroundColor: '#f9fafb',
  padding: '24px',
  margin: '24px 0',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
};

const dateCell = {
  padding: '8px',
  textAlign: 'center' as const,
};

const arrowCell = {
  padding: '8px',
  textAlign: 'center' as const,
  width: '60px',
};

const dateLabel = {
  color: '#6b7280',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
};

const dateValue = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  textDecoration: 'line-through',
};

const dateValueNew = {
  color: '#059669',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const arrow = {
  color: '#667eea',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '32px 0 16px',
  textAlign: 'center' as const,
};

const signature = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0 0',
  textAlign: 'center' as const,
};
