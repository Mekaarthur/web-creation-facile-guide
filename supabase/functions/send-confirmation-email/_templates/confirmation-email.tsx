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
  Img,
  Hr,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmationEmailProps {
  confirmationUrl: string
  userEmail: string
}

export const ConfirmationEmail = ({
  confirmationUrl,
  userEmail,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Bienvenue sur Bikawo ! Confirmez votre adresse email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src="https://bikawo.com/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png"
            width="200"
            height="auto"
            alt="Bikawo"
            style={logo}
          />
        </Section>

        <Heading style={h1}>BIENVENUE SUR BIKAWO</Heading>
        
        <Text style={text}>
          Bienvenue sur Bikawo ! Clique sur le lien ci-dessous pour activer ton compte et commencer à profiter de nos services.
        </Text>

        <Section style={buttonContainer}>
          <Button href={confirmationUrl} style={button}>
            Confirmer mon email
          </Button>
        </Section>

        <Text style={text}>
          Ou copiez et collez ce lien dans votre navigateur :
        </Text>
        
        <Text style={linkText}>
          {confirmationUrl}
        </Text>

        <Hr style={hr} />

        <Section style={benefitsSection}>
          <Heading style={h2}>Ce qui vous attend chez Bikawo :</Heading>
          <Text style={benefitItem}>✅ Crédit d'impôt 50% immédiat</Text>
          <Text style={benefitItem}>✅ Un seul prestataire pour tous vos besoins</Text>
          <Text style={benefitItem}>✅ Service client réactif 7j/7</Text>
          <Text style={benefitItem}>✅ Personnel vérifié et de confiance</Text>
          <Text style={benefitItem}>✅ Intervention rapide en Île-de-France</Text>
        </Section>

        <Hr style={hr} />

        <Text style={footerText}>
          Si vous n'avez pas créé de compte Bikawo, vous pouvez ignorer cet email en toute sécurité.
        </Text>

        <Text style={footer}>
          <Link href="https://bikawo.com" style={footerLink}>
            Bikawo
          </Link>
          <br />
          Votre assistant personnel au quotidien
          <br />
          📧 contact@bikawo.com | 📞 +33 0609085390
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#1a202c',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#2d3748',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#4c51bf',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  margin: '0 auto',
}

const linkText = {
  color: '#4c51bf',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  margin: '0 0 24px',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
}

const benefitsSection = {
  backgroundColor: '#f7fafc',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
}

const benefitItem = {
  color: '#2d3748',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 8px',
}

const footerText = {
  color: '#718096',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '24px 0 0',
}

const footer = {
  color: '#a0aec0',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  marginTop: '32px',
  borderTop: '1px solid #e2e8f0',
  paddingTop: '24px',
}

const footerLink = {
  color: '#4c51bf',
  textDecoration: 'underline',
}