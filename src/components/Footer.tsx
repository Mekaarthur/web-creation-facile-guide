import { MessageCircle, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const footerSections = [
    {
      title: t('footer.services'),
      links: [
        { name: "Bika Kids", href: "/services" },
        { name: "Bika Maison", href: "/services" },
        { name: "Bika Seniors", href: "/services" },
        { name: "Bika Travel", href: "/services" },
        { name: "Bika Pro", href: "/services" },
        { name: "Bika Plus", href: "/services" }
      ]
    },
    {
      title: t('footer.company'), 
      links: [
        { name: t('footer.about'), href: "/a-propos-de-nous" },
        { name: t('footer.careers'), href: "/nous-recrutons" },
        { name: t('nav.blog'), href: "/blog" },
        { name: t('footer.partners'), href: "/contact" }
      ]
    },
    {
      title: t('footer.support'),
      links: [
        { name: t('footer.helpCenter'), href: "/aide" },
        { name: t('nav.contact'), href: "/contact" },
        { name: t('footer.faq'), href: "/aide" },
        { name: t('footer.status'), href: "/aide" }
      ]
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/bikawo", name: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/bikawo", name: "Instagram" },
    { icon: Linkedin, href: "https://linkedin.com/company/bikawo", name: "LinkedIn" },
    { icon: Twitter, href: "https://twitter.com/bikawo", name: "Twitter" }
  ];

  return (
    <footer className="relative bg-foreground text-background overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:20px_20px]"></div>
      
      <div className="relative">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Brand Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{t('footer.title')}</span>
              </div>
              
              <p className="text-white/70 text-lg leading-relaxed max-w-lg">
                {t('footer.description')}
              </p>

              {/* Contact Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <a 
                  href="tel:+33609085390"
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 block"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">{t('footer.phone')}</p>
                      <p className="text-sm font-medium">06 09 08 53 90</p>
                    </div>
                  </div>
                </a>
                
                <a 
                  href="mailto:contact@bikawo.com"
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 block"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">{t('footer.email')}</p>
                      <p className="text-sm font-medium">contact@bikawo.com</p>
                    </div>
                  </div>
                </a>
              </div>

              {/* Social Links */}
              <div className="flex space-x-3">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20 hover:bg-primary hover:border-primary hover:scale-110 transition-all duration-300"
                      aria-label={social.name}
                    >
                      <IconComponent className="w-4 h-4 text-white group-hover:text-white transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Links Grid */}
            <div className="lg:col-span-2">
              <div className="grid sm:grid-cols-3 gap-8">
                {footerSections.map((section) => (
                  <div key={section.title} className="space-y-4">
                    <h4 className="text-sm font-semibold text-white uppercase tracking-wider">{section.title}</h4>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.name}>
                          <Link
                            to={link.href}
                            className="text-white/60 hover:text-white hover:translate-x-1 transition-all duration-300 text-sm inline-block"
                          >
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8 text-white/50 text-sm">
                <span>{t('footer.copyright')}</span>
                <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2">
                  <Link to="/politique-confidentialite" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
                  <Link to="/cgu" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
                  <Link to="/information-consommateurs" className="hover:text-white transition-colors">Information consommateurs</Link>
                  <Link to="/mentions-legales" className="hover:text-white transition-colors">{t('footer.legal')}</Link>
                  <Link to="/politique-cookies" className="hover:text-white transition-colors">Politique de cookies</Link>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('openCookieSettings'))}
                    className="hover:text-white transition-colors"
                  >
                    Gérer mes cookies
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/60 text-sm">{t('footer.support24')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;