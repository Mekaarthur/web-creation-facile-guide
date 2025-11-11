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

interface ProviderAccountActivatedEmailProps {
  providerName: string;
  businessName: string;
}

export const ProviderAccountActivatedEmail = ({
  providerName = 'Prestataire',
  businessName = 'Votre entreprise',
}: ProviderAccountActivatedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>🎉 Votre compte est activé ! Bienvenue chez Bikawo</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Bienvenue dans l'équipe Bikawo !</Heading>
          
          <Text style={text}>Bonjour {providerName},</Text>
          
          <Text style={text}>
            C'est avec grand plaisir que nous vous confirmons l'activation de votre compte prestataire pour <strong>{businessName}</strong>.
          </Text>

          <Section style={celebrationBox}>
            <Text style={celebrationText}>
              ✓ Compte 100% activé
            </Text>
            <Text style={subText}>
              Vous pouvez maintenant recevoir des missions !
            </Text>
          </Section>

          <Text style={text}>
            <strong>Vos prochaines étapes :</strong>
          </Text>

          <ul style={list}>
            <li style={listItem}>📋 Consultez les missions disponibles</li>
            <li style={listItem}>📅 Configurez vos disponibilités</li>
            <li style={listItem}>💰 Suivez vos revenus en temps réel</li>
            <li style={listItem}>⭐ Construisez votre réputation</li>
          </ul>

          <Button
            href={`${process.env.SUPABASE_URL?.replace('.supabase.co', '.lovable.app')}/espace-prestataire`}
            style={button}
          >
            Accéder à mon espace
          </Button>

          <Hr style={hr} />

          <Section style={supportBox}>
            <Text style={supportText}>
              Une question ? Notre équipe est disponible pour vous accompagner.
            </Text>
            <Text style={supportContact}>
              📧 support@bikawo.com | 📞 06 09 08 53 90
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Bikawo - Ensemble, construisons votre réussite
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ProviderAccountActivatedEmail;

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

const celebrationBox = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '12px',
  padding: '30px',
  margin: '30px 0',
  textAlign: 'center' as const,
};

const celebrationText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const subText = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '0',
  opacity: 0.9,
};

const list = {
  margin: '16px 0',
  padding: '0 0 0 20px',
};

const listItem = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '32px',
  marginBottom: '8px',
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

const supportBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
};

const supportText = {
  color: '#404040',
  fontSize: '14px',
  margin: '0 0 8px',
};

const supportContact = {
  color: '#0066FF',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
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