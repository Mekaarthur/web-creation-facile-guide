import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOComponent from "@/components/SEOComponent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, User, ArrowLeft, Share2, BookOpen } from "lucide-react";
import { generateArticleStructuredData } from "@/utils/seoData";
import { ReadingProgress } from "@/components/blog/ReadingProgress";

const blogContent = {
  "10-signes-charge-mentale": {
    title: "10 signes que vous souffrez de charge mentale",
    category: "Bien-être",
    readTime: "8 min",
    publishedAt: "2024-01-15",
    author: "Dr. Marie Dubois",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    content: `
      <h2>Qu'est-ce que la charge mentale ?</h2>
      <p>La charge mentale représente tout ce travail invisible de planification, d'organisation et de coordination qui incombe souvent aux femmes dans la gestion du foyer et de la famille. Cette préoccupation constante peut devenir épuisante.</p>
      
      <h2>Les 10 signes révélateurs</h2>
      
      <h3>1. Fatigue constante malgré le repos</h3>
      <p>Vous vous réveillez déjà fatigué(e), même après une nuit complète de sommeil. Votre cerveau ne semble jamais s'arrêter de fonctionner.</p>
      
      <h3>2. Difficulté à prioriser les tâches</h3>
      <p>Tout semble urgent et important. Vous avez du mal à distinguer ce qui peut attendre de ce qui doit être fait immédiatement.</p>
      
      <h3>3. Sentiment d'être toujours en retard</h3>
      <p>Malgré tous vos efforts, vous avez l'impression de courir constamment après le temps.</p>
      
      <h3>4. Irritabilité face aux demandes</h3>
      <p>Les sollicitations des membres de votre famille vous agacent plus facilement qu'avant.</p>
      
      <h3>5. Oublis fréquents</h3>
      <p>Vous oubliez des rendez-vous, des anniversaires ou des tâches importantes que vous gériez facilement auparavant.</p>
      
      <h3>6. Culpabilité permanente</h3>
      <p>Vous vous sentez coupable de ne pas en faire assez, même quand vous donnez le maximum.</p>
      
      <h3>7. Anticipation excessive</h3>
      <p>Vous pensez constamment à ce qui doit être préparé, organisé ou prévu à l'avance.</p>
      
      <h3>8. Difficultés de concentration</h3>
      <p>Votre attention est dispersée entre mille préoccupations, ce qui nuit à votre efficacité.</p>
      
      <h3>9. Sensation d'isolement</h3>
      <p>Vous avez l'impression que personne ne comprend l'ampleur de ce que vous gérez au quotidien.</p>
      
      <h3>10. Perte du temps pour soi</h3>
      <p>Vous ne trouvez plus de moments pour vos loisirs, vos passions ou simplement pour vous détendre.</p>
      
      <h2>Comment s'en sortir ?</h2>
      
      <p><strong>Déléguer est la clé.</strong> Chez BIKAWO, nous comprenons cette problématique. Nos services permettent de transférer une partie de cette charge mentale à des professionnels qualifiés :</p>
      
      <ul>
        <li><strong>Aide ménagère :</strong> Ne plus penser au ménage, lessive, repassage</li>
        <li><strong>Garde d'enfants :</strong> Déléguer la surveillance et les activités</li>
        <li><strong>Assistance administrative :</strong> Gérer les papiers et démarches</li>
        <li><strong>Courses et commission :</strong> Plus besoin de planifier les achats</li>
      </ul>
      
      <p>L'avantage BIKAWO ? <strong>Un seul interlocuteur</strong> pour plusieurs services, ce qui réduit encore votre charge mentale de coordination.</p>
      
      <h2>Conclusion</h2>
      
      <p>Reconnaître la charge mentale est le premier pas vers la libération. N'hésitez pas à demander de l'aide, que ce soit à votre entourage ou à des professionnels. Votre bien-être en dépend.</p>
    `
  },
  "guide-deleguer-sans-culpabiliser": {
    title: "Guide complet pour déléguer sans culpabiliser",
    category: "Organisation",
    readTime: "12 min",
    publishedAt: "2024-01-10",
    author: "Sophie Martin",
    image: "/lovable-uploads/7289c795-0ba4-4e3f-86dc-cd0e3310a306.png",
    content: `
      <h2>Pourquoi culpabilisons-nous de déléguer ?</h2>
      
      <p>La culpabilité de déléguer vient souvent de croyances limitantes :</p>
      <ul>
        <li>"Je dois tout faire moi-même"</li>
        <li>"Personne ne le fera aussi bien que moi"</li>
        <li>"C'est de la paresse de faire appel à quelqu'un"</li>
        <li>"C'est un luxe que je ne mérite pas"</li>
      </ul>
      
      <h2>Changer de perspective</h2>
      
      <h3>Déléguer = Investir</h3>
      <p>Voir la délégation comme un investissement plutôt qu'une dépense. Vous investissez dans :</p>
      <ul>
        <li>Votre temps libre</li>
        <li>Votre santé mentale</li>
        <li>Votre carrière</li>
        <li>Vos relations familiales</li>
      </ul>
      
      <h3>L'effet domino positif</h3>
      <p>Quand vous déléguez :</p>
      <ul>
        <li>Vous créez de l'emploi</li>
        <li>Vous êtes plus disponible pour vos proches</li>
        <li>Vous pouvez vous concentrer sur vos priorités</li>
        <li>Vous montrez l'exemple à vos enfants</li>
      </ul>
      
      <h2>Le guide pratique en 7 étapes</h2>
      
      <h3>Étape 1 : Faire le bilan</h3>
      <p>Listez toutes vos tâches hebdomadaires et estimez le temps passé sur chacune.</p>
      
      <h3>Étape 2 : Identifier les tâches déléguables</h3>
      <p>Quelles tâches peuvent être faites par quelqu'un d'autre ?</p>
      <ul>
        <li>Ménage</li>
        <li>Repassage</li>
        <li>Courses</li>
        <li>Garde d'enfants</li>
        <li>Jardinage</li>
        <li>Démarches administratives</li>
      </ul>
      
      <h3>Étape 3 : Calculer le coût/bénéfice</h3>
      <p>Comparez le coût du service au bénéfice en temps et bien-être.</p>
      
      <h3>Étape 4 : Commencer petit</h3>
      <p>Déléguez d'abord une tâche simple pour vous habituer progressivement.</p>
      
      <h3>Étape 5 : Choisir le bon prestataire</h3>
      <p>Critères essentiels :</p>
      <ul>
        <li>Références vérifiées</li>
        <li>Assurance professionnelle</li>
        <li>Feeling personnel</li>
        <li>Flexibilité</li>
      </ul>
      
      <h3>Étape 6 : Définir clairement les attentes</h3>
      <p>Expliquez précisément ce que vous attendez, sans micro-management.</p>
      
      <h3>Étape 7 : Lâcher prise</h3>
      <p>Acceptez que ce soit fait différemment, pas forcément moins bien.</p>
      
      <h2>Les bénéfices de la délégation</h2>
      
      <h3>Pour vous</h3>
      <ul>
        <li>Réduction du stress</li>
        <li>Plus de temps de qualité</li>
        <li>Meilleur équilibre vie pro/perso</li>
        <li>Opportunités de développement personnel</li>
      </ul>
      
      <h3>Pour votre famille</h3>
      <ul>
        <li>Parent plus détendu</li>
        <li>Plus de temps ensemble</li>
        <li>Modèle d'organisation efficace</li>
      </ul>
      
      <h2>Témoignages clients BIKAWO</h2>
      
      <blockquote>
        <p>"Au début, j'étais réticente. Maintenant, je ne peux plus m'en passer. Sophie s'occupe du ménage et garde ma fille le mercredi. J'ai retrouvé du temps pour moi et ma famille."</p>
        <cite>- Marie, maman de 2 enfants</cite>
      </blockquote>
      
      <h2>Comment BIKAWO facilite la délégation</h2>
      
      <ul>
        <li><strong>Un seul contact :</strong> Évite la multiplication des interlocuteurs</li>
        <li><strong>Services combinés :</strong> Ménage + garde + aide administrative</li>
        <li><strong>Professionnels vérifiés :</strong> Tranquillité d'esprit garantie</li>
        <li><strong>Flexibilité :</strong> Adaptation à vos besoins changeants</li>
      </ul>
      
      <p>Déléguer n'est pas un échec, c'est une stratégie gagnante pour tous.</p>
    `
  },
  "cout-aide-menagere-vs-temps": {
    title: "Coût réel d'une aide ménagère vs votre temps",
    category: "Économie",
    readTime: "10 min",
    publishedAt: "2024-01-05",
    author: "Jean Dupont",
    image: "/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png",
    content: `
      <h2>L'équation temps = argent dans le contexte familial</h2>
      
      <p>Combien vaut réellement votre temps ? Cette question est cruciale pour prendre une décision éclairée sur l'embauche d'une aide ménagère.</p>
      
      <h2>Calcul du coût horaire réel d'une aide ménagère</h2>
      
      <h3>Tarifs moyens en France (2024)</h3>
      <ul>
        <li><strong>Aide ménagère indépendante :</strong> 12-18€/heure</li>
        <li><strong>Société de services :</strong> 20-25€/heure</li>
        <li><strong>Avec crédit d'impôt (50%) :</strong> 6-12,50€/heure</li>
      </ul>
      
      <h3>Exemple concret</h3>
      <p>Pour 4 heures de ménage par semaine :</p>
      <ul>
        <li>Coût brut : 80€/semaine (20€/h)</li>
        <li>Coût après crédit d'impôt : 40€/semaine</li>
        <li>Coût mensuel réel : 160€</li>
        <li>Coût annuel : 1 920€</li>
      </ul>
      
      <h2>Calcul de la valeur de votre temps</h2>
      
      <h3>Méthode 1 : Salaire horaire professionnel</h3>
      <p>Si vous gagnez 3 000€ net/mois pour 35h/semaine :</p>
      <ul>
        <li>Salaire horaire : 21,43€/heure</li>
        <li>4h de ménage = 85,72€ de votre temps</li>
        <li>Économie : 45,72€/semaine en délégant</li>
      </ul>
      
      <h3>Méthode 2 : Temps libre valorisé</h3>
      <p>Même sans revenus supplémentaires, votre temps libre a une valeur :</p>
      <ul>
        <li>Repos et récupération</li>
        <li>Relations familiales</li>
        <li>Loisirs et épanouissement</li>
        <li>Formation et développement</li>
      </ul>
      
      <h2>Analyse coût/bénéfice détaillée</h2>
      
      <h3>Coûts cachés du "fait maison"</h3>
      <ul>
        <li><strong>Fatigue physique :</strong> Impact sur la productivité</li>
        <li><strong>Stress :</strong> Coûts de santé à long terme</li>
        <li><strong>Opportunités manquées :</strong> Revenus supplémentaires non générés</li>
        <li><strong>Relations tendues :</strong> Disputes familiales sur les tâches</li>
      </ul>
      
      <h3>Bénéfices quantifiables de la délégation</h3>
      <ul>
        <li><strong>4h récupérées/semaine :</strong> 208h/an</li>
        <li><strong>Possibilité de revenus extra :</strong> Freelance, cours particuliers</li>
        <li><strong>Investissement formation :</strong> Augmentation de salaire future</li>
        <li><strong>Bien-être familial :</strong> Relations améliorées</li>
      </ul>
      
      <h2>Études de cas réels</h2>
      
      <h3>Cas 1 : Sarah, cadre supérieure</h3>
      <ul>
        <li>Salaire : 4 500€ net/mois</li>
        <li>Temps ménage : 6h/semaine</li>
        <li>Coût aide ménagère : 60€/semaine après crédit</li>
        <li>Valeur temps libéré : 193€/semaine</li>
        <li><strong>Bénéfice net : 133€/semaine</strong></li>
      </ul>
      
      <h3>Cas 2 : Marc, auto-entrepreneur</h3>
      <ul>
        <li>Revenus variables : 15-30€/heure</li>
        <li>Peut facturer 4h supplémentaires si libéré du ménage</li>
        <li>Revenus supplémentaires : 60-120€/semaine</li>
        <li>Coût aide ménagère : 40€/semaine</li>
        <li><strong>Bénéfice net : 20-80€/semaine</strong></li>
      </ul>
      
      <h3>Cas 3 : Julie, en congé parental</h3>
      <ul>
        <li>Pas de revenus immédiats</li>
        <li>Utilise le temps pour formation en ligne</li>
        <li>Investissement dans l'avenir professionnel</li>
        <li>Amélioration du bien-être familial</li>
        <li><strong>ROI à long terme élevé</strong></li>
      </ul>
      
      <h2>Facteurs à considérer dans votre calcul</h2>
      
      <h3>Situation professionnelle</h3>
      <ul>
        <li>Possibilité d'heures supplémentaires</li>
        <li>Opportunités de missions freelance</li>
        <li>Projets personnels générateurs de revenus</li>
      </ul>
      
      <h3>Situation familiale</h3>
      <ul>
        <li>Nombre d'enfants</li>
        <li>Âge des enfants</li>
        <li>Présence du conjoint</li>
        <li>Soutien familial disponible</li>
      </ul>
      
      <h3>Objectifs personnels</h3>
      <ul>
        <li>Projets créatifs</li>
        <li>Formation et développement</li>
        <li>Sport et bien-être</li>
        <li>Relations sociales</li>
      </ul>
      
      <h2>Optimiser le rapport qualité/prix</h2>
      
      <h3>Choisir les bonnes tâches à déléguer</h3>
      <p>Priorisez selon :</p>
      <ul>
        <li>Temps nécessaire</li>
        <li>Pénibilité de la tâche</li>
        <li>Fréquence requise</li>
        <li>Expertise nécessaire</li>
      </ul>
      
      <h3>L'avantage BIKAWO : services combinés</h3>
      <ul>
        <li><strong>Économies d'échelle :</strong> Même prestataire, plusieurs services</li>
        <li><strong>Réduction frais de déplacement :</strong> Optimisation des trajets</li>
        <li><strong>Relation de confiance :</strong> Un seul interlocuteur à gérer</li>
        <li><strong>Flexibilité :</strong> Adaptation selon vos besoins</li>
      </ul>
      
      <h2>Conclusion : L'investissement gagnant</h2>
      
      <p>Dans la majorité des cas, déléguer les tâches ménagères est un <strong>investissement rentable</strong> :</p>
      
      <ul>
        <li>Financièrement (possibilité de revenus supplémentaires)</li>
        <li>Personnellement (bien-être et épanouissement)</li>
        <li>Familialement (relations améliorées)</li>
        <li>Professionnellement (focus sur les priorités)</li>
      </ul>
      
      <p>Ne considérez plus l'aide ménagère comme un coût, mais comme un <strong>investissement dans votre qualité de vie</strong>.</p>
    `
  },
  "selectionner-meilleure-garde-enfants": {
    title: "Sélectionner la meilleure garde d'enfants",
    category: "Parentalité",
    readTime: "15 min",
    publishedAt: "2024-01-01",
    author: "Claire Rousseau",
    image: "/lovable-uploads/1ac09068-74a1-4d44-bdc6-d342fcb10cd4.png",
    content: `
      <h2>Les différents types de garde d'enfants</h2>
      
      <h3>Garde à domicile</h3>
      <ul>
        <li><strong>Avantages :</strong> Enfant dans son environnement, horaires flexibles</li>
        <li><strong>Inconvénients :</strong> Coût plus élevé, isolement possible</li>
        <li><strong>Ideal pour :</strong> Jeunes enfants, horaires atypiques</li>
      </ul>
      
      <h3>Assistante maternelle</h3>
      <ul>
        <li><strong>Avantages :</strong> Cadre familial, coût modéré, socialisation</li>
        <li><strong>Inconvénients :</strong> Moins de flexibilité, congés imposés</li>
        <li><strong>Ideal pour :</strong> Enfants de 2 mois à 3 ans</li>
      </ul>
      
      <h3>Crèche collective</h3>
      <ul>
        <li><strong>Avantages :</strong> Socialisation, équipe pluridisciplinaire, coût réduit</li>
        <li><strong>Inconvénients :</strong> Places limitées, rigidité horaires</li>
        <li><strong>Ideal pour :</strong> Enfants sociables, horaires réguliers</li>
      </ul>
      
      <h2>Critères de sélection essentiels</h2>
      
      <h3>1. Qualifications et expérience</h3>
      <ul>
        <li>Diplômes (CAP Petite Enfance, auxiliaire puériculture)</li>
        <li>Formations complémentaires (premiers secours, etc.)</li>
        <li>Années d'expérience avec enfants de l'âge du vôtre</li>
        <li>Références vérifiables d'anciens employeurs</li>
      </ul>
      
      <h3>2. Approche éducative</h3>
      <ul>
        <li>Philosophie d'éducation compatible</li>
        <li>Gestion des émotions et conflits</li>
        <li>Activités proposées selon l'âge</li>
        <li>Stimulation du développement</li>
      </ul>
      
      <h3>3. Aspects pratiques</h3>
      <ul>
        <li>Disponibilité horaire</li>
        <li>Flexibilité pour urgences</li>
        <li>Gestion des repas et sorties</li>
        <li>Politique en cas de maladie</li>
      </ul>
      
      <h3>4. Feeling et communication</h3>
      <ul>
        <li>Connexion naturelle avec votre enfant</li>
        <li>Style de communication clair</li>
        <li>Réactivité aux messages</li>
        <li>Capacité d'adaptation</li>
      </ul>
      
      <h2>Questions essentielles à poser</h2>
      
      <h3>Sur l'expérience</h3>
      <ul>
        <li>"Décrivez-moi une journée type avec un enfant de l'âge du mien"</li>
        <li>"Comment gérez-vous les crises et les pleurs ?"</li>
        <li>"Quelle est votre approche pour l'apprentissage de la propreté ?"</li>
        <li>"Avez-vous déjà géré des situations d'urgence ?"</li>
      </ul>
      
      <h3>Sur l'organisation</h3>
      <ul>
        <li>"Comment organisez-vous les siestes et repas ?"</li>
        <li>"Quelles activités proposez-vous par mauvais temps ?"</li>
        <li>"Comment communiquez-vous avec les parents ?"</li>
        <li>"Que faites-vous en cas de votre propre maladie ?"</li>
      </ul>
      
      <h3>Sur la sécurité</h3>
      <ul>
        <li>"Quelles sont vos règles de sécurité à la maison ?"</li>
        <li>"Comment sécurisez-vous les sorties (parc, école) ?"</li>
        <li>"Connaissez-vous les gestes de premiers secours ?"</li>
        <li>"Avez-vous une assurance responsabilité civile ?"</li>
      </ul>
      
      <h2>Signaux d'alarme à éviter</h2>
      
      <h3>Lors de l'entretien</h3>
      <ul>
        <li>Réticence à fournir des références</li>
        <li>Réponses évasives sur l'expérience</li>
        <li>Approche rigide sans adaptation possible</li>
        <li>Manque d'intérêt pour votre enfant</li>
      </ul>
      
      <h3>Signaux comportementaux</h3>
      <ul>
        <li>Interaction forcée ou maladroite avec l'enfant</li>
        <li>Impatience face aux questions</li>
        <li>Critiques des anciens employeurs</li>
        <li>Promesses irréalistes</li>
      </ul>
      
      <h2>La période d'essai : cruciale</h2>
      
      <h3>Que observer ?</h3>
      <ul>
        <li><strong>Adaptation de l'enfant :</strong> Pleurs, appétit, sommeil</li>
        <li><strong>Communication :</strong> Retours quotidiens précis</li>
        <li><strong>Évolution :</strong> Développement et acquisitions</li>
        <li><strong>Votre ressenti :</strong> Confiance et sérénité</li>
      </ul>
      
      <h3>Durée recommandée</h3>
      <ul>
        <li><strong>Garde occasionnelle :</strong> 2-3 séances</li>
        <li><strong>Garde régulière :</strong> 2-4 semaines</li>
        <li><strong>Garde à temps plein :</strong> 1-2 mois</li>
      </ul>
      
      <h2>Aspects légaux et administratifs</h2>
      
      <h3>Documents indispensables</h3>
      <ul>
        <li>Contrat de travail détaillé</li>
        <li>Attestation d'assurance responsabilité civile</li>
        <li>Copie des diplômes et formations</li>
        <li>Certificat médical d'aptitude</li>
        <li>Extrait de casier judiciaire (garde à domicile)</li>
      </ul>
      
      <h3>Clauses importantes du contrat</h3>
      <ul>
        <li>Horaires précis et majoration heures sup</li>
        <li>Congés et jours fériés</li>
        <li>Procédure en cas de maladie (enfant/garde)</li>
        <li>Conditions de rupture du contrat</li>
        <li>Responsabilités en cas d'accident</li>
      </ul>
      
      <h2>Maintenir une bonne relation</h2>
      
      <h3>Communication régulière</h3>
      <ul>
        <li>Points hebdomadaires sur l'évolution</li>
        <li>Partage des observations importantes</li>
        <li>Feedback constructif et encouragements</li>
        <li>Ajustements selon les besoins</li>
      </ul>
      
      <h3>Reconnaissance du travail</h3>
      <ul>
        <li>Remerciements pour le travail bien fait</li>
        <li>Prime exceptionnelle si satisfaction</li>
        <li>Recommandations à d'autres familles</li>
        <li>Formations complémentaires si besoin</li>
      </ul>
      
      <h2>L'approche BIKAWO : garde d'enfants intégrée</h2>
      
      <h3>Services combinés</h3>
      <p>Notre approche unique :</p>
      <ul>
        <li><strong>Garde + ménage :</strong> Efficacité optimisée</li>
        <li><strong>Garde + courses :</strong> Préparation des repas</li>
        <li><strong>Garde + aide aux devoirs :</strong> Suivi scolaire</li>
      </ul>
      
      <h3>Sélection rigoureuse</h3>
      <ul>
        <li>Processus de recrutement en 5 étapes</li>
        <li>Vérification approfondie des références</li>
        <li>Formation continue de nos intervenants</li>
        <li>Suivi qualité régulier</li>
      </ul>
      
      <h3>Avantages pour les parents</h3>
      <ul>
        <li><strong>Un seul interlocuteur :</strong> Simplification administrative</li>
        <li><strong>Remplacement garanti :</strong> Pas de jour sans solution</li>
        <li><strong>Évolution des services :</strong> Adaptation selon l'âge</li>
        <li><strong>Tarifs préférentiels :</strong> Économies sur services combinés</li>
      </ul>
      
      <h2>Checklist finale avant embauche</h2>
      
      <div class="checklist">
        <h3>Vérifications effectuées :</h3>
        <ul>
          <li>☐ Références contactées et positives</li>
          <li>☐ Documents légaux vérifiés</li>
          <li>☐ Période d'essai concluante</li>
          <li>☐ Enfant à l'aise avec la personne</li>
          <li>☐ Communication fluide établie</li>
          <li>☐ Contrat signé et conditions claires</li>
          <li>☐ Plan B en cas d'absence défini</li>
        </ul>
      </div>
      
      <h2>Conclusion</h2>
      
      <p>Choisir une garde d'enfants est une décision majeure qui impacte le bien-être de toute la famille. Prenez le temps nécessaire, faites confiance à votre instinct et n'hésitez pas à poser toutes vos questions.</p>
      
      <p>Chez BIKAWO, nous accompagnons les familles dans cette démarche cruciale en proposant des professionnels sélectionnés et formés, avec la possibilité de combiner plusieurs services pour simplifier votre organisation.</p>
    `
  }
};

const BlogPost = () => {
  const { slug } = useParams();
  const post = slug ? blogContent[slug as keyof typeof blogContent] : null;

  if (!post) {
    return (
      <div className="min-h-screen">
        <SEOComponent 
          title="Article non trouvé | Bikawo"
          description="L'article que vous cherchez n'existe pas ou a été supprimé."
        />
        <Navbar />
        <div className="pt-20 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Article non trouvé</h1>
            <p className="text-muted-foreground mb-8">L'article que vous cherchez n'existe pas ou a été supprimé.</p>
            <Button asChild>
              <Link to="/blog">Retour au blog</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ReadingProgress />
      <SEOComponent 
        title={`${post.title} | Blog Bikawo`}
        description={`${post.title} - Découvrez nos conseils pour réduire la charge mentale et organiser votre quotidien familial.`}
        keywords={`${post.category.toLowerCase()}, charge mentale, ${post.title.toLowerCase()}, délégation, organisation familiale`}
        type="article"
        publishedTime={post.publishedAt}
        author={post.author}
        structuredData={generateArticleStructuredData({
          title: post.title,
          description: `${post.title} - Conseils pratiques pour un quotidien plus serein`,
          author: post.author,
          publishedAt: post.publishedAt,
          image: post.image,
          slug: slug || ''
        })}
      />
      <Navbar />
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-subtle">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" asChild className="mb-6">
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au blog
              </Link>
            </Button>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{post.category}</Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  {post.readTime}
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                {post.title}
              </h1>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="w-4 h-4 mr-1" />
                  {post.author}
                  <Calendar className="w-4 h-4 ml-4 mr-1" />
                  {new Date(post.publishedAt).toLocaleDateString('fr-FR')}
                </div>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="aspect-video mb-12 overflow-hidden rounded-lg">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <article className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-muted/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Prêt à simplifier votre quotidien ?
              </h3>
              <p className="text-muted-foreground mb-6">
                Découvrez nos services personnalisés et libérez-vous de la charge mentale
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link to="/services">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Découvrir nos services
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact">Demander un devis gratuit</Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default BlogPost;