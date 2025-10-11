import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SavedFilter {
  id: string;
  user_id: string;
  filter_name: string;
  filter_type: string;
  filter_config: any;
  is_favorite: boolean;
  created_at: string;
}

export const useSavedFilters = (filterType: string) => {
  const queryClient = useQueryClient();

  const { data: filters, isLoading } = useQuery({
    queryKey: ['saved-filters', filterType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('filter_type', filterType)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedFilter[];
    },
  });

  const saveFilter = useMutation({
    mutationFn: async ({ name, config, isFavorite }: { name: string; config: any; isFavorite?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('saved_filters')
        .insert([{
          user_id: user.id,
          filter_name: name,
          filter_type: filterType,
          filter_config: config,
          is_favorite: isFavorite || false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', filterType] });
      toast({
        title: "Filtre sauvegardé",
        description: "Le filtre a été enregistré avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFilter = useMutation({
    mutationFn: async (filterId: string) => {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', filterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', filterType] });
      toast({
        title: "Filtre supprimé",
        description: "Le filtre a été supprimé avec succès",
      });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ filterId, isFavorite }: { filterId: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('saved_filters')
        .update({ is_favorite: isFavorite })
        .eq('id', filterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', filterType] });
    },
  });

  return {
    filters: filters || [],
    isLoading,
    saveFilter,
    deleteFilter,
    toggleFavorite,
  };
};
