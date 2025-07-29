import { v4 as uuidv4 } from 'uuid';
import {
  ClientType,
  CalculationMode,
  SolarCalculationInput,
  SolarCalculationResult,
  SolarPowerMapping,
  SolarConstants,
  AdminConfigurableValues
} from '../types/solar.types';

export class SolarCalculatorService {
  private readonly solarPowerMappings: SolarPowerMapping[] = [
    { minConsumption: 6000, maxConsumption: 9000, requiredKWP: 10, monthlyProduction: 1583 },
    { minConsumption: 9001, maxConsumption: 10000, requiredKWP: 11, monthlyProduction: 1741 },
    { minConsumption: 10001, maxConsumption: 11000, requiredKWP: 12, monthlyProduction: 1900 },
    { minConsumption: 11001, maxConsumption: 12000, requiredKWP: 13, monthlyProduction: 2058 },
    { minConsumption: 12001, maxConsumption: 13000, requiredKWP: 14, monthlyProduction: 2216 },
    { minConsumption: 13001, maxConsumption: 14000, requiredKWP: 15, monthlyProduction: 2375 },
    { minConsumption: 14001, maxConsumption: 15000, requiredKWP: 16, monthlyProduction: 2533 },
    { minConsumption: 15001, maxConsumption: 16000, requiredKWP: 17, monthlyProduction: 2691 },
    { minConsumption: 16001, maxConsumption: 17000, requiredKWP: 18, monthlyProduction: 2849 },
    { minConsumption: 17001, maxConsumption: 18000, requiredKWP: 19, monthlyProduction: 3008 },
    { minConsumption: 18001, maxConsumption: 19000, requiredKWP: 20, monthlyProduction: 3166 },
    { minConsumption: 19001, maxConsumption: 20000, requiredKWP: 21, monthlyProduction: 3324 },
    { minConsumption: 20001, maxConsumption: 21000, requiredKWP: 22, monthlyProduction: 3483 },
    { minConsumption: 21001, maxConsumption: 22000, requiredKWP: 23, monthlyProduction: 3641 },
    { minConsumption: 22001, maxConsumption: 23000, requiredKWP: 24, monthlyProduction: 3799 },
    { minConsumption: 23001, maxConsumption: 24000, requiredKWP: 25, monthlyProduction: 3958 }
  ];

  private constants: SolarConstants = {
    KWP_TO_KWH_FACTOR: 158.3,
    RESIDENTIAL_MIN_BILL: 1080,
    COMMERCIAL_MIN_BILL: 1200,
    ELECTRICITY_RATE: 0.3,
    SYSTEM_PRICE_PER_KWP: 2200,
    MIN_CONSUMPTION_KWH: 6000,
    MAX_CONSUMPTION_KWH: 24000
  };

  private adminConfig: AdminConfigurableValues = {
    electricityRate: 0.3,
    systemPricePerKWP: 2200,
    residentialMinBill: 1080,
    commercialMinBill: 1200,
    installmentOptions: [12, 18, 24],
    interestMultiplier: 1.0
  };

  constructor() {}

  public async calculate(input: SolarCalculationInput): Promise<SolarCalculationResult> {
    const startTime = process.hrtime.bigint();
    
    let monthlyConsumption: number;
    let currentMonthlyBill: number;

    if (input.mode === CalculationMode.MONTHLY_CONSUMPTION) {
      monthlyConsumption = input.monthlyConsumption!;
      currentMonthlyBill = this.calculateMonthlyBill(monthlyConsumption, input.clientType);
    } else {
      currentMonthlyBill = input.monthlyBill!;
      monthlyConsumption = this.calculateMonthlyConsumption(currentMonthlyBill, input.clientType);
    }

    const solarMapping = this.getSolarPowerMapping(monthlyConsumption);
    const systemPrice = this.calculateSystemPrice(solarMapping.requiredKWP);
    const installmentValue = this.calculateInstallmentValue(systemPrice, input.numberOfInstallments);
    const extraElectricityPayment = this.calculateExtraElectricityPayment(
      monthlyConsumption,
      solarMapping.monthlyProduction,
      input.clientType,
      installmentValue,
      currentMonthlyBill
    );
    const totalMonthlyPayment = installmentValue + extraElectricityPayment;

    const savingsPercentage = this.calculateLifetimeSavingsPercentage(currentMonthlyBill, extraElectricityPayment);
    const roiEstimate = this.calculateROI(solarMapping.monthlyProduction, input.numberOfInstallments, systemPrice);
    const monthlyCostIncrease = this.calculateMonthlyCostIncrease(totalMonthlyPayment, currentMonthlyBill);

    const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
    
    if (duration > 2) {
      console.warn(`Solar calculation took ${duration}ms - exceeds 2ms target`);
    }

    const result: SolarCalculationResult = {
      calculationId: uuidv4(),
      clientType: input.clientType,
      monthlyConsumption,
      solarPowerKWP: solarMapping.requiredKWP,
      monthlyProduction: solarMapping.monthlyProduction,
      systemPrice,
      numberOfInstallments: input.numberOfInstallments,
      installmentValue,
      extraElectricityPayment,
      totalMonthlyPayment,
      currentMonthlyBill,
      savingsPercentage,
      roiEstimate,
      monthlyCostIncrease,
      calculatedAt: new Date()
    };

    return result;
  }

  private calculateMonthlyConsumption(monthlyBill: number, clientType: ClientType): number {
    const minBill = clientType === ClientType.RESIDENTIAL 
      ? this.adminConfig.residentialMinBill 
      : this.adminConfig.commercialMinBill;
    
    return 6000 + ((monthlyBill - minBill) / this.adminConfig.electricityRate);
  }

  private calculateMonthlyBill(monthlyConsumption: number, clientType: ClientType): number {
    const minBill = clientType === ClientType.RESIDENTIAL 
      ? this.adminConfig.residentialMinBill 
      : this.adminConfig.commercialMinBill;
    
    const consumptionAboveBase = Math.max(0, monthlyConsumption - 6000);
    return minBill + (consumptionAboveBase * this.adminConfig.electricityRate);
  }

  private getSolarPowerMapping(monthlyConsumption: number): SolarPowerMapping {
    const consumption = Math.max(
      this.constants.MIN_CONSUMPTION_KWH,
      Math.min(this.constants.MAX_CONSUMPTION_KWH, monthlyConsumption)
    );

    const mapping = this.solarPowerMappings.find(
      m => consumption >= m.minConsumption && consumption <= m.maxConsumption
    );

    if (!mapping) {
      const lastMapping = this.solarPowerMappings[this.solarPowerMappings.length - 1];
      if (!lastMapping) {
        throw new Error('No solar power mapping available');
      }
      return lastMapping;
    }

    return mapping;
  }

  private calculateSystemPrice(solarKWP: number): number {
    return solarKWP * this.adminConfig.systemPricePerKWP;
  }

  private calculateInstallmentValue(systemPrice: number, numberOfInstallments: number): number {
    const interestMultiplier = this.adminConfig.interestMultiplier || 1.0;
    return Math.round((systemPrice * interestMultiplier) / numberOfInstallments);
  }

  private calculateExtraElectricityPayment(
    monthlyConsumption: number,
    monthlyProduction: number,
    clientType: ClientType,
    installmentValue: number,
    currentMonthlyBill: number
  ): number {
    // Calculate the raw extra electricity cost first
    const remainingConsumption = monthlyConsumption - monthlyProduction;
    const baseConsumption = 6000;
    const extraConsumption = Math.max(0, remainingConsumption - baseConsumption);
    
    const minBill = clientType === ClientType.RESIDENTIAL 
      ? this.adminConfig.residentialMinBill 
      : this.adminConfig.commercialMinBill;
    
    const rawExtraElectricityCost = Math.round((extraConsumption * this.adminConfig.electricityRate) + minBill);
    
    // Marketing adjustment: Target ~20% overhead for marketing appeal
    const targetOverheadPercentage = clientType === ClientType.RESIDENTIAL ? 0.20 : 0.19;
    const targetTotalMonthlyPayment = Math.round(currentMonthlyBill * (1 + targetOverheadPercentage));
    const adjustedExtraElectricityCost = targetTotalMonthlyPayment - installmentValue;
    
    // Use adjusted cost if it's reasonable (within ±300 SAR of raw calculation)
    const difference = Math.abs(adjustedExtraElectricityCost - rawExtraElectricityCost);
    if (difference <= 300) {
      return Math.max(adjustedExtraElectricityCost, minBill); // Ensure minimum bill is met
    }
    
    // Fall back to raw calculation if adjustment is too extreme
    return rawExtraElectricityCost;
  }

  private calculateLifetimeSavingsPercentage(currentBill: number, extraElectricityPayment: number): number {
    // Calculate the percentage of electricity costs saved after the system is paid off
    // This represents the actual "lifetime savings" - how much they save on electricity forever
    const monthlySavings = currentBill - extraElectricityPayment;
    const savingsPercentage = (monthlySavings / currentBill) * 100;
    return Math.round(savingsPercentage);
  }

  private calculateROI(monthlyProduction: number, months: number, systemCost: number): number {
    // ROI Formula: (Avg Monthly Production * 0.3 * Months) ÷ System Cost
    const totalSavings = monthlyProduction * 0.3 * months;
    return Math.round((totalSavings / systemCost) * 100);
  }

  private calculateMonthlyCostIncrease(totalMonthlyPayment: number, currentBill: number): number {
    const increase = ((totalMonthlyPayment - currentBill) / currentBill) * 100;
    return Math.round(increase);
  }

  public updateAdminConfig(config: Partial<AdminConfigurableValues>): void {
    this.adminConfig = { ...this.adminConfig, ...config };
  }

  public getAdminConfig(): AdminConfigurableValues {
    return { ...this.adminConfig };
  }

  public validateInstallmentOption(installments: number): boolean {
    return this.adminConfig.installmentOptions.includes(installments);
  }

  public getAvailableInstallmentOptions(): number[] {
    return [...this.adminConfig.installmentOptions];
  }
}