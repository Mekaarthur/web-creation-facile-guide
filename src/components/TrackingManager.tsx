import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const TrackingManager = () => {
  const location = useLocation();

  useEffect(() => {
    // Google Analytics 4
    const initGoogleAnalytics = () => {
      // Chargement du script GA4
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID';
      document.head.appendChild(script);

      // Configuration GA4
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      
      window.gtag('js', new Date());
      window.gtag('config', 'GA_TRACKING_ID', {
        page_title: document.title,
        page_location: window.location.href,
        custom_map: {
          custom_parameter_1: 'service_type',
          custom_parameter_2: 'user_type'
        }
      });
    };

    // Facebook Pixel
    const initFacebookPixel = () => {
      const fbScript = document.createElement('script');
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', 'FACEBOOK_PIXEL_ID');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);

      // NoScript fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=FACEBOOK_PIXEL_ID&ev=PageView&noscript=1" />';
      document.body.appendChild(noscript);
    };

    // Google Ads Remarketing
    const initGoogleAds = () => {
      const adsScript = document.createElement('script');
      adsScript.async = true;
      adsScript.src = 'https://www.googletagmanager.com/gtag/js?id=AW-CONVERSION_ID';
      document.head.appendChild(adsScript);

      window.gtag('config', 'AW-CONVERSION_ID');
    };

    // Microsoft Clarity
    const initClarity = () => {
      const clarityScript = document.createElement('script');
      clarityScript.innerHTML = `
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "CLARITY_PROJECT_ID");
      `;
      document.head.appendChild(clarityScript);
    };

    // Hotjar
    const initHotjar = () => {
      const hotjarScript = document.createElement('script');
      hotjarScript.innerHTML = `
        (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:HOTJAR_ID,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `;
      document.head.appendChild(hotjarScript);
    };

    // Initialiser tous les trackers
    initGoogleAnalytics();
    initFacebookPixel();
    initGoogleAds();
    initClarity();
    initHotjar();

  }, []);

  // Track page views
  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', 'GA_TRACKING_ID', {
        page_path: location.pathname + location.search,
        page_title: document.title
      });
    }

    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location]);

  // Fonctions de tracking personnalisées
  useEffect(() => {
    // Tracking des événements personnalisés
    const trackEvent = (eventName: string, parameters: any = {}) => {
      // Google Analytics
      if (window.gtag) {
        window.gtag('event', eventName, parameters);
      }

      // Facebook Pixel
      if (window.fbq) {
        window.fbq('track', eventName, parameters);
      }
    };

    // Tracking des clics sur les boutons CTA
    const trackCTAClick = (ctaName: string) => {
      trackEvent('cta_click', {
        cta_name: ctaName,
        page_location: window.location.href
      });
    };

    // Tracking des conversions
    const trackConversion = (conversionType: string, value?: number) => {
      trackEvent('conversion', {
        conversion_type: conversionType,
        value: value,
        currency: 'EUR'
      });

      // Google Ads conversion
      if (window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
          value: value,
          currency: 'EUR'
        });
      }
    };

    // Tracking de l'engagement
    const trackEngagement = () => {
      let startTime = Date.now();
      let isActive = true;

      const checkEngagement = () => {
        if (isActive) {
          const timeSpent = Date.now() - startTime;
          if (timeSpent > 30000) { // 30 secondes
            trackEvent('engaged_user', {
              engagement_time: timeSpent,
              page_location: window.location.href
            });
          }
        }
      };

      // Check engagement après 30 secondes
      setTimeout(checkEngagement, 30000);

      // Arrêter le tracking si l'utilisateur quitte la page
      const handleVisibilityChange = () => {
        isActive = !document.hidden;
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    // Démarrer le tracking d'engagement
    const cleanup = trackEngagement();

    // Exposer les fonctions de tracking globalement
    (window as any).trackEvent = trackEvent;
    (window as any).trackCTAClick = trackCTAClick;
    (window as any).trackConversion = trackConversion;

    return cleanup;
  }, []);

  return null; // Ce composant ne rend rien visuellement
};

export default TrackingManager;