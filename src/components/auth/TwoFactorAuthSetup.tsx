import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldCheck, QrCode, Loader2, ShieldOff } from 'lucide-react';

type Step = 'idle' | 'setup' | 'verify';

export const TwoFactorAuthSetup = () => {
  const { toast } = useToast();
  const [step, setStep]           = useState<Step>('idle');
  const [factorId, setFactorId]   = useState('');
  const [qrCode, setQrCode]       = useState('');
  const [secret, setSecret]       = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otp, setOtp]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [checking, setChecking]   = useState(true);
  const [activeFactor, setActiveFactor] = useState<{ id: string; friendly_name: string } | null>(null);

  // Vérifier si un facteur TOTP est déjà actif
  useEffect(() => {
    checkExistingFactors();
  }, []);

  const checkExistingFactors = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const active = data.totp.find(f => f.status === 'verified');
      setActiveFactor(active ? { id: active.id, friendly_name: active.friendly_name || 'Authenticator' } : null);
    } catch {
      // silently ignore
    } finally {
      setChecking(false);
    }
  };

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('setup');
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const requestChallenge = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.challenge({ factorId });
      if (error) throw error;
      setChallengeId(data.id);
      setStep('verify');
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndActivate = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code: otp });
      if (error) throw error;
      toast({ title: '2FA activée ✅', description: 'Double authentification activée sur votre compte.' });
      setStep('idle');
      setOtp('');
      checkExistingFactors();
    } catch (e: any) {
      toast({ title: 'Code incorrect', description: 'Code OTP invalide ou expiré.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const disableFactor = async () => {
    if (!activeFactor) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: activeFactor.id });
      if (error) throw error;
      setActiveFactor(null);
      toast({ title: '2FA désactivée', description: 'La double authentification a été retirée de votre compte.' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Double authentification (2FA)
          </span>
          {activeFactor
            ? <Badge className="bg-green-100 text-green-800 border-green-300 gap-1"><ShieldCheck className="w-3 h-3" />Activée</Badge>
            : <Badge variant="outline" className="text-muted-foreground gap-1"><ShieldOff className="w-3 h-3" />Non activée</Badge>
          }
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ─ ÉTAT ACTIF ─ */}
        {activeFactor && step === 'idle' && (
          <>
            <Alert className="border-green-200 bg-green-50">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                La 2FA est active sur votre compte. Un code OTP vous sera demandé à chaque connexion.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={disableFactor} disabled={loading} className="gap-2 text-destructive hover:text-destructive border-destructive/30">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
              Désactiver la 2FA
            </Button>
          </>
        )}

        {/* ─ ÉTAT INACTIF ─ */}
        {!activeFactor && step === 'idle' && (
          <>
            <p className="text-sm text-muted-foreground">
              Ajoutez une couche de sécurité supplémentaire avec une application d'authentification
              (Google Authenticator, Authy, Microsoft Authenticator...).
            </p>
            <Button onClick={startSetup} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Activer la 2FA
            </Button>
          </>
        )}

        {/* ─ ÉTAPE SCAN QR ─ */}
        {step === 'setup' && (
          <div className="space-y-4">
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                Scannez ce QR code avec votre application d'authentification, puis cliquez sur Continuer.
              </AlertDescription>
            </Alert>

            {qrCode && (
              <div className="flex justify-center">
                <div
                  className="w-48 h-48 border-2 rounded-xl p-2 bg-white"
                  dangerouslySetInnerHTML={{ __html: qrCode }}
                />
              </div>
            )}

            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Code manuel (si QR indisponible)</p>
              <code className="text-xs font-mono break-all select-all">{secret}</code>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('idle')} disabled={loading}>Annuler</Button>
              <Button onClick={requestChallenge} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* ─ ÉTAPE VÉRIFICATION ─ */}
        {step === 'verify' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Entrez le code à 6 chiffres affiché dans votre application d'authentification.
            </p>

            <div className="space-y-1.5">
              <Label>Code OTP</Label>
              <Input
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
                onKeyDown={e => e.key === 'Enter' && verifyAndActivate()}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('setup')} disabled={loading}>Retour</Button>
              <Button onClick={verifyAndActivate} disabled={loading || otp.length < 6}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Vérifier et activer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuthSetup;
