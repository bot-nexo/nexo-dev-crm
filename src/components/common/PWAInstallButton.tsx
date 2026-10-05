import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3000);
    }
  };

  if (isInstallable) {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          title="Instalar CRM como Aplicación en este dispositivo"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar PWA</span>
        </button>

        {installSuccess && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium">¡Aplicación instalada con éxito!</span>
          </div>
        )}
      </>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar en iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-cyan-500/30 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                    N
                  </div>
                  <h3 className="text-sm font-bold text-white">Instalar Nexo CRM en iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs shrink-0">
                    1
                  </span>
                  <p>Presiona el botón de <strong>Compartir</strong> (ícono de cuadro con flecha hacia arriba) en la barra de Safari.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs shrink-0">
                    2
                  </span>
                  <p>Desliza hacia abajo y selecciona <strong>«Agregar al inicio»</strong> (Add to Home Screen).</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs shrink-0">
                    3
                  </span>
                  <p>Pulsa <strong>«Agregar»</strong> en la esquina superior derecha para iniciar el CRM como app independiente sin barras de navegador.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-cyan-500/20 border border-cyan-500/50 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
