import * as React from 'npm:react@18.3.1';
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
  Hr,
} from 'npm:@react-email/components@0.0.22';

interface ProviderDocumentRejectedEmailProps {
  providerName: string;
  documentType: string;
  rejectionReason: string;
}

const LOGO_URL = 'https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png';

export const ProviderDocumentRejectedEmail = ({
  providerName = 'Prestataire',
  documentType = 'Document',
  rejectionReason = 'Document illisible',
}: ProviderDocumentRejectedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Action requise : Document à renvoyer</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img src={LOGO_URL} width="180" height="auto" alt="Bikawo" style={logo} />
          </Section>
          <Heading style={h1}>Document à renouveler</Heading>
          
          <Text style={text}>Bonjour {providerName},</Text>
          
          <Text style={text}>
            Nous avons examiné votre document ({documentType}) mais nous ne pouvons malheureusement pas le valider.
          </Text>

          <Section style={warningBox}>
            <Text style={warningTitle}>Motif du refus :</Text>
            <Text style={warningText}>{rejectionReason}</Text>
          </Section>

          <Text style={text}>
            <strong>Action requise :</strong> Merci de renvoyer un nouveau document conforme via votre espace prestataire.
          </Text>

          <Button
            href={`${process.env.SUPABASE_URL?.replace('.supabase.co', '.lovable.app')}/espace-prestataire`}
            style={button}
          >
            Renvoyer mon document
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Bikawo - Nous sommes là pour vous accompagner
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ProviderDocumentRejectedEmail;

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

const logoContainer = {
  textAlign: 'center' as const,
  padding: '0 0 20px',
};

const logo = {
  margin: '0 auto',
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

const warningBox = {
  backgroundColor: '#fff3cd',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  borderLeft: '4px solid #ffc107',
};

const warningTitle = {
  color: '#856404',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const warningText = {
  color: '#856404',
  fontSize: '15px',
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