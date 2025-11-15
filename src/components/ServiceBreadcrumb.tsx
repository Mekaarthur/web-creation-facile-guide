import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface ServiceBreadcrumbProps {
  serviceName: string;
}

const ServiceBreadcrumb = ({ serviceName }: ServiceBreadcrumbProps) => {
  const location = useLocation();

  return (
    <div className="bg-muted/30 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center hover:text-primary transition-colors text-xs sm:text-sm">
                  <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden xs:inline">Accueil</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-xs sm:text-sm" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/services" className="hover:text-primary transition-colors text-xs sm:text-sm">
                  Services
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-xs sm:text-sm" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary font-medium text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
                {serviceName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};

export default ServiceBreadcrumb;