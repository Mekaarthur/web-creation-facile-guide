import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOComponent from "@/components/SEOComponent";
import BlogPageLayout from "@/components/BlogPageLayout";
import { seoStructuredData } from "@/utils/seoData";
import { useTranslation } from "react-i18next";
import { blogPosts } from "@/data/blogPosts";

const Blog = () => {
  const { t } = useTranslation();
  const categories = [
    t('blog.allCategories'),
    t('blog.wellness'),
    t('blog.organization'),
    t('blog.economy'),
    t('blog.parenting')
  ];
  
  const featuredPosts = blogPosts.filter(post => post.featured);
  const allPosts = blogPosts;

  return (
    <div className="min-h-screen bg-background">
      <SEOComponent 
        title="Blog Bikawo - Conseils pour réduire la charge mentale"
        description="Découvrez nos guides pratiques pour déléguer sans culpabiliser, organiser votre quotidien et réduire votre charge mentale familiale."
        keywords="charge mentale, délégation, organisation familiale, conseils parentaux, aide domestique, garde enfants, bien-être familial"
        structuredData={seoStructuredData.faq}
      />
      <Navbar />
      <div className="pt-16">
        <BlogPageLayout
          title="Magazine du bien-être familial"
          subtitle="Conseils pratiques, astuces d'organisation et guides pour simplifier votre quotidien et réduire votre charge mentale"
          categories={categories}
          featuredPosts={featuredPosts}
          allPosts={allPosts}
        />
      </div>
      <Footer />
    </div>
  );
};

export default Blog;