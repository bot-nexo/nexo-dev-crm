import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ClientList } from './components/clients/ClientList';
import { ClientFormModal } from './components/clients/ClientFormModal';
import { ClientDetailModal } from './components/clients/ClientDetailModal';
import { ProjectList } from './components/projects/ProjectList';
import { ProjectFormModal } from './components/projects/ProjectFormModal';
import { PaymentList } from './components/payments/PaymentList';
import { PaymentFormModal } from './components/payments/PaymentFormModal';
import { InvoiceReceiptModal } from './components/payments/InvoiceReceiptModal';
import { AutomationsCenter } from './components/automations/AutomationsCenter';
import { ReportsView } from './components/reports/ReportsView';
import { SqlSchemaView } from './components/sql/SqlSchemaView';
import { SettingsView } from './components/settings/SettingsView';

import { Cliente, Proyecto, Pago, Notificacion, PagoEstado } from './types/database';
import { DataService } from './services/dataService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Core Data State
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  // Modal States
  const [clientModal, setClientModal] = useState<{ isOpen: boolean; client?: Cliente | null }>({
    isOpen: false,
    client: null,
  });
  const [detailClient, setDetailClient] = useState<Cliente | null>(null);

  const [projectModal, setProjectModal] = useState<{
    isOpen: boolean;
    project?: Proyecto | null;
    defaultClientId?: string;
  }>({
    isOpen: false,
    project: null,
  });

  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; payment?: Pago | null }>({
    isOpen: false,
    payment: null,
  });

  const [receiptModalPago, setReceiptModalPago] = useState<Pago | null>(null);

  // Load hydrated data
  const loadData = useCallback(async () => {
    try {
      const data = await DataService.getHydratedData();
      setClientes(data.clientes);
      setProyectos(data.proyectos);
      setPagos(data.pagos);
      setNotificaciones(data.notificaciones);
    } catch (e) {
      console.error('Error loading CRM data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync trigger
  const handleSync = async () => {
    setIsSyncing(true);
    await DataService.syncLocalToSupabase();
    await loadData();
    setIsSyncing(false);
  };

  // Financial summary
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const financialSummary = useMemo(() => {
    return DataService.calculateFinancialSummary(proyectos, pagos, currentPeriod);
  }, [proyectos, pagos, currentPeriod]);

  // Priority alerts count (Overdue payments + billings in next 3 days)
  const pendingAlertsCount = useMemo(() => {
    const overdueCount = pagos.filter((p) => p.estado === 'vencido').length;
    const currentDay = new Date().getDate();
    const upcomingCount = proyectos.filter(
      (p) => p.estado === 'activo' && p.dia_cobro - currentDay >= 0 && p.dia_cobro - currentDay <= 3
    ).length;
    return overdueCount + upcomingCount;
  }, [pagos, proyectos]);

  // Client CRUD Handlers
  const handleSaveClient = async (
    clienteData: Partial<Cliente> & { nombre: string; email: string }
  ) => {
    const saved = await DataService.saveCliente(clienteData);
    await loadData();
    // Update active modal / detail view if matching
    if (detailClient && detailClient.id === saved.id) {
      setDetailClient(saved);
    }
    return saved;
  };

  const handleDeleteClient = async (id: string) => {
    await DataService.deleteCliente(id);
    if (detailClient?.id === id) {
      setDetailClient(null);
    }
    await loadData();
  };

  // Project CRUD Handlers
  const handleSaveProject = async (
    projData: Partial<Proyecto> & { nombre_proyecto: string; cliente_id: string }
  ) => {
    const saved = await DataService.saveProyecto(projData);
    await loadData();
    return saved;
  };

  const handleDeleteProject = async (id: string) => {
    await DataService.deleteProyecto(id);
    await loadData();
  };

  // Payment CRUD Handlers
  const handleSavePayment = async (
    pagoData: Partial<Pago> & { proyecto_id: string; cliente_id: string; monto: number }
  ) => {
    const saved = await DataService.savePago(pagoData);
    await loadData();
    return saved;
  };

  const handleDeletePayment = async (id: string) => {
    await DataService.deletePago(id);
    await loadData();
  };

  const handleUpdatePaymentStatus = async (pago: Pago, newEstado: PagoEstado) => {
    await DataService.savePago({
      ...pago,
      estado: newEstado,
    });
    await loadData();
  };

  // Receipt data helper
  const receiptHydratedData = useMemo(() => {
    if (!receiptModalPago) return null;
    const client = clientes.find((c) => c.id === receiptModalPago.cliente_id);
    const project = proyectos.find((p) => p.id === receiptModalPago.proyecto_id);
    return { pago: receiptModalPago, client, project };
  }, [receiptModalPago, clientes, proyectos]);

  return (
    <div className="flex flex-col min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Application Header */}
      <Header
        onOpenNewPayment={() => setPaymentModal({ isOpen: true, payment: null })}
        onOpenNewClient={() => setClientModal({ isOpen: true, client: null })}
        onOpenSettings={() => setCurrentTab('config')}
        onSync={handleSync}
        isSyncing={isSyncing}
        pendingAlertsCount={pendingAlertsCount}
      />

      {/* Main Body: Sidebar + Dynamic Workspace View */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full overflow-x-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingAlertsCount={pendingAlertsCount}
        />

        <main className="flex-1 min-w-0 w-full overflow-y-auto p-3 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <span className="text-xs font-mono text-cyan-400">Iniciando Nexo CRM...</span>
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardOverview
                  summary={financialSummary}
                  clientes={clientes}
                  proyectos={proyectos}
                  pagos={pagos}
                  onOpenNewPayment={() => setPaymentModal({ isOpen: true, payment: null })}
                  onOpenNewClient={() => setClientModal({ isOpen: true, client: null })}
                  onOpenReceipt={(pago) => setReceiptModalPago(pago)}
                  onRefreshData={loadData}
                />
              )}

              {currentTab === 'clientes' && (
                <ClientList
                  clientes={clientes}
                  onOpenCreate={() => setClientModal({ isOpen: true, client: null })}
                  onOpenEdit={(client) => setClientModal({ isOpen: true, client })}
                  onOpenDetail={(client) => setDetailClient(client)}
                  onDeleteClient={handleDeleteClient}
                />
              )}

              {currentTab === 'proyectos' && (
                <ProjectList
                  proyectos={proyectos}
                  clientes={clientes}
                  onOpenCreate={() => setProjectModal({ isOpen: true, project: null })}
                  onOpenEdit={(project) => setProjectModal({ isOpen: true, project })}
                  onDeleteProject={handleDeleteProject}
                  onSaveProjectResources={async (updated) => {
                    await handleSaveProject(updated);
                  }}
                  onNewPaymentForProject={(proj) => {
                    setPaymentModal({
                      isOpen: true,
                      payment: {
                        id: '',
                        proyecto_id: proj.id,
                        cliente_id: proj.cliente_id,
                        monto: proj.valor_mensual || proj.valor_total_venta || 0,
                        fecha_pago: new Date().toISOString().split('T')[0],
                        periodo_mes: new Date().toISOString().slice(0, 7),
                        estado: 'pendiente',
                        tipo_pago: proj.modelo_cobro === 'venta_directa' ? 'venta_directa_hito' : 'cuota_mensual',
                      },
                    });
                  }}
                />
              )}

              {currentTab === 'pagos' && (
                <PaymentList
                  pagos={pagos}
                  clientes={clientes}
                  proyectos={proyectos}
                  onOpenCreate={() => setPaymentModal({ isOpen: true, payment: null })}
                  onOpenEdit={(payment) => setPaymentModal({ isOpen: true, payment })}
                  onOpenReceipt={(pago) => setReceiptModalPago(pago)}
                  onDeletePago={handleDeletePayment}
                  onUpdatePagoStatus={handleUpdatePaymentStatus}
                />
              )}

              {currentTab === 'automatizaciones' && (
                <AutomationsCenter
                  clientes={clientes}
                  proyectos={proyectos}
                  pagos={pagos}
                  notificaciones={notificaciones}
                  onRefreshData={loadData}
                  onOpenReceipt={(pago) => setReceiptModalPago(pago)}
                />
              )}

              {currentTab === 'reportes' && (
                <ReportsView
                  clientes={clientes}
                  proyectos={proyectos}
                  pagos={pagos}
                />
              )}

              {currentTab === 'sql' && <SqlSchemaView />}

              {currentTab === 'config' && (
                <SettingsView onDataSyncRequested={loadData} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Offline Status Banner */}
      <OfflineIndicator />

      {/* Client Form Modal */}
      {clientModal.isOpen && (
        <ClientFormModal
          initialClient={clientModal.client}
          onClose={() => setClientModal({ isOpen: false, client: null })}
          onSave={handleSaveClient}
        />
      )}

      {/* Client Detail View / Drawer */}
      {detailClient && (
        <ClientDetailModal
          cliente={detailClient}
          proyectos={proyectos}
          pagos={pagos}
          onClose={() => setDetailClient(null)}
          onEditClient={(c) => {
            setDetailClient(null);
            setClientModal({ isOpen: true, client: c });
          }}
          onNewPaymentForClient={(c) => {
            const clientProj = proyectos.find((p) => p.cliente_id === c.id);
            setPaymentModal({
              isOpen: true,
              payment: {
                id: '',
                proyecto_id: clientProj ? clientProj.id : '',
                cliente_id: c.id,
                monto: clientProj ? clientProj.valor_mensual : 0,
                fecha_pago: new Date().toISOString().split('T')[0],
                periodo_mes: new Date().toISOString().slice(0, 7),
                estado: 'pendiente',
              },
            });
          }}
          onNewProjectForClient={(c) => {
            setProjectModal({
              isOpen: true,
              project: null,
              defaultClientId: c.id,
            });
          }}
          onOpenReceipt={(pago) => setReceiptModalPago(pago)}
        />
      )}

      {/* Project Form Modal */}
      {projectModal.isOpen && (
        <ProjectFormModal
          initialProject={projectModal.project}
          clientes={clientes}
          defaultClientId={projectModal.defaultClientId}
          onClose={() => setProjectModal({ isOpen: false, project: null })}
          onSave={handleSaveProject}
        />
      )}

      {/* Payment Form Modal */}
      {paymentModal.isOpen && (
        <PaymentFormModal
          initialPayment={paymentModal.payment}
          clientes={clientes}
          proyectos={proyectos}
          onClose={() => setPaymentModal({ isOpen: false, payment: null })}
          onSave={handleSavePayment}
          onOpenReceipt={(saved) => {
            setPaymentModal({ isOpen: false, payment: null });
            setReceiptModalPago(saved);
          }}
        />
      )}

      {/* Official Voucher / Receipt Modal */}
      {receiptModalPago && (
        <InvoiceReceiptModal
          pago={receiptModalPago}
          cliente={receiptHydratedData?.client}
          proyecto={receiptHydratedData?.project}
          onClose={() => setReceiptModalPago(null)}
          onNotifySent={loadData}
        />
      )}
    </div>
  );
}
