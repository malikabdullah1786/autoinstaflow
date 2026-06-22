"use client";

import React, { use } from 'react';
import { useApp } from '@/context/AppContext';
import { AutomationBuilder } from '@/components/AutomationBuilder';
import { AlertCircle } from 'lucide-react';

export default function EditAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { automations } = useApp();
  const automation = automations.find(a => a.id === resolvedParams.id);

  if (!automation) {
    return (
      <div className="glass-panel p-8 text-center flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3 className="text-lg font-bold text-zinc-900">Automation Not Found</h3>
        <p className="text-zinc-505 text-sm">The automation you are trying to edit does not exist or has been deleted.</p>
      </div>
    );
  }

  return <AutomationBuilder initialData={automation} />;
}
