import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Zap, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Battery, 
  Home, 
  Building2,
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  Sun,
  Wallet,
  CalendarDays,
  Target,
  Sparkles,
  Banknote,
  CreditCard,
  PiggyBank,
  TrendingDown,
  Award,
  Shield
} from 'lucide-react';
import { SolarCalculationResult, ClientType } from '../../types/solar.types';

interface SolarResultsProps {
  result: SolarCalculationResult;
  onRecalculate: () => void;
}

// Rich Icon Components
const RichIcon: React.FC<{ 
  icon: React.ElementType; 
  gradient: string; 
  size?: string;
  animate?: boolean;
}> = ({ 
  icon: Icon, 
  gradient, 
  size = "w-6 h-6",
  animate = true 
}) => (
  <motion.div 
    className={`p-3 rounded-xl text-white ${gradient} shadow-lg`}
    whileHover={animate ? { scale: 1.1, rotate: 5 } : {}}
    whileTap={animate ? { scale: 0.95 } : {}}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <Icon className={size} />
  </motion.div>
);

const SolarIcon = () => (
  <RichIcon 
    icon={Sun} 
    gradient="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500"
  />
);

const MoneyIcon = () => (
  <RichIcon 
    icon={Banknote} 
    gradient="bg-gradient-to-br from-green-400 via-emerald-500 to-green-600"
  />
);

const PaymentIcon = () => (
  <RichIcon 
    icon={CreditCard} 
    gradient="bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600"
  />
);

const ROIIcon = () => (
  <RichIcon 
    icon={Target} 
    gradient="bg-gradient-to-br from-purple-400 via-pink-500 to-red-500"
  />
);

const SuccessIcon = () => (
  <motion.div 
    className="w-16 h-16 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white shadow-2xl"
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
    whileHover={{ scale: 1.1, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.4)" }}
  >
    <CheckCircle2 className="w-8 h-8" />
    <motion.div
      className="absolute inset-0 rounded-full"
      animate={{ 
        boxShadow: [
          "0 0 0 0 rgba(34, 197, 94, 0.4)",
          "0 0 0 20px rgba(34, 197, 94, 0)",
        ]
      }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </motion.div>
);

export const SolarResults: React.FC<SolarResultsProps> = ({ result, onRecalculate }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const formatCurrency = (amount: number) => {
    console.log('Formatting currency:', amount, 'Language:', i18n.language);
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      numberingSystem: 'latn' // Always use Western numerals (1,2,3)
    }).format(amount);
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      numberingSystem: 'latn' // Always use Western numerals (1,2,3)
    }).format(number);
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 }
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    hover: { 
      scale: 1.02,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: { duration: 0.2 }
    }
  };

  const progressVariants = {
    initial: { width: 0 },
    animate: { width: '100%' },
  };

  const savingsColor = result.savingsPercentage > 50 ? 'text-green-600' : 'text-orange-600';
  const roiColor = result.roiEstimate > 50 ? 'text-green-600' : 'text-blue-600';

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <SuccessIcon />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{t('calculator.results.title')}</h3>
            <p className="text-gray-600">{t('calculator.results.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            {result.clientType === ClientType.RESIDENTIAL ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            <span>{result.clientType === ClientType.RESIDENTIAL ? t('calculator.clientType.residential') : t('calculator.clientType.commercial')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{result.numberOfInstallments} months</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>{formatNumber(result.solarPowerKWP)} KWP</span>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <SolarIcon />
            <span className="text-sm font-medium text-blue-600">{t('calculator.results.systemSize')}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-900">{formatNumber(result.solarPowerKWP)} KWP</p>
            <p className="text-sm text-blue-700">{formatNumber(result.monthlyProduction)} KWH/month</p>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <MoneyIcon />
            <span className="text-sm font-medium text-green-600">{t('calculator.results.systemPrice')}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-900">{formatCurrency(result.systemPrice)}</p>
            <p className="text-sm text-green-700">{formatCurrency(result.installmentValue)}/month</p>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-6 rounded-2xl border border-blue-200 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <PaymentIcon />
            <span className="text-sm font-medium text-blue-600">{t('calculator.results.monthlyPayment')}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-orange-900">{formatCurrency(result.totalMonthlyPayment)}</p>
            <p className="text-sm text-orange-700">
              {result.monthlyCostIncrease > 0 ? '+' : ''}{result.monthlyCostIncrease}% vs current bill
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="bg-gradient-to-br from-purple-50 via-pink-50 to-red-100 p-6 rounded-2xl border border-purple-200 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <ROIIcon />
            <span className="text-sm font-medium text-purple-600">{t('calculator.results.roi')}</span>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${roiColor}`}>{result.roiEstimate}%</p>
            <p className="text-sm text-purple-700">Return on Investment</p>
          </div>
        </motion.div>
      </div>

      {/* Detailed Breakdown */}
      <motion.div 
        variants={cardVariants}
        whileHover="hover"
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <motion.div 
            className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center mr-3 text-white shadow-lg"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <PiggyBank className="w-5 h-5" />
          </motion.div>
          {t('calculator.results.financialBreakdown')}
        </h4>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Current Monthly Bill</span>
            <span className="font-semibold text-gray-900">{formatCurrency(result.currentMonthlyBill)}</span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Monthly Installment</span>
            <span className="font-semibold text-gray-900">{formatCurrency(result.installmentValue)}</span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Remaining Electricity Bill</span>
            <span className="font-semibold text-gray-900">{formatCurrency(result.extraElectricityPayment)}</span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b-2 border-gray-200">
            <span className="text-gray-900 font-semibold">Total Monthly Payment</span>
            <span className="font-bold text-lg text-gray-900">{formatCurrency(result.totalMonthlyPayment)}</span>
          </div>
          
          <motion.div 
            className="bg-green-50 border border-green-200 rounded-xl p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500 text-white rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Long-term Savings</p>
                  <p className="text-sm text-green-700">After installment period</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${savingsColor}`}>{result.savingsPercentage}%</p>
                <p className="text-sm text-green-600">System value saved</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Consumption Analysis */}
      <motion.div 
        variants={cardVariants}
        whileHover="hover"
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <motion.div 
            className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-3 text-white shadow-lg"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Sun className="w-5 h-5" />
          </motion.div>
          Energy Analysis
        </h4>
        
        <div className="space-y-6">
          {/* Monthly Consumption */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Monthly Consumption</span>
              <span className="font-semibold">{formatNumber(result.monthlyConsumption)} KWH</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                variants={progressVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 1, delay: 0.3 }}
                className="bg-blue-500 h-3 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Solar Production */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Solar Production</span>
              <span className="font-semibold text-green-600">{formatNumber(result.monthlyProduction)} KWH</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(result.monthlyProduction / result.monthlyConsumption) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-green-500 h-3 rounded-full"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Covers {Math.round((result.monthlyProduction / result.monthlyConsumption) * 100)}% of your consumption
            </p>
          </div>

          {/* Remaining Grid Usage */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Remaining from Grid</span>
              <span className="font-semibold text-orange-600">
                {formatNumber(Math.max(0, result.monthlyConsumption - result.monthlyProduction))} KWH
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, (result.monthlyConsumption - result.monthlyProduction) / result.monthlyConsumption) * 100}%` }}
                transition={{ duration: 1, delay: 0.7 }}
                className="bg-orange-500 h-3 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <motion.button
          onClick={onRecalculate}
          className="flex items-center justify-center space-x-3 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-md"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="p-2 bg-gray-100 rounded-lg"
            whileHover={{ rotate: -10 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.div>
          <span>{t('calculator.results.recalculate')}</span>
        </motion.button>
        
        <motion.button
          className="flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
            whileHover={{ rotate: 10 }}
          >
            <Download className="w-5 h-5" />
          </motion.div>
          <span>{t('calculator.results.downloadReport')}</span>
        </motion.button>
        
        <motion.button
          className="flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
            whileHover={{ rotate: 10 }}
          >
            <Share2 className="w-5 h-5" />
          </motion.div>
          <span>{t('calculator.results.getQuote')}</span>
        </motion.button>
      </div>

      {/* Disclaimer */}
      <motion.div 
        variants={itemVariants}
        className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center"
      >
        <p className="text-sm text-gray-600">
          * This is an estimate based on average conditions. Actual savings may vary based on location, 
          weather conditions, and electricity usage patterns. Contact our experts for a detailed assessment.
        </p>
      </motion.div>
    </motion.div>
  );
};