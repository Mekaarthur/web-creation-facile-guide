import { MessageCircle, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Services Assist",
      links: [
        { name: "Assist'Kids", href: "#services" },
        { name: "Assist'Maison", href: "#services" },
        { name: "Assist'Vie", href: "#services" },
        { name: "Assist'Travel", href: "#services" },
        { name: "Assist'Plus", href: "#services" },
        { name: "Assist'Pro", href: "#services" }
      ]
    },
    {
      title: "Entreprise",
      links: [
        { name: "À propos", href: "#about" },
        { name: "Notre équipe", href: "#" },
        { name: "Carrières", href: "#" },
        { name: "Presse", href: "#" }
      ]
    },
    {
      title: "Ressources",
      links: [
        { name: "FAQ", href: "#" },
        { name: "Documentation", href: "#" },
        { name: "Guides", href: "#" },
        { name: "Status", href: "#" }
      ]
    },
    {
      title: "Légal",
      links: [
        { name: "Mentions légales", href: "#" },
        { name: "Confidentialité", href: "#" },
        { name: "CGU", href: "#" },
        { name: "Cookies", href: "#" }
      ]
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", name: "Facebook" },
    { icon: Twitter, href: "#", name: "Twitter" },
    { icon: Linkedin, href: "#", name: "LinkedIn" },
    { icon: Instagram, href: "#", name: "Instagram" }
  ];

  return (
    <footer className="bg-foreground text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Assist'me</span>
            </div>
            
            <p className="text-white/80 max-w-md">
              Votre assistant familial de confiance en Île-de-France. 
              Nous vous accompagnons avec humanité pour un quotidien plus serein et harmonieux.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-white/90">+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-white/90">contact@assistme.fr</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-white/90">123 Rue de la Tech, Paris</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300"
                    aria-label={social.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-lg font-semibold text-white">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-white/70 hover:text-white transition-colors duration-300"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Restez informé de nos nouveautés
              </h4>
              <p className="text-white/70">
                Recevez nos conseils techniques et nos mises à jour directement dans votre boîte mail.
              </p>
            </div>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-6 py-2 bg-gradient-primary rounded-lg hover:shadow-glow transition-all duration-300 font-medium">
                S'abonner
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-white/70 text-sm">
              <span>© 2024 Assist'me. Tous droits réservés.</span>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
                <a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-white/70 text-sm">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Support disponible 24h/24</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;