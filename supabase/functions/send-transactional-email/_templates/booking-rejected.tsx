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

interface BookingRejectedEmailProps {
  clientName: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  reason?: string;
}

export const BookingRejectedEmail = ({
  clientName = 'Client',
  serviceName = 'Service',
  bookingDate = '01/01/2025',
  startTime = '14:00',
  reason = 'Le prestataire n\'est pas disponible'
}: BookingRejectedEmailProps) => (
  <Html>
    <Head />
    <Preview>Votre demande nécessite notre attention 💛</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nous cherchons un nouveau prestataire</Heading>
        
        <Text style={text}>Bonjour {clientName},</Text>
        
        <Text style={text}>
          Le prestataire initialement sélectionné ne peut finalement pas assurer votre <strong>{serviceName}</strong> prévu le <strong>{bookingDate}</strong> à <strong>{startTime}</strong>.
        </Text>

        <Section style={reasonBox}>
          <Text style={reasonText}>
            📝 Raison: {reason}
          </Text>
        </Section>

        <Text style={text}>
          💛 <strong>Pas d'inquiétude !</strong> Nous mettons tout en œuvre pour vous trouver un autre prestataire qualifié dans les plus brefs délais.
        </Text>

        <Section style={ctaSection}>
          <Link href={`https://bikawo.com/espace-personnel`} style={button}>
            Voir ma demande
          </Link>
        </Section>

        <Text style={footer}>
          Vous recevrez une notification dès qu'un nouveau prestataire sera disponible.
        </Text>

        <Text style={signature}>
          Avec toute notre attention,<br />
          L'équipe Bikawo 💛
        </Text>
      </Container>
    </Body>
  </Html>
);

export default BookingRejectedEmail;

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
