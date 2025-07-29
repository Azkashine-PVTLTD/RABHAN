import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Sun, 
  Banknote, 
  CreditCard, 
  Target, 
  Calculator,
  Zap,
  Home,
  Building2,
  ChevronDown,
  Receipt,
  Activity
} from 'lucide-react';
import { ClientType, CalculationMode } from '../../types/solar.types';
import { solarService } from '../../services/solar.service';

interface SimpleSolarCalculatorProps {
  onClose?: () => void;
}

// Rich Icon Component for Simple Calculator  
const SimpleRichIcon: React.FC<{ 
  icon: React.ElementType; 
  gradient: string; 
  size?: number;
}> = ({ 
  icon: Icon, 
  gradient, 
  size = 24
}) => (
  <motion.div 
    style={{
      padding: '0.75rem',
      borderRadius: '0.75rem',
      background: gradient,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: `${size + 24}px`,
      minHeight: `${size + 24}px`
    }}
    whileHover={{ scale: 1.1, rotate: 5 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <Icon 
      size={size} 
      color="white" 
      stroke="white"
      fill="none"
      strokeWidth="2"
      style={{ display: 'block', minWidth: `${size}px`, minHeight: `${size}px` }} 
    />
  </motion.div>
);

export const SimpleSolarCalculator: React.FC<SimpleSolarCalculatorProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const [clientType, setClientType] = useState<ClientType>(ClientType.RESIDENTIAL);
  const [mode, setMode] = useState<CalculationMode>(CalculationMode.MONTHLY_CONSUMPTION);
  const [monthlyConsumption, setMonthlyConsumption] = useState<string>('');
  const [monthlyBill, setMonthlyBill] = useState<string>('');
  const [installments, setInstallments] = useState<number>(30);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const validateInputs = (): string | null => {
    if (mode === CalculationMode.MONTHLY_CONSUMPTION) {
      if (!monthlyConsumption || monthlyConsumption.trim() === '') {
        return t('solarCalculator.validation.consumptionRequired', 'Monthly consumption is required');
      }
      const consumption = parseFloat(monthlyConsumption);
      if (isNaN(consumption)) {
        return t('solarCalculator.validation.consumptionMustBeNumber', 'Monthly consumption must be a valid number');
      }
      if (consumption < 6000) {
        return t('solarCalculator.validation.consumptionMinimum', 'Monthly consumption must be at least 6,000 KWH');
      }
      if (consumption > 24000) {
        return t('solarCalculator.validation.consumptionMaximum', 'Monthly consumption cannot exceed 24,000 KWH');
      }
    } else {
      if (!monthlyBill || monthlyBill.trim() === '') {
        return t('solarCalculator.validation.billRequired', 'Monthly bill is required');
      }
      const bill = parseFloat(monthlyBill);
      if (isNaN(bill)) {
        return t('solarCalculator.validation.billMustBeNumber', 'Monthly bill must be a valid number');
      }
      const minBill = clientType === ClientType.RESIDENTIAL ? 1080 : 1200;
      if (bill < minBill) {
        return t('solarCalculator.validation.billMinimum', { 
          min: minBill.toLocaleString(),
          defaultValue: `Monthly bill must be at least ${minBill} SAR` 
        });
      }
    }
    return null;
  };

  const handleCalculate = async () => {
    setError('');
    
    // Validate inputs first
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCalculating(true);

    try {
      const input: any = {
        mode,
        clientType,
        numberOfInstallments: installments,
      };

      if (mode === CalculationMode.MONTHLY_CONSUMPTION) {
        input.monthlyConsumption = parseFloat(monthlyConsumption);
      } else {
        input.monthlyBill = parseFloat(monthlyBill);
      }

      const response = await solarService.calculateSolar(input);
      setResult(response.data);
    } catch (err: any) {
      // Extract validation errors if available
      if (err.message && err.message.includes('Validation failed')) {
        setError(t('solarCalculator.validationError', 'Please check your inputs'));
      } else if (err.message) {
        setError(err.message);
      } else {
        setError(t('solarCalculator.calculationFailed', 'Calculation failed. Please try again.'));
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    console.log('Simple Calculator formatting currency:', amount, 'Language:', i18n.language);
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      numberingSystem: 'latn' // Always use Western numerals (1,2,3)
    }).format(amount);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      maxWidth: '800px',
      width: '100%',
      margin: '0 auto',
      direction: i18n.language === 'ar' ? 'rtl' : 'ltr'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #3eb2b1, #22d3db)',
        padding: '1.5rem',
        borderRadius: '1rem',
        marginBottom: '2rem',
        color: 'white',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <motion.div
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Calculator 
                size={32} 
                color="white" 
                stroke="white"
                fill="none"
                strokeWidth="2"
                style={{ display: 'block', minWidth: '32px', minHeight: '32px' }} 
              />
            </motion.div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                {t('solarCalculator.title', 'Solar Calculator')}
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.875rem' }}>
                {t('solarCalculator.subtitle', 'Calculate your solar savings instantly')}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {!result ? (
        /* Form */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Client Type */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1rem', fontWeight: '600' }}>{t('solarCalculator.selectClientType', 'Select Client Type')}</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {Object.values(ClientType).map((type) => (
                <button
                  key={type}
                  onClick={() => setClientType(type)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: clientType === type ? '2px solid #3eb2b1' : '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    background: clientType === type ? '#f0fdfa' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <motion.div 
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        background: clientType === type ? 'linear-gradient(135deg, #3eb2b1, #22d3db)' : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      {type === ClientType.RESIDENTIAL ? 
                        <Home 
                          size={20} 
                          color={clientType === type ? 'white' : '#374151'} 
                          stroke={clientType === type ? 'white' : '#374151'}
                          fill="none"
                          strokeWidth="2"
                          style={{ display: 'block', minWidth: '20px', minHeight: '20px' }}
                        /> : 
                        <Building2 
                          size={20} 
                          color={clientType === type ? 'white' : '#374151'} 
                          stroke={clientType === type ? 'white' : '#374151'}
                          fill="none"
                          strokeWidth="2"
                          style={{ display: 'block', minWidth: '20px', minHeight: '20px' }}
                        />
                      }
                    </motion.div>
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {type === ClientType.RESIDENTIAL ? t('solarCalculator.residential', 'Residential') : t('solarCalculator.commercial', 'Commercial')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Calculation Mode */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1rem', fontWeight: '600' }}>{t('solarCalculator.inputMethod', 'Input Method')}</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {Object.values(CalculationMode).map((calcMode) => (
                <button
                  key={calcMode}
                  onClick={() => setMode(calcMode)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: mode === calcMode ? '2px solid #3eb2b1' : '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    background: mode === calcMode ? '#f0fdfa' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                    {calcMode === CalculationMode.MONTHLY_CONSUMPTION ? t('solarCalculator.monthlyUsage', 'Monthly Usage (KWH)') : t('solarCalculator.monthlyBill', 'Monthly Bill (SAR)')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Input Value */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1rem', fontWeight: '600' }}>{t('solarCalculator.enterValue', 'Enter Value')}</h3>
            {mode === CalculationMode.MONTHLY_CONSUMPTION ? (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  {t('solarCalculator.monthlyConsumption', 'Monthly Electricity Consumption (KWH)')}
                </label>
                <input
                  type="number"
                  min="6000"
                  max="24000"
                  value={monthlyConsumption}
                  onChange={(e) => {
                    setMonthlyConsumption(e.target.value);
                    setError(''); // Clear error on input change
                  }}
                  onBlur={(e) => {
                    if (e.target.value) {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value)) {
                        setError(t('solarCalculator.validation.consumptionMustBeNumber', 'Monthly consumption must be a valid number'));
                      } else if (value < 6000) {
                        setError(t('solarCalculator.validation.consumptionMinimum', 'Monthly consumption must be at least 6,000 KWH'));
                      } else if (value > 24000) {
                        setError(t('solarCalculator.validation.consumptionMaximum', 'Monthly consumption cannot exceed 24,000 KWH'));
                      }
                    }
                  }}
                  placeholder={t('solarCalculator.enterKWH', 'Enter KWH (minimum 6,000)')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: error && mode === CalculationMode.MONTHLY_CONSUMPTION ? '2px solid #dc2626' : '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
                <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block', fontSize: '0.75rem' }}>
                  {t('solarCalculator.consumptionHint', 'Enter between 6,000 - 24,000 KWH')}
                </small>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  {t('solarCalculator.monthlyElectricityBill', 'Monthly Electricity Bill (SAR)')}
                </label>
                <input
                  type="number"
                  min={clientType === ClientType.RESIDENTIAL ? 1080 : 1200}
                  value={monthlyBill}
                  onChange={(e) => {
                    setMonthlyBill(e.target.value);
                    setError(''); // Clear error on input change
                  }}
                  onBlur={(e) => {
                    if (e.target.value) {
                      const value = parseFloat(e.target.value);
                      const minBill = clientType === ClientType.RESIDENTIAL ? 1080 : 1200;
                      if (isNaN(value)) {
                        setError(t('solarCalculator.validation.billMustBeNumber', 'Monthly bill must be a valid number'));
                      } else if (value < minBill) {
                        setError(t('solarCalculator.validation.billMinimum', { 
                          min: minBill.toLocaleString(),
                          defaultValue: `Monthly bill must be at least ${minBill} SAR`
                        }));
                      }
                    }
                  }}
                  placeholder={`${t('solarCalculator.enterSAR', 'Enter SAR')} (minimum ${clientType === ClientType.RESIDENTIAL ? '1,080' : '1,200'})`}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: error && mode === CalculationMode.MONTHLY_BILL ? '2px solid #dc2626' : '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
                <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block', fontSize: '0.75rem' }}>
                  {t('solarCalculator.billHint', { 
                    min: clientType === ClientType.RESIDENTIAL ? '1,080' : '1,200',
                    defaultValue: `Minimum ${clientType === ClientType.RESIDENTIAL ? '1,080' : '1,200'} SAR`
                  })}
                </small>
              </div>
            )}
          </div>

          {/* Installments */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1rem', fontWeight: '600' }}>{t('solarCalculator.paymentPeriod', 'Payment Period')}</h3>
            <select
              value={installments}
              onChange={(e) => setInstallments(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            >
              {[12, 18, 24].map(option => (
                <option key={option} value={option}>{option} {t('solarCalculator.months', 'months')}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                border: '1px solid #f87171',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1)'
              }}
            >
              <div style={{ 
                width: '24px', 
                height: '24px', 
                background: '#dc2626', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>!</span>
              </div>
              <div style={{ flex: 1 }}>
                {error}
              </div>
            </motion.div>
          )}

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            style={{
              background: isCalculating ? '#9ca3af' : 'linear-gradient(to right, #3eb2b1, #22d3db)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '0.75rem',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isCalculating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isCalculating ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                {t('solarCalculator.calculating', 'Calculating...')}
              </>
            ) : (
              <>
                <motion.div
                  style={{
                    padding: '0.25rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    marginRight: '0.5rem'
                  }}
                  whileHover={{ rotate: 15 }}
                >
                  <Zap 
                    size={20} 
                    color="white" 
                    stroke="white"
                    fill="none"
                    strokeWidth="2"
                    style={{ display: 'block', minWidth: '20px', minHeight: '20px' }} 
                  />
                </motion.div>
                {t('solarCalculator.calculateSolarSavings', 'Calculate Solar Savings')}
              </>
            )}
          </button>
        </div>
      ) : (
        /* Results */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#3eb2b1', fontSize: '1.25rem', margin: '0 0 1rem 0' }}>
              {t('solarCalculator.systemCalculated', 'Solar System Calculated!')}
            </h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
              {t('solarCalculator.personalizedSolution', "Here's your personalized solar solution")}
            </p>
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <motion.div 
              style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                padding: '1.5rem',
                borderRadius: '1rem',
                textAlign: 'center'
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <SimpleRichIcon 
                  icon={Sun} 
                  gradient="linear-gradient(135deg, #facc15 0%, #f97316 50%, #dc2626 100%)"
                  size={24}
                />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e40af' }}>
                {result.solarPowerKWP} KWP
              </div>
              <div style={{ fontSize: '0.75rem', color: '#3730a3' }}>{t('solarCalculator.systemSize', 'System Size')}</div>
            </motion.div>

            <motion.div 
              style={{
                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                padding: '1.5rem',
                borderRadius: '1rem',
                textAlign: 'center'
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <SimpleRichIcon 
                  icon={Banknote} 
                  gradient="linear-gradient(135deg, #4ade80 0%, #10b981 50%, #16a34a 100%)"
                  size={24}
                />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#15803d' }}>
                {formatCurrency(result.systemPrice)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534' }}>{t('solarCalculator.systemPrice', 'System Price')}</div>
            </motion.div>

            <motion.div 
              style={{
                background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                padding: '1.5rem',
                borderRadius: '1rem',
                textAlign: 'center'
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <SimpleRichIcon 
                  icon={CreditCard} 
                  gradient="linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%)"
                  size={24}
                />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#7c3aed' }}>
                {formatCurrency(result.totalMonthlyPayment)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b21b8' }}>{t('solarCalculator.monthlyPayment', 'Monthly Payment')}</div>
            </motion.div>

            <motion.div 
              style={{
                background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                padding: '1.5rem',
                borderRadius: '1rem',
                textAlign: 'center'
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <SimpleRichIcon 
                  icon={Target} 
                  gradient="linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #ef4444 100%)"
                  size={24}
                />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#7c3aed' }}>
                {result.savingsPercentage}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#5b21b6' }}>{t('solarCalculator.lifetimeSavings', 'Lifetime Savings')}</div>
            </motion.div>

            <motion.div 
              style={{
                background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                padding: '1.5rem',
                borderRadius: '1rem',
                textAlign: 'center'
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <SimpleRichIcon 
                  icon={Receipt} 
                  gradient="linear-gradient(135deg, #ea580c 0%, #fb923c 50%, #fdba74 100%)"
                  size={24}
                />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#c2410c' }}>
                {formatCurrency(result.currentMonthlyBill)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9a3412' }}>{t('solarCalculator.averageElectricityBill', 'Average Electricity Monthly Bill')}</div>
            </motion.div>

            <motion.div 
              style={{
                background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)',
                padding: '1.5rem',
                borderRadius: '1rem',
                textAlign: 'center'
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <SimpleRichIcon 
                  icon={Activity} 
                  gradient="linear-gradient(135deg, #eab308 0%, #facc15 50%, #fde047 100%)"
                  size={24}
                />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ca8a04' }}>
                {result.monthlyProduction.toLocaleString()} KWH
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a16207' }}>{t('solarCalculator.averageMonthlyProduction', 'Average Monthly Power Production')}</div>
            </motion.div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setResult(null)}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                border: '2px solid #e5e7eb',
                background: 'white',
                color: '#374151',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ← {t('solarCalculator.recalculate', 'Recalculate')}
            </button>
            
            <button
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(to right, #3eb2b1, #22d3db)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {t('solarCalculator.getQuote', 'Get Quote')} →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};