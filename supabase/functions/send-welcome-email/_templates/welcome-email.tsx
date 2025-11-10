import React from 'npm:react@18.3.1';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22';

interface WelcomeEmailProps {
  email: string;
  firstName: string;
  tempPassword: string;
  loginUrl: string;
}

export const WelcomeEmail = ({ email, firstName, tempPassword, loginUrl }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bienvenue sur Bikawo ! 🎉</Heading>
        
        <Text style={text}>
          Bonjour {firstName},
        </Text>
        
        <Text style={text}>
          Merci pour votre commande ! Nous avons automatiquement créé un compte pour vous permettre de suivre vos réservations et faciliter vos prochaines commandes.
        </Text>

        <Section style={codeBox}>
          <Text style={codeLabel}>Votre email de connexion :</Text>
          <Text style={code}>{email}</Text>
          
          <Text style={codeLabel}>Votre mot de passe temporaire :</Text>
          <Text style={code}>{tempPassword}</Text>
        </Section>

        <Text style={text}>
          <strong>Important :</strong> Pour votre sécurité, nous vous recommandons de changer ce mot de passe temporaire dès votre première connexion.
        </Text>

        <Button style={button} href={loginUrl}>
          Se connecter à mon compte
        </Button>

        <Hr style={hr} />

        <Text style={footer}>
          Avec votre compte, vous pouvez :
        </Text>
        <Text style={footer}>
          • Suivre vos réservations en temps réel<br />
          • Gérer vos méthodes de paiement<br />
          • Consulter votre historique de commandes<br />
          • Réserver plus rapidement<br />
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Si vous n'avez pas effectué de commande sur Bikawo, vous pouvez ignorer cet email.
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
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 30px',
  textAlign: 'center' as const,
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const codeBox = {
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const codeLabel = {
  color: '#71717a',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const code = {
  color: '#18181b',
  fontSize: '18px',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  margin: '0 0 20px',
  wordBreak: 'break-all' as const,
};

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 24px',
  margin: '24px 0',
};

const hr = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
};

const footer = {
  color: '#71717a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};
