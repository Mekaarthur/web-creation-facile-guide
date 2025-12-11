import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string | null;
  category: string;
  status: string;
  created_at: string;
  profile_photo_url: string | null;
  experience_years: number | null;
}

interface Column {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const columns: Column[] = [
  { 
    id: 'pending', 
    title: 'Nouvelles', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    icon: <Clock className="w-4 h-4" />
  },
  { 
    id: 'reviewing', 
    title: 'En révision', 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    icon: <Eye className="w-4 h-4" />
  },
  { 
    id: 'documents_pending', 
    title: 'Documents', 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    icon: <FileText className="w-4 h-4" />
  },
  { 
    id: 'approved', 
    title: 'Approuvées', 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: <CheckCircle className="w-4 h-4" />
  },
  { 
    id: 'rejected', 
    title: 'Refusées', 
    color: 'text-red-600', 
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    icon: <XCircle className="w-4 h-4" />
  },
];

export const ApplicationsKanban = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('id, first_name, last_name, email, phone, city, category, status, created_at, profile_photo_url, experience_years')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les candidatures",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      toast({
        title: "Statut mis à jour",
        description: `La candidature a été déplacée vers "${columns.find(c => c.id === newStatus)?.title}"`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    updateApplicationStatus(draggableId, destination.droppableId);
  };

  const getApplicationsByStatus = (status: string) => {
    return applications
      .filter(app => app.status === status)
      .filter(app => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          app.first_name.toLowerCase().includes(search) ||
          app.last_name.toLowerCase().includes(search) ||
          app.email.toLowerCase().includes(search) ||
          app.category.toLowerCase().includes(search) ||
          (app.city && app.city.toLowerCase().includes(search))
        );
      });
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      'menage': 'bg-blue-100 text-blue-700',
      'garde_enfants': 'bg-pink-100 text-pink-700',
      'aide_seniors': 'bg-purple-100 text-purple-700',
      'jardinage': 'bg-green-100 text-green-700',
      'bricolage': 'bg-orange-100 text-orange-700',
      'cours': 'bg-indigo-100 text-indigo-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des candidatures</h2>
          <p className="text-muted-foreground">Glissez-déposez pour changer le statut</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchApplications}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {columns.map(column => {
          const count = getApplicationsByStatus(column.id).length;
          return (
            <Card key={column.id} className={cn("border-0 shadow-sm", column.bgColor)}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={column.color}>{column.icon}</span>
                  <span className="text-sm font-medium">{column.title}</span>
                </div>
                <Badge variant="secondary" className="text-sm">{count}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {columns.map(column => (
            <div key={column.id} className="min-w-[280px]">
              <div className={cn("rounded-t-lg p-3 flex items-center gap-2", column.bgColor)}>
                <span className={column.color}>{column.icon}</span>
                <h3 className={cn("font-semibold", column.color)}>{column.title}</h3>
                <Badge variant="outline" className="ml-auto text-xs">
                  {getApplicationsByStatus(column.id).length}
                </Badge>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "min-h-[400px] p-2 rounded-b-lg border-2 border-t-0 transition-colors",
                      snapshot.isDraggingOver 
                        ? "border-primary/50 bg-primary/5" 
                        : "border-border bg-muted/30"
                    )}
                  >
                    {getApplicationsByStatus(column.id).map((app, index) => (
                      <Draggable key={app.id} draggableId={app.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "mb-2 cursor-grab active:cursor-grabbing border-0 shadow-sm hover:shadow-md transition-all",
                              snapshot.isDragging && "shadow-lg rotate-2 scale-105"
                            )}
                          >
                            <CardContent className="p-3 space-y-2">
                              {/* Header avec avatar et nom */}
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={app.profile_photo_url || undefined} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {app.first_name[0]}{app.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {app.first_name} {app.last_name}
                                  </p>
                                  <Badge className={cn("text-[10px] px-1.5 py-0", getCategoryBadgeColor(app.category))}>
                                    {app.category.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>

                              {/* Infos */}
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{app.email}</span>
                                </div>
                                {app.city && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" />
                                    <span>{app.city}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" />
                                  <span>{format(new Date(app.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                                </div>
                              </div>

                              {/* Experience */}
                              {app.experience_years && (
                                <div className="pt-1 border-t">
                                  <span className="text-xs text-muted-foreground">
                                    {app.experience_years} ans d'expérience
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {getApplicationsByStatus(column.id).length === 0 && (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                        <span>Aucune candidature</span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default ApplicationsKanban;
