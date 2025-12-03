import { useEffect, useState } from 'react';
import { useCartStore } from '../../app/store';
import { getConfig } from '../../app/configLoader';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// PWA install prompt interface
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { casa, setCasa } = useCartStore((state) => ({
    casa: state.casa,
    setCasa: state.setCasa,
  }));

  const [casaOptions, setCasaOptions] = useState<number[]>([1, 2, 3, 4]); // Default fallback
  const [isLoadingX, setIsLoadingX] = useState(false);
  const [isLoadingZ, setIsLoadingZ] = useState(false);
  const [isLoadingReset, setIsLoadingReset] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inchidereStep, setInchidereStep] = useState<'initial' | 'showX' | 'showZ'>('initial');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Load casa options from config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getConfig();
        if (config.casa && Array.isArray(config.casa)) {
          setCasaOptions(config.casa);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        // Keep default options if config fails to load
      }
    };

    loadConfig();
  }, []);

  // PWA install prompt handler
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setMessage({ type: 'success', text: 'Aplicația a fost instalată cu succes!' });
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const handleCasaSelect = (selectedCasa: number) => {
    setCasa(selectedCasa);
    onClose();
  };

  const handleRaportZ = async () => {
    setIsLoadingZ(true);
    setMessage(null);
    
    try {
      const config = await getConfig();
      const baseUrl = config.middleware?.apiBaseUrl || '';
      
      const response = await fetch(`${baseUrl}/api/rapoarte/generate-z`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ casa })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Raportul Z a fost generat cu succes!' });
        // Reset back to initial state to show "Închidere zi" button again
        setInchidereStep('initial');
      } else {
        setMessage({ type: 'error', text: data.message || 'Eroare la generarea raportului Z' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Eroare de rețea: ${error instanceof Error ? error.message : 'Eroare necunoscută'}` 
      });
    } finally {
      setIsLoadingZ(false);
    }
  };

  const handleRaportX = async () => {
    setIsLoadingX(true);
    setMessage(null);
    
    try {
      const config = await getConfig();
      const baseUrl = config.middleware?.apiBaseUrl || '';
      
      const response = await fetch(`${baseUrl}/api/rapoarte/generate-x`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ casa })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Raportul X a fost generat cu succes!' });
        // If successful, move to show Z step
        setInchidereStep('showZ');
      } else {
        setMessage({ type: 'error', text: data.message || 'Eroare la generarea raportului X' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Eroare de rețea: ${error instanceof Error ? error.message : 'Eroare necunoscută'}` 
      });
    } finally {
      setIsLoadingX(false);
    }
  };

  const handleResetCasa = async () => {
    setIsLoadingReset(true);
    setMessage(null);
    
    try {
      const config = await getConfig();
      const baseUrl = config.middleware?.apiBaseUrl || '';
      
      const response = await fetch(`${baseUrl}/api/reset?casa=${casa}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Casa a fost resetată cu succes!' });
      } else {
        const data = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: data.message || 'Eroare la resetarea casei' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Eroare de rețea: ${error instanceof Error ? error.message : 'Eroare necunoscută'}` 
      });
    } finally {
      setIsLoadingReset(false);
    }
  };

  const handleInchidereZi = () => {
    setMessage(null);
    setInchidereStep('showX');
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Setări
            </h3>
            <button
              type="button"
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 p-1"
              onClick={onClose}
            >
              <span className="sr-only">Închide</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div>
            {/* Message display */}
            {message && (
              <div className={`mb-4 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-start">
                  {message.type === 'success' ? (
                    <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-4">
              Selectează Casa
            </label>
            <div className="grid grid-cols-2 gap-3">
              {casaOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleCasaSelect(option)}
                  className={`
                    flex items-center justify-center p-4 rounded-lg border-2 transition-all duration-200
                    ${casa === option
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                    }
                  `}
                >
                  <span className="text-xl font-semibold">Casa {option}</span>
                </button>
              ))}
            </div>

            {/* Reports Section */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Rapoarte
              </label>
              <div className="space-y-3">
                {inchidereStep === 'initial' && (
                  <button
                    onClick={handleInchidereZi}
                    className="w-full flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300 hover:bg-purple-100"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">Închidere zi</span>
                  </button>
                )}
                
                {inchidereStep === 'showX' && (
                  <button
                    onClick={handleRaportX}
                    disabled={isLoadingX}
                    className={`w-full flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                      isLoadingX
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100'
                    }`}
                  >
                    {isLoadingX ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="font-medium">Se generează...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">Raportul X</span>
                      </>
                    )}
                  </button>
                )}
                
                {inchidereStep === 'showZ' && (
                  <button
                    onClick={handleRaportZ}
                    disabled={isLoadingZ}
                    className={`w-full flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                      isLoadingZ
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100'
                    }`}
                  >
                    {isLoadingZ ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="font-medium">Se generează...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">Raportul Z</span>
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={handleResetCasa}
                  disabled={isLoadingReset}
                  className={`w-full flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    isLoadingReset
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100'
                  }`}
                >
                  {isLoadingReset ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-medium">Se resetează...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="font-medium">Resetează Casa</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PWA Installation Section */}
            {!isInstalled && deferredPrompt && (
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Instalare Aplicație
                </label>
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="font-medium">Instalează Optimizer ThePOS</span>
                </button>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Instalează aplicația pentru acces rapid și funcționare offline
                </p>
              </div>
            )}

            {isInstalled && (
              <div className="mt-8">
                <div className="flex items-center justify-center p-3 rounded-lg border-2 border-green-200 bg-green-50 text-green-700">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Aplicația este instalată</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onClose}
            >
              Anulează
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}