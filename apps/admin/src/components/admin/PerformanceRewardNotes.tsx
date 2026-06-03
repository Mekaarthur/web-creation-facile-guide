import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Save } from 'lucide-react';

interface PerformanceRewardNotesProps {
  rewardId: string;
  currentNotes?: string;
  providerName: string;
  onSave: (rewardId: string, notes: string) => Promise<void>;
}

const PerformanceRewardNotes: React.FC<PerformanceRewardNotesProps> = ({
  rewardId,
  currentNotes,
  providerName,
  onSave
}) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(currentNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(rewardId, notes);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          {currentNotes ? 'Modifier note' : 'Ajouter note'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notes sur la récompense</DialogTitle>
          <DialogDescription>
            Prestataire: {providerName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Ajoutez des notes sur cette récompense (raisons de refus, commentaires, etc.)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PerformanceRewardNotes;
