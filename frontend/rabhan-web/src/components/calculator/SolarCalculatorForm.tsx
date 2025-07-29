import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Building2, Zap, Calendar, AlertCircle } from 'lucide-react';
import { ClientType, CalculationMode, SolarCalculationInput } from '../../types/solar.types';
import { useTranslation } from 'react-i18next';

interface SolarCalculatorFormProps {
  onCalculate: (input: SolarCalculationInput) => void;
  isCalculating: boolean;
  error: string | null;
  installmentOptions: number[];
}

export const SolarCalculatorForm: React.FC<SolarCalculatorFormProps> = ({
  onCalculate,
  isCalculating,
  error,
  installmentOptions
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    clientType: ClientType.RESIDENTIAL,
    mode: CalculationMode.MONTHLY_CONSUMPTION,
    monthlyConsumption: '',
    monthlyBill: '',
    numberOfInstallments: installmentOptions[0] || 12
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.mode === CalculationMode.MONTHLY_CONSUMPTION) {
      const consumption = parseFloat(formData.monthlyConsumption);
      if (!formData.monthlyConsumption) {
        newErrors.monthlyConsumption = 'Monthly consumption is required';
      } else if (isNaN(consumption) || consumption < 6000) {
        newErrors.monthlyConsumption = 'Minimum consumption is 6,000 KWH';
      } else if (consumption > 24000) {
        newErrors.monthlyConsumption = 'Maximum consumption is 24,000 KWH';
      }
    } else {
      const bill = parseFloat(formData.monthlyBill);
      const minBill = formData.clientType === ClientType.RESIDENTIAL ? 1080 : 1200;
      
      if (!formData.monthlyBill) {
        newErrors.monthlyBill = 'Monthly bill is required';
      } else if (isNaN(bill) || bill < minBill) {
        newErrors.monthlyBill = `Minimum bill is ${minBill.toLocaleString()} SAR for ${formData.clientType.toLowerCase()}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const input: SolarCalculationInput = {
      mode: formData.mode,
      clientType: formData.clientType,
      numberOfInstallments: formData.numberOfInstallments,
      ...(formData.mode === CalculationMode.MONTHLY_CONSUMPTION
        ? { monthlyConsumption: parseFloat(formData.monthlyConsumption) }
        : { monthlyBill: parseFloat(formData.monthlyBill) })
    };

    onCalculate(input);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -2, transition: { duration: 0.2 } }
  };

  const inputVariants = {
    focus: { 
      scale: 1.02,
      borderColor: 'var(--color-primary-500)',
      boxShadow: '0 0 0 3px var(--color-primary-100)',
      transition: { duration: 0.2 }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Type Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 text-primary-600 font-bold text-sm">1</span>
          {t('solarCalculator.selectClientType')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(ClientType).map((type) => (
            <motion.div
              key={type}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${
                formData.clientType === type
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
              }`}
              onClick={() => handleInputChange('clientType', type)}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${
                  formData.clientType === type 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {type === ClientType.RESIDENTIAL ? <Home className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {t(`solarCalculator.clientType.${type.toLowerCase()}`)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {type === ClientType.RESIDENTIAL 
                      ? t('solarCalculator.clientType.residentialDesc') 
                      : t('solarCalculator.clientType.commercialDesc')
                    }
                  </p>
                </div>
                <div className={`ml-auto w-5 h-5 rounded-full border-2 ${
                  formData.clientType === type
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {formData.clientType === type && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-full h-full bg-white rounded-full flex items-center justify-center"
                    >
                      <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Calculation Mode */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 text-primary-600 font-bold text-sm">2</span>
          {t('solarCalculator.inputMethod')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(CalculationMode).map((mode) => (
            <motion.div
              key={mode}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${
                formData.mode === mode
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
              }`}
              onClick={() => handleInputChange('mode', mode)}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${
                  formData.mode === mode 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {mode === CalculationMode.MONTHLY_CONSUMPTION ? t('solarCalculator.monthlyUsage') : t('solarCalculator.monthlyBill')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {mode === CalculationMode.MONTHLY_CONSUMPTION 
                      ? t('solarCalculator.enterUsageDesc') 
                      : t('solarCalculator.enterBillDesc')
                    }
                  </p>
                </div>
                <div className={`ml-auto w-5 h-5 rounded-full border-2 ${
                  formData.mode === mode
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {formData.mode === mode && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-full h-full bg-white rounded-full flex items-center justify-center"
                    >
                      <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Input Value */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 text-primary-600 font-bold text-sm">3</span>
          {t('solarCalculator.enterValue')}
        </h3>
        
        {formData.mode === CalculationMode.MONTHLY_CONSUMPTION ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('solarCalculator.monthlyConsumption')}
            </label>
            <motion.input
              type="number"
              min="6000"
              max="24000"
              step="100"
              value={formData.monthlyConsumption}
              onChange={(e) => handleInputChange('monthlyConsumption', e.target.value)}
              className={`w-full p-4 border-2 rounded-xl text-lg font-semibold transition-all ${
                errors.monthlyConsumption 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 focus:border-primary-500 focus:bg-white'
              }`}
              placeholder={t('solarCalculator.enterKWH')}
              whileFocus="focus"
              variants={inputVariants}
            />
            {errors.monthlyConsumption && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600 flex items-center"
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.monthlyConsumption}
              </motion.p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              {t('solarCalculator.consumptionHint')}
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('solarCalculator.monthlyElectricityBill')}
            </label>
            <motion.input
              type="number"
              min={formData.clientType === ClientType.RESIDENTIAL ? 1080 : 1200}
              step="10"
              value={formData.monthlyBill}
              onChange={(e) => handleInputChange('monthlyBill', e.target.value)}
              className={`w-full p-4 border-2 rounded-xl text-lg font-semibold transition-all ${
                errors.monthlyBill 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 focus:border-primary-500 focus:bg-white'
              }`}
              placeholder={t('solarCalculator.enterSAR')}
              whileFocus="focus"
              variants={inputVariants}
            />
            {errors.monthlyBill && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600 flex items-center"
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.monthlyBill}
              </motion.p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              {t('solarCalculator.billHint', { min: formData.clientType === ClientType.RESIDENTIAL ? '1,080' : '1,200' })}
            </p>
          </div>
        )}
      </div>

      {/* Installments */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 text-primary-600 font-bold text-sm">4</span>
          {t('solarCalculator.paymentPeriod')}
        </h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('solarCalculator.numberOfInstallments')}
          </label>
          <select
            value={formData.numberOfInstallments}
            onChange={(e) => handleInputChange('numberOfInstallments', parseInt(e.target.value))}
            className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:border-primary-500 focus:outline-none transition-colors"
          >
            {installmentOptions.map(option => (
              <option key={option} value={option}>
                {t(`solarCalculator.installmentOptions.${option}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isCalculating}
        className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all ${
          isCalculating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl'
        }`}
        whileHover={!isCalculating ? { scale: 1.02 } : {}}
        whileTap={!isCalculating ? { scale: 0.98 } : {}}
      >
        <div className="flex items-center justify-center space-x-2">
          {isCalculating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('solarCalculator.calculating')}</span>
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5" />
              <span>{t('solarCalculator.calculateSolarSavings')}</span>
            </>
          )}
        </div>
      </motion.button>
    </form>
  );
};