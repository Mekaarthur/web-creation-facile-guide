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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface PaymentFailedEmailProps {
  clientName: string;
  serviceName: string;
  amount: string;
  bookingDate: string;
  errorReason: string;
  retryUrl: string;
}

const LOGO_URL = 'https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

export const PaymentFailedEmail = ({
  clientName = 'Client',
  serviceName = 'Service',
  amount = '50,00€',
  bookingDate = '01/01/2024',
  errorReason = 'Carte refusée',
  retryUrl = 'https://bikawo.com/payment',
}: PaymentFailedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>⚠️ Action requise : Échec de paiement</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
          </Section>
          
          <Section style={heroSection}>
            <Text style={heroEmoji}>⚠️</Text>
            <Heading style={heading}>Échec de paiement</Heading>
          </Section>

          <Text style={paragraph}>
            Bonjour {clientName},
          </Text>

          <Text style={paragraph}>
            Nous n'avons pas pu traiter votre paiement pour la réservation suivante :
          </Text>

          <Section style={bookingBox}>
            <Text style={bookingTitle}>📋 Détails de la réservation</Text>
            <Text style={bookingItem}>
              <strong>Service :</strong> {serviceName}
            </Text>
            <Text style={bookingItem}>
              <strong>Date :</strong> {bookingDate}
            </Text>
            <Text style={bookingItem}>
              <strong>Montant :</strong> {amount}
            </Text>
          </Section>

          <Section style={errorBox}>
            <Text style={errorTitle}>❌ Raison de l'échec</Text>
            <Text style={errorText}>{errorReason}</Text>
          </Section>

          <Text style={paragraph}>
            <strong>Votre réservation est en attente.</strong> Pour la confirmer, 
            veuillez mettre à jour vos informations de paiement ou réessayer avec 
            une autre carte.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={retryUrl}>
              Réessayer le paiement
            </Button>
          </Section>

          <Section style={tipsBox}>
            <Text style={tipsTitle}>💡 Conseils</Text>
            <Text style={tipItem}>• Vérifiez que votre carte n'a pas expiré</Text>
            <Text style={tipItem}>• Assurez-vous d'avoir un solde suffisant</Text>
            <Text style={tipItem}>• Vérifiez que les achats en ligne sont autorisés</Text>
            <Text style={tipItem}>• Essayez une autre carte de paiement</Text>
          </Section>

          <Text style={urgentText}>
            ⏰ <strong>Important :</strong> Votre réservation sera automatiquement 
            annulée si le paiement n'est pas effectué dans les 24 heures.
          </Text>

          <Hr style={hr} />

          <Text style={helpText}>
            Besoin d'aide ? Notre équipe est disponible pour vous accompagner.
          </Text>

          <Section style={buttonContainer}>
            <Button style={secondaryButton} href="tel:+33609085390">
              📞 Nous appeler
            </Button>
          </Section>

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

export default PaymentFailedEmail;

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
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  margin: '0 20px 30px',
};

const heroEmoji = {
  fontSize: '48px',
  margin: '0 0 10px',
};

const heading = {
  color: '#dc2626',
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

const bookingBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px',
  border: '1px solid #e5e7eb',
};

const bookingTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#374151',
  margin: '0 0 15px',
};

const bookingItem = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '8px 0',
};

const errorBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px',
  borderLeft: '4px solid #ef4444',
};

const errorTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#991b1b',
  margin: '0 0 8px',
};

const errorText = {
  fontSize: '14px',
  color: '#b91c1c',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const secondaryButton = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  color: '#374151',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: '1px solid #d1d5db',
};

const tipsBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px',
};

const tipsTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '0 0 10px',
};

const tipItem = {
  fontSize: '13px',
  color: '#78350f',
  margin: '4px 0',
};

const urgentText = {
  color: '#dc2626',
  fontSize: '14px',
  textAlign: 'center' as const,
  padding: '15px 20px',
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  margin: '20px',
};

const helpText = {
  color: '#6b7280',
  fontSize: '14px',
  textAlign: 'center' as const,
  padding: '0 20px',
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
