import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface BikawoCartItem {
  id: string;
  serviceName: string;
  serviceCategory: 'kids' | 'maison' | 'vie' | 'travel' | 'animals' | 'seniors' | 'pro' | 'plus';
  packageTitle: string;
  price: number;
  quantity: number;
  timeSlot: {
    date: Date;
    startTime: string;
    endTime: string;
  };
  address: string;
  description?: string;
  notes?: string;
}

export interface CartCompatibilityRule {
  category: string;
  conflictsWith: string[];
  reason: string;
}

export interface SeparatedBooking {
  id: string;
  items: BikawoCartItem[];
  totalPrice: number;
  conflictReason?: string;
}

// Règles de compatibilité entre services
const COMPATIBILITY_RULES: CartCompatibilityRule[] = [
  {
    category: 'kids',
    conflictsWith: ['maison', 'seniors'],
    reason: 'La garde d\'enfants nécessite une attention exclusive et ne peut être combinée avec d\'autres services au même créneau'
  },
  {
    category: 'seniors',
    conflictsWith: ['kids', 'maison'],
    reason: 'L\'aide aux seniors nécessite une attention particulière incompatible avec d\'autres services simultanés'
  },
  {
    category: 'travel',
    conflictsWith: ['kids', 'maison', 'seniors'],
    reason: 'Les services de voyage ne peuvent être combinés avec des services à domicile'
  }
];

export const useBikawoCart = () => {
  const [cartItems, setCartItems] = useState<BikawoCartItem[]>([]);
  const [separatedBookings, setSeparatedBookings] = useState<SeparatedBooking[]>([]);
  const { toast } = useToast();

  // Charger le panier depuis localStorage au montage avec vérification expiration (30 min)
  useEffect(() => {
    const stored = localStorage.getItem('bikawo-cart');
    const timestamp = localStorage.getItem('bikawo-cart-timestamp');
    
    if (stored && timestamp) {
      const now = Date.now();
      const cartAge = now - parseInt(timestamp);
      const THIRTY_MINUTES = 30 * 60 * 1000;
      
      // Vérifier si le panier a plus de 30 minutes
      if (cartAge > THIRTY_MINUTES) {
        console.log('Panier expiré (> 30 min), suppression');
        localStorage.removeItem('bikawo-cart');
        localStorage.removeItem('bikawo-cart-timestamp');
        return;
      }
      
      try {
        const parsed = JSON.parse(stored);
        // Normaliser les dates
        const items = parsed.map((item: any) => ({
          ...item,
          timeSlot: {
            ...item.timeSlot,
            date: new Date(item.timeSlot.date)
          }
        }));
        setCartItems(items);
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
        localStorage.removeItem('bikawo-cart');
        localStorage.removeItem('bikawo-cart-timestamp');
      }
    }
  }, []);

  // Écouter les changements de panier (séparé pour éviter les re-renders)
  useEffect(() => {
    const handleCartUpdate = () => {
      const stored = localStorage.getItem('bikawo-cart');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const items = parsed.map((item: any) => ({
            ...item,
            timeSlot: {
              ...item.timeSlot,
              date: new Date(item.timeSlot.date)
            }
          }));
          setCartItems(items);
        } catch (error) {
          console.error('Erreur lors du chargement du panier:', error);
        }
      } else {
        // Si le localStorage est vide, vider le panier
        setCartItems([]);
        setSeparatedBookings([]);
      }
    };

    window.addEventListener('bikawo-cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);
    
    return () => {
      window.removeEventListener('bikawo-cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  // Sauvegarder dans localStorage avec timestamp
  const saveToStorage = useCallback((items: BikawoCartItem[]) => {
    localStorage.setItem('bikawo-cart', JSON.stringify(items));
    localStorage.setItem('bikawo-cart-timestamp', Date.now().toString());
    // Utiliser setTimeout pour éviter les updates pendant le render
    setTimeout(() => {
      window.dispatchEvent(new Event('bikawo-cart-updated'));
    }, 0);
  }, []);

  // Vérifier la compatibilité entre services
  const checkServiceCompatibility = (newItem: BikawoCartItem, existingItems: BikawoCartItem[]): {
    isCompatible: boolean;
    conflicts: string[];
    canAddToExisting: boolean;
  } => {
    const conflicts: string[] = [];
    let canAddToExisting = true;

    // Vérifier les conflits de catégories
    const conflictingRule = COMPATIBILITY_RULES.find(rule => rule.category === newItem.serviceCategory);
    
    if (conflictingRule) {
      const hasConflictingServices = existingItems.some(item => 
        conflictingRule.conflictsWith.includes(item.serviceCategory) &&
        isTimeSlotConflicting(newItem.timeSlot, item.timeSlot)
      );

      if (hasConflictingServices) {
        conflicts.push(conflictingRule.reason);
        canAddToExisting = false;
      }
    }

    // Vérifier les créneaux horaires pour la même adresse
    const sameAddressConflict = existingItems.some(item => 
      item.address === newItem.address &&
      isTimeSlotConflicting(newItem.timeSlot, item.timeSlot) &&
      item.serviceCategory !== newItem.serviceCategory
    );

    if (sameAddressConflict) {
      conflicts.push('Créneaux horaires en conflit à la même adresse');
      canAddToExisting = false;
    }

    return {
      isCompatible: conflicts.length === 0,
      conflicts,
      canAddToExisting
    };
  };

  // Vérifier si deux créneaux horaires se chevauchent
  const isTimeSlotConflicting = (slot1: BikawoCartItem['timeSlot'], slot2: BikawoCartItem['timeSlot']): boolean => {
    const d1 = (slot1.date instanceof Date) ? slot1.date : new Date(slot1.date as any);
    const d2 = (slot2.date instanceof Date) ? slot2.date : new Date(slot2.date as any);
    const date1 = d1.toDateString();
    const date2 = d2.toDateString();
    if (date1 !== date2) return false;
    const start1 = new Date(`${date1} ${slot1.startTime}`);
    const end1 = new Date(`${date1} ${slot1.endTime}`);
    const start2 = new Date(`${date2} ${slot2.startTime}`);
    const end2 = new Date(`${date2} ${slot2.endTime}`);
    return (start1 < end2 && start2 < end1);
  };

  // Générer les réservations séparées
  const generateSeparatedBookings = useCallback((items: BikawoCartItem[]) => {
    const bookings: SeparatedBooking[] = [];
    const processedItems = new Set<string>();

    items.forEach((item) => {
      if (processedItems.has(item.id)) return;

      // Créer une nouvelle réservation avec cet item
      const compatibleItems = [item];
      processedItems.add(item.id);

      // Chercher d'autres items compatibles
      items.forEach((otherItem) => {
        if (processedItems.has(otherItem.id)) return;

        const compatibility = checkServiceCompatibility(otherItem, compatibleItems);
        if (compatibility.canAddToExisting) {
          compatibleItems.push(otherItem);
          processedItems.add(otherItem.id);
        }
      });

      const totalPrice = compatibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      bookings.push({
        id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        items: compatibleItems,
        totalPrice,
        conflictReason: compatibleItems.length === 1 && items.length > 1 ? 
          'Service séparé en raison d\'incompatibilités' : undefined
      });
    });

    setSeparatedBookings(bookings);
  }, []);

  // Ajouter un item au panier avec validation
  const addToCart = useCallback((item: Omit<BikawoCartItem, 'id'> | Omit<BikawoCartItem, 'id' | 'quantity'>) => {
    // Validation : date future
    const itemDate = new Date(item.timeSlot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (itemDate < today) {
      toast({
        title: "❌ Date invalide",
        description: "La date de réservation doit être dans le futur",
        variant: "destructive",
      });
      return;
    }

    // Validation : durée > 0
    const quantity = 'quantity' in item ? item.quantity : 1;
    if (quantity <= 0) {
      toast({
        title: "❌ Durée invalide",
        description: "La durée doit être supérieure à 0 heure",
        variant: "destructive",
      });
      return;
    }

    const newItem: BikawoCartItem = {
      ...item,
      id: `${item.serviceCategory}-${item.packageTitle}-${Date.now()}`,
      quantity,
    };

    const compatibility = checkServiceCompatibility(newItem, cartItems);

    if (!compatibility.isCompatible) {
      // Demander confirmation pour ajouter malgré les conflits
      toast({
        title: "⚠️ Incompatibilité détectée",
        description: `${compatibility.conflicts[0]}. Le service sera ajouté dans une réservation séparée.`,
        duration: 5000,
      });
    }

    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(
        existing => 
          existing.serviceName === item.serviceName && 
          existing.packageTitle === item.packageTitle &&
          existing.timeSlot.date.toDateString() === item.timeSlot.date.toDateString() &&
          existing.timeSlot.startTime === item.timeSlot.startTime &&
          existing.address === item.address
      );

      let updatedItems: BikawoCartItem[];

      if (existingItemIndex >= 0) {
        updatedItems = prev.map((existing, index) => 
          index === existingItemIndex 
            ? { ...existing, quantity: existing.quantity + 1 }
            : existing
        );
      } else {
        updatedItems = [...prev, newItem];
      }

      saveToStorage(updatedItems);
      generateSeparatedBookings(updatedItems);
      return updatedItems;
    });

    toast({
      title: compatibility.isCompatible ? "✅ Service ajouté" : "⚠️ Service ajouté (réservation séparée)",
      description: `${item.serviceName} ajouté${!compatibility.isCompatible ? ' dans une réservation séparée' : ''}.`,
      duration: 4000,
    });

    // Animer l'icône du panier
    setTimeout(() => {
      const cartButton = document.querySelector('[data-cart-indicator]');
      if (cartButton) {
        cartButton.classList.add('animate-bounce');
        setTimeout(() => cartButton.classList.remove('animate-bounce'), 1000);
      }
    }, 100);
  }, [cartItems, toast, saveToStorage, generateSeparatedBookings]);

  // Retirer un item du panier
  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prev => {
      const updatedItems = prev.filter(item => item.id !== itemId);
      saveToStorage(updatedItems);
      generateSeparatedBookings(updatedItems);
      return updatedItems;
    });

    toast({
      title: "Service retiré",
      description: "Le service a été retiré de votre panier",
    });
  }, [saveToStorage, generateSeparatedBookings, toast]);

  // Vider le panier
  const clearCart = useCallback(() => {
    setCartItems([]);
    setSeparatedBookings([]);
    localStorage.removeItem('bikawo-cart');
    localStorage.removeItem('bikawo-cart-timestamp');

    toast({
      title: "Panier vidé",
      description: "Tous les services ont été retirés de votre panier",
    });
  }, [toast]);

  // Obtenir le total du panier
  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  // Obtenir le nombre d'items
  const getCartItemsCount = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  // Obtenir le nombre de réservations séparées
  const getSeparatedBookingsCount = useCallback(() => {
    return separatedBookings.length;
  }, [separatedBookings]);

  // Vérifier si le panier contient des services incompatibles
  const hasIncompatibleServices = useCallback(() => {
    return separatedBookings.length > 1;
  }, [separatedBookings]);

  return {
    // État
    cartItems,
    separatedBookings,
    
    // Actions
    addToCart,
    removeFromCart,
    clearCart,
    
    // Getters
    getCartTotal,
    getCartItemsCount,
    getSeparatedBookingsCount,
    hasIncompatibleServices,
    
    // Utilitaires
    checkServiceCompatibility
  };
};