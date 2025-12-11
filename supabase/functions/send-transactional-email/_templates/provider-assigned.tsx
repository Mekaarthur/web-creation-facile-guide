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
  Hr,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

const LOGO_URL = 'https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

interface ProviderAssignedEmailProps {
  clientName: string;
  providerName: string;
  providerRating: number;
  serviceName: string;
  bookingDate: string;
  startTime: string;
}

export const ProviderAssignedEmail = ({
  clientName,
  providerName,
  providerRating,
  serviceName,
  bookingDate,
  startTime,
}: ProviderAssignedEmailProps) => (
  <Html>
    <Head />
    <Preview>Un prestataire a été assigné à votre réservation</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
        </Section>
        <Heading style={h1}>👤 Prestataire assigné</Heading>
        
        <Text style={text}>
          Bonjour {clientName},
        </Text>
        
        <Text style={text}>
          Excellente nouvelle ! Nous avons trouvé le prestataire idéal pour votre demande.
        </Text>

        <Section style={providerBox}>
          <Heading style={h2}>{providerName}</Heading>
          <Text style={rating}>
            ⭐ Note moyenne : {providerRating.toFixed(1)}/5
          </Text>
          
          <Hr style={hr} />
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Service :</Column>
            <Column style={detailValue}>{serviceName}</Column>
          </Row>
          
          <Row style={detailRow}>
            <Column style={detailLabel}>Date :</Column>
            <Column style={detailValue}>{bookingDate} à {startTime}</Column>
          </Row>
        </Section>

        <Section style={infoBox}>
          <Text style={infoText}>
            ℹ️ <strong>Le prestataire a 2 heures pour confirmer sa disponibilité.</strong>
          </Text>
          <Text style={infoText}>
            Si le prestataire ne peut pas confirmer, nous vous en assignerons automatiquement un autre.
          </Text>
        </Section>

        <Text style={text}>
          Vous serez notifié dès que le prestataire aura confirmé. Vous pourrez ensuite discuter avec lui via la messagerie de votre espace client.
        </Text>

        <Text style={footer}>
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

const logoContainer = { textAlign: 'center' as const, padding: '20px 0' };
const logo = { margin: '0 auto' };

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 20px 20px',
};

const h2 = {
  color: '#059669',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
};

const rating = {
  color: '#f59e0b',
  fontSize: '16px',
  fontWeight: '600',
  margin: '8px 0',
};

const providerBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #059669',
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
  fontWeight: '500',
};

const hr = {
  borderColor: '#bbf7d0',
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

export default ProviderAssignedEmail;
