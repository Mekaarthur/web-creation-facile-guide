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

interface ProviderRatingReceivedEmailProps {
  providerName: string;
  clientName: string;
  rating: number;
  comment: string;
  serviceName: string;
  missionDate: string;
  newAverageRating: number;
  totalReviews: number;
}

export const ProviderRatingReceivedEmail = ({
  providerName = 'Prestataire',
  clientName = 'Client',
  rating = 5,
  comment = '',
  serviceName = 'Service',
  missionDate = '01/01/2024',
  newAverageRating = 4.8,
  totalReviews = 10,
}: ProviderRatingReceivedEmailProps) => {
  const stars = '⭐'.repeat(rating);
  const emptyStars = '☆'.repeat(5 - rating);
  
  return (
    <Html>
      <Head />
      <Preview>⭐ Nouvel avis reçu - {rating}/5 étoiles</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://bikawo.fr/logo.png"
            width="150"
            height="50"
            alt="Bikawo"
            style={logo}
          />
          
          <Section style={heroSection}>
            <Text style={heroEmoji}>{rating >= 4 ? '🌟' : '📝'}</Text>
            <Heading style={heading}>Nouvel avis reçu !</Heading>
          </Section>

          <Text style={paragraph}>
            Bonjour {providerName},
          </Text>

          <Text style={paragraph}>
            <strong>{clientName}</strong> vous a laissé un avis suite à votre 
            mission du <strong>{missionDate}</strong>.
          </Text>

          <Section style={ratingBox}>
            <Text style={ratingStars}>{stars}{emptyStars}</Text>
            <Text style={ratingNumber}>{rating}/5</Text>
            <Text style={serviceName}>{serviceName}</Text>
          </Section>

          {comment && (
            <Section style={commentBox}>
              <Text style={commentTitle}>💬 Commentaire du client</Text>
              <Text style={commentText}>"{comment}"</Text>
            </Section>
          )}

          <Section style={statsBox}>
            <Text style={statsTitle}>📊 Votre profil</Text>
            <Text style={statItem}>
              <strong>Note moyenne :</strong> {newAverageRating.toFixed(1)}/5 ⭐
            </Text>
            <Text style={statItem}>
              <strong>Total des avis :</strong> {totalReviews} avis
            </Text>
          </Section>

          {rating >= 4 ? (
            <Section style={successMessage}>
              <Text style={successText}>
                🎉 Félicitations ! Cet excellent avis renforce votre visibilité 
                et vous permet d'obtenir plus de missions.
              </Text>
            </Section>
          ) : (
            <Section style={improvementMessage}>
              <Text style={improvementText}>
                💡 Chaque avis est une opportunité d'amélioration. N'hésitez pas 
                à revoir les points mentionnés pour vos prochaines missions.
              </Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href="https://bikawo.fr/espace-prestataire">
              Voir tous mes avis
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Bikawo - Votre assistant personnel au quotidien<br />
            <Link href="https://bikawo.fr" style={link}>bikawo.com</Link> | 
            <Link href="tel:+33609085390" style={link}> 06 09 08 53 90</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ProviderRatingReceivedEmail;

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
  backgroundColor: '#fefce8',
  borderRadius: '8px',
  margin: '0 20px 30px',
};

const heroEmoji = {
  fontSize: '48px',
  margin: '0 0 10px',
};

const heading = {
  color: '#854d0e',
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

const ratingBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '24px',
  margin: '20px',
  textAlign: 'center' as const,
  border: '2px solid #fbbf24',
};

const ratingStars = {
  fontSize: '32px',
  margin: '0 0 8px',
  letterSpacing: '4px',
};

const ratingNumber = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#b45309',
  margin: '0 0 8px',
};

const commentBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px',
  borderLeft: '4px solid #3b82f6',
};

const commentTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1e40af',
  margin: '0 0 10px',
};

const commentText = {
  fontSize: '15px',
  color: '#374151',
  fontStyle: 'italic',
  margin: '0',
  lineHeight: '24px',
};

const statsBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px',
};

const statsTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0369a1',
  margin: '0 0 15px',
};

const statItem = {
  fontSize: '14px',
  color: '#1e3a5f',
  margin: '8px 0',
};

const successMessage = {
  backgroundColor: '#ecfdf5',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px',
};

const successText = {
  fontSize: '14px',
  color: '#065f46',
  margin: '0',
  textAlign: 'center' as const,
};

const improvementMessage = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px',
};

const improvementText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
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
