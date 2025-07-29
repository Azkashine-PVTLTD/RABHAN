import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Zap, Home, Building2, ArrowRight, Lightbulb, TrendingUp, Banknote } from 'lucide-react';
import { ClientType, CalculationMode, SolarCalculationInput, SolarCalculationResult } from '../../types/solar.types';
import { solarService } from '../../services/solar.service';
import { SolarCalculatorForm } from './SolarCalculatorForm';
import { SolarResults } from './SolarResults';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useTranslation } from 'react-i18next';

interface SolarCalculatorProps {
  className?: string;
  onClose?: () => void;
}

export const SolarCalculator: React.FC<SolarCalculatorProps> = ({ className = '', onClose }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<'form' | 'results'>('form');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<SolarCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installmentOptions, setInstallmentOptions] = useState<number[]>([12, 18, 24]);

  // Note: Using hardcoded values [12, 18, 24] as per documentation requirements
  // Backend API call removed to ensure correct payment periods are shown
  useEffect(() => {
    // No API call needed - using hardcoded installmentOptions: [12, 18, 24]
  }, []);

  const handleCalculate = async (input: SolarCalculationInput) => {
    setIsCalculating(true);
    setError(null);

    try {
      const response = await solarService.calculateSolar(input);
      setCalculationResult(response.data);
      setCurrentStep('results');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Calculation failed');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRecalculate = () => {
    setCurrentStep('form');
    setCalculationResult(null);
    setError(null);
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const iconVariants = {
    initial: { scale: 0.8, rotate: -10 },
    animate: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, rotate: 5 }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div
              variants={iconVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
            >
              <Calculator className="w-8 h-8" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{t('solarCalculator.title')}</h2>
              <p className="text-white/90 text-sm">{t('solarCalculator.subtitle')}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close calculator"
            >
              <div className="w-6 h-6 relative">
                <div className="absolute inset-0 w-full h-0.5 bg-white rotate-45 top-1/2" />
                <div className="absolute inset-0 w-full h-0.5 bg-white -rotate-45 top-1/2" />
              </div>
            </button>
          )}
        </div>

        {/* Animated Icons */}
        <div className="absolute top-4 right-20 opacity-30">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-6 h-6" />
          </motion.div>
        </div>
        <div className="absolute bottom-4 right-32 opacity-20">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lightbulb className="w-8 h-8" />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {currentStep === 'form' && (
            <motion.div
              key="form"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <SolarCalculatorForm
                onCalculate={handleCalculate}
                isCalculating={isCalculating}
                error={error}
                installmentOptions={installmentOptions}
              />
            </motion.div>
          )}

          {currentStep === 'results' && calculationResult && (
            <motion.div
              key="results"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <SolarResults
                result={calculationResult}
                onRecalculate={handleRecalculate}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isCalculating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="text-center">
              <LoadingSpinner size="lg" className="mb-4" />
              <p className="text-gray-600 font-medium">{t('solarCalculator.calculatingMessage')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('solarCalculator.calculatingSubtext')}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Benefits Footer */}
      <motion.div 
        className="bg-gray-50 border-t px-6 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700">{t('solarCalculator.benefits.reduceBills')}</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Zap className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-gray-700">{t('solarCalculator.benefits.cleanEnergy')}</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Banknote className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">{t('solarCalculator.benefits.bnplFinancing')}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};