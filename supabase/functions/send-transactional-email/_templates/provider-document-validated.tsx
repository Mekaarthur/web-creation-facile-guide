import * as React from 'react';
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
  Hr,
} from '@react-email/components';

interface ProviderDocumentValidatedEmailProps {
  providerName: string;
  documentType: string;
  nextStep: string;
}

export const ProviderDocumentValidatedEmail = ({
  providerName = 'Prestataire',
  documentType = 'Document',
  nextStep = 'Formation obligatoire',
}: ProviderDocumentValidatedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Vos documents ont été validés ✓</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Documents validés ✓</Heading>
          
          <Text style={text}>Bonjour {providerName},</Text>
          
          <Text style={text}>
            Excellente nouvelle ! Vos documents ({documentType}) ont été vérifiés et validés par notre équipe.
          </Text>

          <Section style={successBox}>
            <Text style={successText}>
              ✓ Validation réussie
            </Text>
          </Section>

          <Text style={text}>
            <strong>Prochaine étape :</strong> {nextStep}
          </Text>

          <Button
            href={`${process.env.SUPABASE_URL?.replace('.supabase.co', '.lovable.app')}/espace-prestataire`}
            style={button}
          >
            Accéder à mon espace
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Bikawo - Votre partenaire de confiance
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ProviderDocumentValidatedEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 30px',
  textAlign: 'center' as const,
};

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const successBox = {
  backgroundColor: '#d4edda',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const successText = {
  color: '#155724',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const button = {
  backgroundColor: '#0066FF',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 28px',
  margin: '24px auto',
};

const hr = {
  borderColor: '#e6e6e6',
  margin: '32px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
};