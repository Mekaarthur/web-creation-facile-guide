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
} from '@react-email/components';
import * as React from 'react';

interface ReferralSuccessEmailProps {
  userName: string;
  referredName: string;
  rewardType: string;
  rewardValue: string;
}

export const ReferralSuccessEmail = ({
  userName = 'Client',
  referredName = 'Ami',
  rewardType = '2h de service',
  rewardValue = '2 heures',
}: ReferralSuccessEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>🎉 Félicitations ! Votre parrainage est validé</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://bikawo.com/logo.png"
            width="150"
            height="50"
            alt="Bikawo"
            style={logo}
          />
          
          <Section style={heroSection}>
            <Text style={heroEmoji}>🎊</Text>
            <Heading style={heading}>Parrainage réussi !</Heading>
          </Section>

          <Text style={paragraph}>
            Bonjour {userName},
          </Text>

          <Text style={paragraph}>
            Excellente nouvelle ! <strong>{referredName}</strong> a validé ses 10 heures de service 
            grâce à votre parrainage.
          </Text>

          <Section style={rewardBox}>
            <Text style={rewardTitle}>🎁 Votre récompense</Text>
            <Text style={rewardAmount}>{rewardValue}</Text>
            <Text style={rewardDescription}>
              {rewardType} offert(es) à utiliser sur votre prochaine réservation
            </Text>
          </Section>

          <Text style={paragraph}>
            Cette récompense est automatiquement ajoutée à votre compte et sera appliquée 
            lors de votre prochaine réservation.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href="https://bikawo.com/services">
              Réserver maintenant
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={paragraph}>
            Continuez à parrainer vos proches ! Chaque nouveau filleul vous rapporte 
            des heures de service gratuites.
          </Text>

          <Section style={buttonContainer}>
            <Button style={secondaryButton} href="https://bikawo.com/espace-personnel">
              Voir mon code parrainage
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

export default ReferralSuccessEmail;

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

const logo = {
  margin: '0 auto 20px',
  display: 'block',
};

const heroSection = {
  textAlign: 'center' as const,
  padding: '20px 0',
  backgroundColor: '#ecfdf5',
  borderRadius: '8px',
  margin: '0 20px 30px',
};

const heroEmoji = {
  fontSize: '48px',
  margin: '0 0 10px',
};

const heading = {
  color: '#059669',
  fontSize: '28px',
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

const rewardBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '24px',
  margin: '20px',
  textAlign: 'center' as const,
  border: '2px dashed #f59e0b',
};

const rewardTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '0 0 10px',
};

const rewardAmount = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#d97706',
  margin: '0 0 10px',
};

const rewardDescription = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#059669',
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
  color: '#059669',
  textDecoration: 'underline',
};
