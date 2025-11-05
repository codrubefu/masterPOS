import { useEffect, useState } from 'react';
import { useCartStore } from '../../app/store';
import { getConfig } from '../../app/configLoader';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { casa, setCasa } = useCartStore((state) => ({
    casa: state.casa,
    setCasa: state.setCasa,
  }));

  const [casaOptions, setCasaOptions] = useState<number[]>([1, 2, 3, 4]); // Default fallback

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

  const handleCasaSelect = (selectedCasa: number) => {
    setCasa(selectedCasa);
    onClose();
  };

  const handleRaportZ = () => {
    console.log('Raportul Z generat');
    // Add your Z report logic here
  };

  const handleRaportX = () => {
    console.log('Raportul X generat');
    // Add your X report logic here
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
                <button
                  onClick={handleRaportZ}
                  className="w-full flex items-center justify-center p-3 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100 transition-all duration-200"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Raportul Z</span>
                </button>
                <button
                  onClick={handleRaportX}
                  className="w-full flex items-center justify-center p-3 rounded-lg border-2 border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100 transition-all duration-200"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Raportul X</span>
                </button>
              </div>
            </div>
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