import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartNotificationCenter } from '@/components/SmartNotificationCenter';

export default function AdminNotifications() {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Notifications - Admin Bikawo</title>
        <meta name="description" content="Centre de notifications administrateur" />
      </Helmet>

      <Navbar />

      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground">Visualisez et gérez les dernières notifications système</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Centre de notifications</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-start">
              <SmartNotificationCenter />
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
