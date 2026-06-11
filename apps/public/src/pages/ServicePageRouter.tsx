import { useParams } from 'react-router-dom';
import { servicesData } from '@/utils/servicesData';
import SubServicePage from './SubService';
import LocalServicePage from './LocalServicePage';

/**
 * Dispatcher pour /services/:category/:slug
 * Les deux jeux de valeurs sont disjoints :
 *   SubService  → category ∈ {kids, maison, vie, travel, animals, seniors, pro, plus}
 *   LocalService → category ∈ {menage-repassage, garde-enfants, aide-seniors, …}
 */
const ServicePageRouter = () => {
  const { category } = useParams<{ category: string }>();

  if (category && category in servicesData) {
    return <SubServicePage />;
  }
  return <LocalServicePage />;
};

export default ServicePageRouter;
