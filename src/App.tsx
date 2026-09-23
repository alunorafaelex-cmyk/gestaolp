import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { CompaniesList } from './components/CompaniesList';
import { CompanyPage } from './components/CompanyPage';
import { AllActionsPage } from './components/AllActionsPage';
import { HistoryPage } from './components/HistoryPage';
import { TrashPage } from './components/TrashPage';
import { ActionModal } from './components/modals/ActionModal';
import { CompanyModal } from './components/modals/CompanyModal';
import { ActionHistoryModal } from './components/modals/ActionHistoryModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { SqlSchemaModal } from './components/modals/SqlSchemaModal';
import { api } from './services/api';
import { Action, Company, DashboardStats } from './types/database';
import { supabase, isSupabaseConfigured } from './lib/supabase';

function MainApp() {
  const { user, loading: authLoading, displayName } = useAuth();
  const { success, error } = useToast();

  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // App Data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayCount: 0,
    last7DaysCount: 0,
    thisMonthCount: 0,
    todayRafael: 0,
    todayLeonardo: 0,
    todayTogether: 0,
  });
  const [recentActions, setRecentActions] = useState<Action[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalInitialCompanyId, setActionModalInitialCompanyId] = useState<string | undefined>(undefined);
  const [actionToEdit, setActionToEdit] = useState<Action | null>(null);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);

  const [actionForHistory, setActionForHistory] = useState<Action | null>(null);

  const [actionToDelete, setActionToDelete] = useState<Action | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Trigger refetch
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Load Companies & Dashboard Stats
  const loadInitialData = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingData(true);

      // Check seed
      await api.seedInitialCompaniesIfEmpty(displayName);

      const [comps, dashboardStats, recents] = await Promise.all([
        api.fetchCompaniesWithStats(),
        api.fetchDashboardStats(),
        api.fetchActions({ limit: 10, includeDeleted: false }),
      ]);

      setCompanies(comps);
      setStats(dashboardStats);
      setRecentActions(recents);
    } catch (err: any) {
      console.error('Error loading initial app data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [user, displayName]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData, refreshTrigger]);

  // Supabase Realtime Subscription for shared multi-user updates (Rafael & Leonardo)
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('lp-marketing-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'actions' },
        () => {
          triggerRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        () => {
          triggerRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'action_history' },
        () => {
          triggerRefresh();
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('Realtime channel notice (refetch manual ativo):', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, triggerRefresh]);

  // Handle open Action modal
  const handleOpenNewAction = (targetCompanyId?: string) => {
    setActionToEdit(null);
    setActionModalInitialCompanyId(targetCompanyId || selectedCompanyId || undefined);
    setIsActionModalOpen(true);
  };

  const handleEditAction = (action: Action) => {
    setActionToEdit(action);
    setActionModalInitialCompanyId(action.company_id);
    setIsActionModalOpen(true);
  };

  // Save (Create or Update) Action
  const handleSaveAction = async (payload: {
    companyId: string;
    performedBy: string;
    description: string;
    actionAt: string;
  }) => {
    if (actionToEdit) {
      await api.updateAction(
        actionToEdit.id,
        payload,
        actionToEdit,
        displayName
      );
      success('Ação atualizada com sucesso.');
    } else {
      await api.createAction({
        ...payload,
        userDisplayName: displayName,
      });
      success('Ação registrada com sucesso.');
    }
    triggerRefresh();
  };

  // Delete Action (Soft Delete)
  const handleConfirmDeleteAction = async () => {
    if (!actionToDelete) return;
    try {
      setIsDeleting(true);
      await api.softDeleteAction(actionToDelete.id, actionToDelete, displayName);
      success('Ação enviada para a lixeira.');
      setActionToDelete(null);
      triggerRefresh();
    } catch (err: any) {
      error(err.message || 'Erro ao excluir ação.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Company Operations
  const handleSaveCompany = async (name: string) => {
    if (companyToEdit) {
      await api.updateCompanyName(companyToEdit.id, name);
      success('Empresa renomeada com sucesso.');
    } else {
      await api.createCompany(name, displayName);
      success('Empresa criada com sucesso.');
    }
    triggerRefresh();
  };

  const handleConfirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      setIsDeleting(true);
      await api.softDeleteCompany(companyToDelete.id);
      success('Empresa enviada para a lixeira.');
      if (selectedCompanyId === companyToDelete.id) {
        setSelectedCompanyId(null);
      }
      setCompanyToDelete(null);
      triggerRefresh();
    } catch (err: any) {
      error(err.message || 'Erro ao excluir empresa.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Selected company object
  const activeCompany = selectedCompanyId
    ? companies.find((c) => c.id === selectedCompanyId) || null
    : null;

  // Header Titles
  const getHeaderInfo = () => {
    if (activeCompany) {
      return {
        title: activeCompany.name,
        subtitle: 'Registro de ações realizadas para esta empresa',
      };
    }
    switch (currentTab) {
      case 'overview':
        return {
          title: 'Visão Geral',
          subtitle: 'Acompanhamento de ações da LP Marketing',
        };
      case 'companies':
        return {
          title: 'Empresas Atendidas',
          subtitle: 'Gerenciamento de clientes da agência',
        };
      case 'actions':
        return {
          title: 'Todas as Ações',
          subtitle: 'Registro unificado de atividades realizadas',
        };
      case 'history':
        return {
          title: 'Histórico de Alterações',
          subtitle: 'Auditoria de edições, exclusões e restaurações',
        };
      case 'trash':
        return {
          title: 'Lixeira',
          subtitle: 'Restauração de itens excluídos',
        };
      default:
        return { title: 'Gestão LP Marketing', subtitle: '' };
    }
  };

  const headerInfo = getHeaderInfo();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">Carregando Gestão LP Marketing...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onOpenSqlModal={() => setIsSqlModalOpen(true)} />
        <SqlSchemaModal
          isOpen={isSqlModalOpen}
          onClose={() => setIsSqlModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased selection:bg-cyan-500 selection:text-white">
      {/* Sidebar (Desktop + Mobile) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedCompanyId(null);
          setCurrentTab(tab);
        }}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenNewAction={() => handleOpenNewAction()}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewAction={() => handleOpenNewAction()}
          onNewCompany={() => {
            setCompanyToEdit(null);
            setIsCompanyModalOpen(true);
          }}
          showNewCompanyBtn={currentTab === 'companies'}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {/* If inside a single company view */}
          {activeCompany ? (
            <CompanyPage
              company={activeCompany}
              onBack={() => setSelectedCompanyId(null)}
              onOpenNewActionForCompany={(cId) => handleOpenNewAction(cId)}
              onEditCompany={(comp) => {
                setCompanyToEdit(comp);
                setIsCompanyModalOpen(true);
              }}
              onDeleteCompany={(comp) => setCompanyToDelete(comp)}
              onEditAction={handleEditAction}
              onViewActionHistory={(action) => setActionForHistory(action)}
              onDeleteAction={(action) => setActionToDelete(action)}
              refreshTrigger={refreshTrigger}
            />
          ) : currentTab === 'overview' ? (
            <Dashboard
              stats={stats}
              recentActions={recentActions}
              companies={companies}
              onSelectCompany={(cId) => setSelectedCompanyId(cId)}
              onOpenNewAction={() => handleOpenNewAction()}
              onViewAllActions={() => setCurrentTab('actions')}
              onViewAllCompanies={() => setCurrentTab('companies')}
              onEditAction={handleEditAction}
              onViewActionHistory={(action) => setActionForHistory(action)}
              onDeleteAction={(action) => setActionToDelete(action)}
            />
          ) : currentTab === 'companies' ? (
            <CompaniesList
              companies={companies}
              loading={loadingData}
              onSelectCompany={(cId) => setSelectedCompanyId(cId)}
              onNewCompany={() => {
                setCompanyToEdit(null);
                setIsCompanyModalOpen(true);
              }}
              onEditCompany={(comp) => {
                setCompanyToEdit(comp);
                setIsCompanyModalOpen(true);
              }}
              onDeleteCompany={(comp) => setCompanyToDelete(comp)}
            />
          ) : currentTab === 'actions' ? (
            <AllActionsPage
              companies={companies}
              onSelectCompany={(cId) => setSelectedCompanyId(cId)}
              onEditAction={handleEditAction}
              onViewActionHistory={(action) => setActionForHistory(action)}
              onDeleteAction={(action) => setActionToDelete(action)}
              refreshTrigger={refreshTrigger}
            />
          ) : currentTab === 'history' ? (
            <HistoryPage
              onSelectCompanyByName={(name) => {
                const found = companies.find((c) => c.name.toLowerCase() === name.toLowerCase());
                if (found) setSelectedCompanyId(found.id);
              }}
              refreshTrigger={refreshTrigger}
            />
          ) : (
            <TrashPage
              onRestored={() => {
                success('Item restaurado com sucesso.');
                triggerRefresh();
              }}
              userDisplayName={displayName}
              refreshTrigger={refreshTrigger}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {/* 1. Register / Edit Action Modal */}
      <ActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onSave={handleSaveAction}
        companies={companies}
        initialCompanyId={actionModalInitialCompanyId}
        actionToEdit={actionToEdit}
      />

      {/* 2. Create / Edit Company Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleSaveCompany}
        companyToEdit={companyToEdit}
      />

      {/* 3. Action History & Restore Modal */}
      <ActionHistoryModal
        isOpen={Boolean(actionForHistory)}
        onClose={() => setActionForHistory(null)}
        action={actionForHistory}
        onRestored={() => {
          success('Versão anterior restaurada com sucesso.');
          triggerRefresh();
        }}
        userDisplayName={displayName}
      />

      {/* 4. Delete Action Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(actionToDelete)}
        title="Excluir ação realizada?"
        message={`Tem certeza que deseja excluir esta ação realizada por ${
          actionToDelete?.performed_by || 'Colaborador'
        }? Ela será movida para a lixeira e poderá ser restaurada a qualquer momento.`}
        confirmText="Excluir Ação"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteAction}
        onCancel={() => setActionToDelete(null)}
      />

      {/* 5. Delete Company Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(companyToDelete)}
        title="Excluir empresa?"
        message={`Tem certeza que deseja mover "${companyToDelete?.name}" para a lixeira? Ela sairá das listas ativas, mas continuará salva no banco de dados.`}
        confirmText="Excluir Empresa"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteCompany}
        onCancel={() => setCompanyToDelete(null)}
      />

      {/* 6. SQL Schema & Supabase Configuration Guide Modal */}
      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
