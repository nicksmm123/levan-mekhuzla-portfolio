/**
 * Top-level admin section.
 * Provides its own LanguageProvider (isolated from the public site) so the
 * admin language toggle does not affect the public gallery, and vice-versa.
 */
import React from 'react';
import { AdminAuthProvider, useAdminAuth } from '@/lib/adminAuth';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { AdminLogin } from './Login';
import { AdminDashboard } from './Dashboard';

function AdminGuard() {
  const { session, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return session ? <AdminDashboard /> : <AdminLogin />;
}

export function AdminApp() {
  return (
    <LanguageProvider>
      <AdminAuthProvider>
        <AdminGuard />
      </AdminAuthProvider>
    </LanguageProvider>
  );
}
