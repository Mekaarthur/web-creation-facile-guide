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
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ReviewRequestEmailProps {
  clientName?: string;
  serviceName?: string;
  providerName?: string;
  bookingDate?: string;
  reviewLink?: string;
}

const LOGO_URL = 'https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

export const ReviewRequestEmail = ({
  clientName = 'Client',
  serviceName = 'Service',
  providerName = 'Prestataire',
  bookingDate = new Date().toLocaleDateString('fr-FR'),
  reviewLink = 'https://bikawo.com/espace-personnel'
}: ReviewRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>Partagez votre expérience avec {providerName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
        </Section>
        <Heading style={h1}>⭐ Votre avis nous intéresse</Heading>

        <Text style={text}>Bonjour {clientName},</Text>
        <Text style={text}>
          Votre prestation <strong>{serviceName}</strong> avec {providerName} s'est terminée le {bookingDate}.
        </Text>
        <Text style={text}>
          Votre retour est précieux pour nous aider à améliorer nos services et guider d'autres clients.
        </Text>

        <Section style={ctaBox}>
          <Button href={reviewLink} style={button}>
            Laisser mon avis
          </Button>
          <Text style={hint}>Cela ne prend que 2 minutes</Text>
        </Section>

        <Section style={benefitsBox}>
          <Text style={benefitsTitle}>💡 Pourquoi donner votre avis ?</Text>
          <Text style={benefitsText}>✓ Aidez d'autres familles à faire le bon choix</Text>
          <Text style={benefitsText}>✓ Valorisez le travail de nos prestataires</Text>
          <Text style={benefitsText}>✓ Contribuez à améliorer nos services</Text>
        </Section>

        <Text style={footer}>
          Merci de votre confiance,<br />
          L'équipe Bikawo
        </Text>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px', borderRadius: '8px' };
const logoContainer = { textAlign: 'center' as const, padding: '20px 0' };
const logo = { margin: '0 auto' };
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold', margin: '40px 20px 20px' };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px', margin: '16px 20px' };
const ctaBox = { textAlign: 'center' as const, margin: '32px 20px' };
const button = { backgroundColor: '#f59e0b', borderRadius: '6px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 32px', margin: '8px 0' };
const hint = { color: '#6b7280', fontSize: '12px', marginTop: '8px' };
const benefitsBox = { backgroundColor: '#fef3c7', borderRadius: '8px', margin: '20px', padding: '16px 20px' };
const benefitsTitle = { color: '#92400e', fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px' };
const benefitsText = { color: '#78350f', fontSize: '14px', lineHeight: '22px', margin: '6px 0' };
const footer = { color: '#6b7280', fontSize: '12px', lineHeight: '20px', margin: '32px 20px' };

export default ReviewRequestEmail;
