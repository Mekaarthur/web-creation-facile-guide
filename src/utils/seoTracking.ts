// Google Analytics et outils SEO
export const installGoogleAnalytics = (measurementId: string) => {
  // Google Analytics 4
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}', {
      page_title: document.title,
      page_location: window.location.href
    });
  `;
  document.head.appendChild(script2);
};

export const installGoogleSearchConsole = (verificationCode: string) => {
  const meta = document.createElement('meta');
  meta.name = 'google-site-verification';
  meta.content = verificationCode;
  document.head.appendChild(meta);
};

export const installBingWebmasterTools = (verificationCode: string) => {
  const meta = document.createElement('meta');
  meta.name = 'msvalidate.01';
  meta.content = verificationCode;
  document.head.appendChild(meta);
};

// Tracking des événements SEO importants
export const trackSEOEvent = (eventName: string, parameters?: object) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      event_category: 'SEO',
      ...parameters
    });
  }
};

// Suivi des conversions
export const trackConversion = (action: string, value?: number) => {
  trackSEOEvent('conversion', {
    action,
    value,
    currency: 'EUR'
  });
};

// Suivi des formulaires
export const trackFormSubmission = (formName: string) => {
  trackSEOEvent('form_submit', {
    form_name: formName
  });
};

// Suivi des clics sur boutons CTA
export const trackCTAClick = (ctaName: string, location: string) => {
  trackSEOEvent('cta_click', {
    cta_name: ctaName,
    cta_location: location
  });
};