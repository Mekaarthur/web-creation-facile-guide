import React from 'react';
import { Helmet } from 'react-helmet-async';
import EmailConfigManager from '@/components/EmailConfigManager';

export default function ConfigMessages() {
  return (
    <>
      <Helmet>
        <title>Configuration des Messages - Bikawo Admin</title>
        <meta name="description" content="Personnalisez vos templates d'emails et notifications" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <EmailConfigManager />
      </div>
    </>
  );
}