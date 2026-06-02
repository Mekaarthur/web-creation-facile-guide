import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RetargetingPixelsProps {
  userType?: 'client' | 'provider' | 'visitor';
  serviceInterest?: string[];
  conversionValue?: number;
}

const RetargetingPixels = ({ 
  userType = 'visitor', 
  serviceInterest = [], 
  conversionValue 
}: RetargetingPixelsProps) => {
  const location = useLocation();

  useEffect(() => {
    // Configuration des audiences personnalisées
    const setupCustomAudiences = () => {
      // Facebook Custom Audiences
      if (window.fbq) {
        // Audience basée sur les pages visitées
        window.fbq('track', 'ViewContent', {
          content_type: 'page',
          content_ids: [location.pathname],
          user_type: userType,
          service_interest: serviceInterest
        });

        // Audience des visiteurs de services spécifiques
        if (location.pathname.includes('/services')) {
          window.fbq('track', 'ViewContent', {
            content_type: 'service_catalog',
            content_category: 'services',
            user_type: userType
          });
        }

        // Audience des visiteurs de prix
        if (location.pathname.includes('/services') && serviceInterest.length > 0) {
          window.fbq('track', 'ViewContent', {
            content_type: 'pricing',
            content_name: serviceInterest.join(','),
            user_type: userType
          });
        }
      }

      // Google Ads Custom Audiences
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          custom_parameter_1: userType,
          custom_parameter_2: serviceInterest.join(','),
          page_path: location.pathname,
          user_engagement: true
        });

        // Remarketing pour les visiteurs de services
        if (location.pathname.includes('/services')) {
          window.gtag('event', 'view_item_list', {
            item_category: 'services',
            user_type: userType,
            items: serviceInterest.map(service => ({
              item_id: service,
              item_name: service,
              item_category: 'service'
            }))
          });
        }
      }
    };

    // Tracking des micro-conversions pour le retargeting
    const trackMicroConversions = () => {
      // Temps passé sur la page (engagement)
      let startTime = Date.now();
      
      const trackTimeSpent = () => {
        const timeSpent = Date.now() - startTime;
        
        if (timeSpent > 60000) { // Plus d'1 minute
          if (window.fbq) {
            window.fbq('track', 'TimeSpent', {
              time_spent: timeSpent,
              page_path: location.pathname,
              user_type: userType
            });
          }
          
          if (window.gtag) {
            window.gtag('event', 'engagement', {
              engagement_time_msec: timeSpent,
              user_type: userType
            });
          }
        }
      };

      // Scroll depth tracking
      let maxScroll = 0;
      const trackScrollDepth = () => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        
        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
          
          // Track milestone scrolls (25%, 50%, 75%, 100%)
          const milestones = [25, 50, 75, 100];
          const milestone = milestones.find(m => scrollPercent >= m && maxScroll < m);
          
          if (milestone) {
            if (window.fbq) {
              window.fbq('track', 'ScrollDepth', {
                scroll_depth: milestone,
                page_path: location.pathname,
                user_type: userType
              });
            }
            
            if (window.gtag) {
              window.gtag('event', 'scroll', {
                scroll_depth: milestone,
                user_type: userType
              });
            }
          }
        }
      };

      // Event listeners
      window.addEventListener('scroll', trackScrollDepth);
      window.addEventListener('beforeunload', trackTimeSpent);

      return () => {
        window.removeEventListener('scroll', trackScrollDepth);
        window.removeEventListener('beforeunload', trackTimeSpent);
        trackTimeSpent(); // Track final time when component unmounts
      };
    };

    // Tracking des intentions d'achat
    const trackPurchaseIntent = () => {
      // Clic sur les boutons de prix
      const priceButtons = document.querySelectorAll('[data-track="price-click"]');
      priceButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (window.fbq) {
            window.fbq('track', 'InitiateCheckout', {
              content_type: 'service',
              user_type: userType,
              service_interest: serviceInterest
            });
          }
          
          if (window.gtag) {
            window.gtag('event', 'begin_checkout', {
              currency: 'EUR',
              user_type: userType,
              items: serviceInterest.map(service => ({
                item_id: service,
                item_name: service,
                item_category: 'service'
              }))
            });
          }
        });
      });

      // Clic sur "Réserver maintenant"
      const bookingButtons = document.querySelectorAll('[data-track="booking-intent"]');
      bookingButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (window.fbq) {
            window.fbq('track', 'AddToCart', {
              content_type: 'service',
              user_type: userType,
              service_interest: serviceInterest,
              value: conversionValue,
              currency: 'EUR'
            });
          }
          
          if (window.gtag) {
            window.gtag('event', 'add_to_cart', {
              currency: 'EUR',
              value: conversionValue,
              user_type: userType
            });
          }
        });
      });
    };

    // Initialiser tous les trackings
    setupCustomAudiences();
    const cleanupMicroConversions = trackMicroConversions();
    trackPurchaseIntent();

    return cleanupMicroConversions;
  }, [location, userType, serviceInterest, conversionValue]);

  // Tracking des conversions complètes
  useEffect(() => {
    if (conversionValue && conversionValue > 0) {
      // Conversion Facebook
      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: conversionValue,
          currency: 'EUR',
          content_type: 'service',
          user_type: userType,
          service_interest: serviceInterest
        });
      }

      // Conversion Google Ads
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: `txn_${Date.now()}`,
          value: conversionValue,
          currency: 'EUR',
          user_type: userType
        });

        // Enhanced conversion pour Google Ads
        window.gtag('event', 'conversion', {
          send_to: 'AW-CONVERSION_ID/PURCHASE_LABEL',
          value: conversionValue,
          currency: 'EUR',
          transaction_id: `txn_${Date.now()}`
        });
      }
    }
  }, [conversionValue, userType, serviceInterest]);

  return null;
};

export default RetargetingPixels;