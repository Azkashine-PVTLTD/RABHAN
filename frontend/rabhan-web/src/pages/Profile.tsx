import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { userService, UpdateProfileData } from '../services/user.service';
import { authService } from '../services/auth.service';
import { documentService } from '../services/document.service';
import { useGeolocation } from '../hooks/useGeolocation';

interface ProfileProps {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    phone?: string;
    national_id?: string;
    
    // Address Information
    region?: string;
    city?: string;
    district?: string;
    street_address?: string;
    landmark?: string;
    postal_code?: string;
    
    // Property & Energy Information
    property_type?: string;
    property_ownership?: string;
    roof_size?: string;
    gps_latitude?: string;
    gps_longitude?: string;
    electricity_consumption?: string;
    electricity_meter_number?: string;
    monthly_electricity_bill?: string;
    
    // Employment Information
    monthly_income?: string;
    employment_status?: string;
    employer_name?: string;
    job_title?: string;
    years_employed?: string;
    
    // Personal Information
    date_of_birth?: string;
    marital_status?: string;
    dependents?: string;
    
    // Solar & BNPL Information
    desired_system_size?: string;
    budget_range?: string;
    installation_timeline?: string;
    financing_preference?: string;
    special_requirements?: string;
    bnpl_max_amount?: string;
    bnpl_eligible?: boolean;
    
    // Verification & Compliance
    sama_verified?: boolean;
    nafath_verified?: boolean;
    profile_completed?: boolean;
    profile_completion_percentage?: number;
    
    // Preferences
    preferred_language?: string;
    email_notifications?: boolean;
    sms_notifications?: boolean;
    marketing_consent?: boolean;
  };
  onUpdate?: (section: string, data: any) => void;
}

const Profile: React.FC<ProfileProps> = ({ user: initialUser, onUpdate }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeSection, setActiveSection] = useState('personal');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  
  // State for user data that updates with auth service
  const [user, setUser] = useState(initialUser);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Subscribe to auth service changes to get updated user data
  useEffect(() => {
    const unsubscribe = authService.subscribe((authState) => {
      if (authState.user) {
        console.log('🔄 User data updated from auth service:', authState.user);
        setUser(authState.user);
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Load user profile data from user service on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        console.log('📥 Loading user profile from user service...');
        
        const result = await userService.getProfile();
        if (result.success && result.profile) {
          console.log('✅ User profile loaded successfully:', result.profile);
          setUserProfile(result.profile);
          
          // Merge user profile data with auth user data
          const mergedUser = {
            ...user,
            // Auth service fields
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            phone: user.phone,
            national_id: user.national_id,
            // User service profile fields  
            region: result.profile.region,
            city: result.profile.city,
            district: result.profile.district,
            street_address: result.profile.streetAddress,
            landmark: result.profile.landmark,
            postal_code: result.profile.postalCode,
            property_type: result.profile.propertyType,
            property_ownership: result.profile.propertyOwnership,
            roof_size: result.profile.roofSize?.toString(),
            gps_latitude: result.profile.gpsLatitude?.toString(),
            gps_longitude: result.profile.gpsLongitude?.toString(),
            electricity_consumption: result.profile.electricityConsumption,
            electricity_meter_number: result.profile.electricityMeterNumber,
            preferred_language: result.profile.preferredLanguage,
            email_notifications: result.profile.emailNotifications,
            sms_notifications: result.profile.smsNotifications,
            marketing_consent: result.profile.marketingConsent,
          };
          
          console.log('🔗 Merged user data:', mergedUser);
          setUser(mergedUser);
        } else {
          console.log('⚠️ No user profile found or failed to load:', result.error);
        }
      } catch (error) {
        console.error('❌ Error loading user profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    // Only load profile if we have a user ID from auth
    if (user.id) {
      loadUserProfile();
    }
  }, [user.id]); // Depend on user.id to reload when user changes
  
  const [formData, setFormData] = useState({
    personal: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      email: user.email || '',
      date_of_birth: user.date_of_birth || '',
      marital_status: user.marital_status || '',
      dependents: user.dependents || '',
    },
    address: {
      region: user.region || '',
      city: user.city || '',
      district: user.district || '',
      street_address: user.street_address || '',
      landmark: user.landmark || '',
      postal_code: user.postal_code || '',
      gps_latitude: user.gps_latitude || '',
      gps_longitude: user.gps_longitude || '',
    },
    verification: {
      national_id: user.national_id || '',
      sama_verified: user.sama_verified || false,
      nafath_verified: user.nafath_verified || false,
    },
    employment: {
      employment_status: user.employment_status || '',
      employer_name: user.employer_name || '',
      job_title: user.job_title || '',
      monthly_income: user.monthly_income || '',
      years_employed: user.years_employed || '',
    },
    property: {
      property_type: (user as any).propertyType || user.property_type || '',
      property_ownership: (user as any).propertyOwnership || user.property_ownership || '',
      roof_size: (user as any).roofSize || user.roof_size || '',
      electricity_consumption: (user as any).electricityConsumption || user.electricity_consumption || '',
      electricity_meter_number: (user as any).electricityMeterNumber || user.electricity_meter_number || '',
    },
    preferences: {
      preferred_language: user.preferred_language || 'ar',
      email_notifications: user.email_notifications || true,
      sms_notifications: user.sms_notifications || true,
      marketing_consent: user.marketing_consent || false,
    }
  });

  // Update form data when user data changes
  useEffect(() => {
    console.log('📋 Updating form data with new user data:', user);
    setFormData({
      personal: {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        email: user.email || '',
        date_of_birth: user.date_of_birth || '',
        marital_status: user.marital_status || '',
        dependents: user.dependents || '',
      },
      address: {
        region: user.region || '',
        city: user.city || '',
        district: user.district || '',
        street_address: user.street_address || '',
        landmark: user.landmark || '',
        postal_code: user.postal_code || '',
        gps_latitude: user.gps_latitude || '',
        gps_longitude: user.gps_longitude || '',
      },
      verification: {
        national_id: user.national_id || '',
        sama_verified: user.sama_verified || false,
        nafath_verified: user.nafath_verified || false,
      },
      employment: {
        employment_status: user.employment_status || '',
        employer_name: user.employer_name || '',
        job_title: user.job_title || '',
        monthly_income: user.monthly_income || '',
        years_employed: user.years_employed || '',
      },
      property: {
        property_type: (user as any).propertyType || user.property_type || '',
        property_ownership: (user as any).propertyOwnership || user.property_ownership || '',
        roof_size: (user as any).roofSize || user.roof_size || '',
        electricity_consumption: (user as any).electricityConsumption || user.electricity_consumption || '',
        electricity_meter_number: (user as any).electricityMeterNumber || user.electricity_meter_number || '',
      },
      preferences: {
        preferred_language: user.preferred_language || 'ar',
        email_notifications: user.email_notifications || true,
        sms_notifications: user.sms_notifications || true,
        marketing_consent: user.marketing_consent || false,
      }
    });
  }, [user]);

  // Calculate profile completion based on Beta V2 requirements
  const calculateCompletion = () => {
    const essentialFields = [
      // Basic Personal Info (Required)
      user.first_name,
      user.last_name,
      user.email,
      user.phone,
      user.national_id,
      
      // Address Info (Required for KYC)
      user.region,
      user.city,
      user.district,
      user.street_address,
      user.postal_code,
      
      // Property Info (Required for Solar)
      (user as any).propertyType || user.property_type,
      (user as any).propertyOwnership || user.property_ownership,
      (user as any).roofSize || user.roof_size,
      (user as any).electricityConsumption || user.electricity_consumption,
      (user as any).electricityMeterNumber || user.electricity_meter_number,
      
      // Employment Info (Required for BNPL)
      user.employment_status,
      user.monthly_income,
    ];
    
    const optionalFields = [
      user.landmark,
      user.employer_name,
      user.job_title,
      user.date_of_birth,
      user.marital_status,
      user.desired_system_size,
      user.budget_range,
    ];
    
    const filledEssential = essentialFields.filter(field => field && field.toString().trim() !== '').length;
    const filledOptional = optionalFields.filter(field => field && field.toString().trim() !== '').length;
    
    // Essential fields worth 80%, optional worth 20%
    const essentialPercent = (filledEssential / essentialFields.length) * 80;
    const optionalPercent = (filledOptional / optionalFields.length) * 20;
    
    return Math.round(essentialPercent + optionalPercent);
  };

  const completionPercentage = calculateCompletion();

  // Get user initials
  const getUserInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    } else if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    } else if (user.last_name) {
      return user.last_name.charAt(0).toUpperCase();
    } else {
      return user.email.charAt(0).toUpperCase();
    }
  };

  // Real-time input validation and formatting
  const formatAndValidateInput = (field: string, value: string): string => {
    switch (field) {
      case 'first_name':
      case 'last_name':
        // Only allow letters, spaces, and Arabic characters, max 25 chars
        return value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '').slice(0, 25);
      
      case 'phone':
        // Saudi phone format: +966 followed by 9 digits
        const digits = value.replace(/\D/g, '');
        if (digits.startsWith('966')) {
          const phoneDigits = digits.slice(3, 12); // Max 9 digits after 966
          return phoneDigits.length > 0 ? `+966${phoneDigits}` : '+966';
        } else if (digits.startsWith('0')) {
          // Convert local format (05xxxxxxxx) to international
          const phoneDigits = digits.slice(1, 10); // Max 9 digits after removing 0
          return phoneDigits.length > 0 ? `+966${phoneDigits}` : '+966';
        } else {
          const phoneDigits = digits.slice(0, 9); // Max 9 digits
          return phoneDigits.length > 0 ? `+966${phoneDigits}` : '+966';
        }
      
      case 'national_id':
        // Saudi National ID: 10 digits starting with 1 or 2
        const idDigits = value.replace(/\D/g, '');
        if (idDigits.length === 0) return '';
        if (idDigits[0] !== '1' && idDigits[0] !== '2') {
          return idDigits[0] === '1' || idDigits[0] === '2' ? idDigits.slice(0, 10) : '';
        }
        return idDigits.slice(0, 10);
      
      case 'city':
      case 'district':
        // Letters, Arabic, spaces, hyphens only, max 30 chars
        return value.replace(/[^a-zA-Z\u0600-\u06FF\s-]/g, '').slice(0, 30);
      
      case 'street_address':
        // Alphanumeric, Arabic, spaces, basic punctuation, max 50 chars
        return value.replace(/[^a-zA-Z0-9\u0600-\u06FF\s.,/-]/g, '').slice(0, 50);
      
      case 'landmark':
        // Alphanumeric, Arabic, spaces, basic punctuation, max 50 chars
        return value.replace(/[^a-zA-Z0-9\u0600-\u06FF\s.,/-]/g, '').slice(0, 50);
      
      case 'postal_code':
        // Exactly 5 digits
        return value.replace(/\D/g, '').slice(0, 5);
      
      case 'employer_name':
      case 'job_title':
        // Letters, Arabic, spaces, basic punctuation, max 50 chars
        return value.replace(/[^a-zA-Z\u0600-\u06FF\s.,&-]/g, '').slice(0, 50);
      
      case 'monthly_income':
        // Positive numbers only, max 7 digits (9,999,999 SAR)
        const income = value.replace(/\D/g, '').slice(0, 7);
        return income === '0' ? '' : income; // Prevent leading zeros
      
      case 'years_employed':
        // Max 50 years
        const years = value.replace(/\D/g, '').slice(0, 2);
        return years === '0' ? '' : Math.min(parseInt(years) || 0, 50).toString();
      
      case 'dependents':
        // Max 20 dependents
        const deps = value.replace(/\D/g, '').slice(0, 2);
        return deps === '0' ? '' : Math.min(parseInt(deps) || 0, 20).toString();
      
      case 'roof_size':
        // Min 10, max 10000 square meters
        const roof = value.replace(/\D/g, '').slice(0, 5);
        if (roof === '') return '';
        const roofSize = parseInt(roof) || 0;
        if (roofSize < 10 && roof !== '') return '10';
        return Math.min(roofSize, 10000).toString();
      
      case 'electricity_meter_number':
        // 6-15 alphanumeric characters, uppercase
        return value.replace(/[^A-Z0-9]/g, '').slice(0, 15);
      
      default:
        return value;
    }
  };

  // Real-time validation check
  const validateFieldRealtime = (field: string, value: string): { isValid: boolean; message?: string } => {
    switch (field) {
      case 'first_name':
      case 'last_name':
        if (value.length < 2) return { isValid: false, message: t('validation.nameMinLength') || 'Name must be at least 2 characters' };
        if (value.length > 25) return { isValid: false, message: t('validation.nameMaxLength') || 'Name must be 25 characters or less' };
        if (!/^[a-zA-Z\u0600-\u06FF\s]+$/.test(value)) return { isValid: false, message: t('validation.nameInvalid') || 'Name can only contain letters and spaces' };
        return { isValid: true };
      
      case 'phone':
        if (!value.startsWith('+966')) return { isValid: false, message: t('validation.phoneFormat') || 'Phone must start with +966' };
        if (value.length !== 13) return { isValid: false, message: t('validation.phoneLength') || 'Phone must be 13 characters (+966xxxxxxxxx)' };
        return { isValid: true };
      
      case 'national_id':
        if (value.length !== 10) return { isValid: false, message: t('validation.nationalIdLength') || 'National ID must be exactly 10 digits' };
        if (!/^[12]/.test(value)) return { isValid: false, message: t('validation.nationalIdStart') || 'National ID must start with 1 or 2' };
        return { isValid: true };
      
      case 'city':
      case 'district':
        if (value.length < 2) return { isValid: false, message: t('validation.cityMinLength') || 'City must be at least 2 characters' };
        if (value.length > 30) return { isValid: false, message: t('validation.cityMaxLength') || 'City must be 30 characters or less' };
        return { isValid: true };
      
      case 'street_address':
        if (value.length < 5) return { isValid: false, message: t('validation.streetMinLength') || 'Street address must be at least 5 characters' };
        if (value.length > 50) return { isValid: false, message: t('validation.streetMaxLength') || 'Street address must be 50 characters or less' };
        return { isValid: true };
      
      case 'postal_code':
        if (value.length !== 5) return { isValid: false, message: t('validation.postalCodeLength') || 'Postal code must be exactly 5 digits' };
        return { isValid: true };
      
      case 'monthly_income':
        const income = parseInt(value) || 0;
        if (income < 3000) return { isValid: false, message: t('validation.incomeMinimum') || 'Monthly income must be at least 3,000 SAR' };
        if (income > 9999999) return { isValid: false, message: t('validation.incomeMaximum') || 'Monthly income cannot exceed 9,999,999 SAR' };
        return { isValid: true };
      
      case 'years_employed':
        const years = parseInt(value) || 0;
        if (years > 50) return { isValid: false, message: t('validation.yearsMaximum') || 'Years employed cannot exceed 50' };
        return { isValid: true };
      
      case 'dependents':
        const deps = parseInt(value) || 0;
        if (deps > 20) return { isValid: false, message: t('validation.dependentsMaximum') || 'Number of dependents cannot exceed 20' };
        return { isValid: true };
      
      case 'roof_size':
        const roof = parseInt(value) || 0;
        if (roof < 10) return { isValid: false, message: t('validation.roofSizeMinimum') || 'Roof size must be at least 10 square meters' };
        if (roof > 10000) return { isValid: false, message: t('validation.roofSizeMaximum') || 'Roof size cannot exceed 10,000 square meters' };
        return { isValid: true };
      
      case 'electricity_meter_number':
        if (value.length < 6) return { isValid: false, message: t('validation.meterNumberMinLength') || 'Meter number must be at least 6 characters' };
        if (value.length > 15) return { isValid: false, message: t('validation.meterNumberMaxLength') || 'Meter number cannot exceed 15 characters' };
        return { isValid: true };
      
      case 'employer_name':
        if (value.length > 0 && value.length < 2) return { isValid: false, message: t('validation.employerMinLength') || 'Employer name must be at least 2 characters' };
        return { isValid: true };
      
      case 'job_title':
        if (value.length > 0 && value.length < 2) return { isValid: false, message: t('validation.jobTitleMinLength') || 'Job title must be at least 2 characters' };
        return { isValid: true };
      
      default:
        return { isValid: true };
    }
  };

  const handleInputChange = (section: string, field: string, rawValue: string) => {
    // Format and validate the input
    const formattedValue = formatAndValidateInput(field, rawValue);
    
    // Perform real-time validation
    const validation = validateFieldRealtime(field, formattedValue);
    
    // Update field validation state
    setFieldValidation(prev => ({
      ...prev,
      [field]: validation
    }));
    
    // Clear any existing errors for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: formattedValue
      }
    }));
  };

  // Validation functions
  const validateField = (field: string, value: any, section: string): string | null => {
    if (!value || value === '') {
      // Check if field is required
      const requiredFields = {
        personal: ['first_name', 'last_name'],
        address: ['region', 'city', 'postal_code'],
        property: ['property_type', 'property_ownership', 'roof_size', 'electricity_consumption', 'electricity_meter_number'],
        employment: ['employment_status']
      };
      
      const sectionRequiredFields = requiredFields[section as keyof typeof requiredFields] || [];
      if (sectionRequiredFields.includes(field)) {
        // Use consistent validation key format
        switch (field) {
          case 'first_name':
            return t('auth.register.validation.firstNameRequired') || t('validation.firstName_required') || 'First name is required';
          case 'last_name':
            return t('auth.register.validation.lastNameRequired') || t('validation.lastName_required') || 'Last name is required';
          case 'region':
            return t('auth.register.validation.regionRequired') || 'Region is required';
          case 'city':
            return t('auth.register.validation.cityRequired') || 'City is required';
          case 'postal_code':
            return t('auth.register.validation.postalCodeRequired') || 'Postal code is required';
          case 'property_type':
            return t('auth.register.validation.propertyTypeRequired') || 'Property type is required';
          case 'property_ownership':
            return t('auth.register.validation.propertyOwnershipRequired') || 'Property ownership is required';
          case 'roof_size':
            return t('auth.register.validation.roofSizeRequired') || 'Roof size is required';
          case 'electricity_consumption':
            return t('auth.register.validation.electricityConsumptionRequired') || 'Electricity consumption is required';
          case 'electricity_meter_number':
            return t('auth.register.validation.meterNumberRequired') || 'Meter number is required';
          case 'employment_status':
            return t('auth.register.validation.employmentStatusRequired') || 'Employment status is required';
          default:
            return t(`auth.register.validation.${field}Required`) || `${field.replace('_', ' ')} is required`;
        }
      }
      return null;
    }

    // Field-specific validations
    switch (field) {
      case 'first_name':
      case 'last_name':
        if (value.length > 25) return t('auth.register.validation.nameMaxLength') || 'Name must be 25 characters or less';
        if (!/^[a-zA-Z\u0600-\u06FF\s]+$/.test(value)) return t('auth.register.validation.nameInvalid') || 'Name can only contain letters and spaces';
        break;
      
      case 'postal_code':
        if (!/^\d{5}$/.test(value)) return t('auth.register.validation.postalCodeInvalid') || 'Postal code must be exactly 5 digits';
        break;
      
      case 'city':
      case 'district':
        if (value.length > 30) return t('auth.register.validation.cityMaxLength') || 'City name must be 30 characters or less';
        if (!/^[a-zA-Z\u0600-\u06FF\s-]+$/.test(value)) return t('auth.register.validation.cityInvalid') || 'City name can only contain letters, spaces, and hyphens';
        break;
      
      case 'street_address':
        if (value.length > 50) return t('auth.register.validation.streetAddressMaxLength') || 'Street address must be 50 characters or less';
        break;
      
      case 'landmark':
        if (value.length > 50) return t('auth.register.validation.landmarkMaxLength') || 'Landmark must be 50 characters or less';
        break;
      
      case 'roof_size':
        const roofSize = Number(value);
        if (isNaN(roofSize) || roofSize < 10 || roofSize > 10000) {
          return t('auth.register.validation.roofSizeInvalid') || 'Roof size must be between 10 and 10,000 square meters';
        }
        break;
      
      case 'electricity_meter_number':
        if (value.length < 6 || value.length > 15) return t('auth.register.validation.meterNumberLength') || 'Meter number must be between 6 and 15 characters';
        if (!/^[A-Z0-9]+$/.test(value)) return t('auth.register.validation.meterNumberInvalid') || 'Meter number can only contain letters and numbers';
        break;
      
      case 'property_type':
        const validPropertyTypes = ['VILLA', 'APARTMENT', 'DUPLEX', 'TOWNHOUSE', 'COMMERCIAL', 'INDUSTRIAL', 'OTHER'];
        if (!validPropertyTypes.includes(value)) return t('auth.register.validation.propertyTypeRequired') || 'Please select a valid property type';
        break;
      
      case 'property_ownership':
        const validOwnership = ['OWNED', 'RENTED', 'LEASED', 'FAMILY_OWNED'];
        if (!validOwnership.includes(value)) return t('auth.register.validation.propertyOwnershipRequired') || 'Please select a valid ownership type';
        break;
      
      case 'region':
        const validRegions = ['riyadh', 'makkah', 'eastern', 'asir', 'tabuk', 'qassim', 'hail', 'northern', 'jazan', 'najran', 'bahah', 'jouf', 'madinah'];
        if (!validRegions.includes(value.toLowerCase())) return t('auth.register.validation.regionInvalid') || 'Please select a valid region';
        break;
    }
    
    return null;
  };

  const validateSection = (section: string, data: any): Record<string, string> => {
    const sectionErrors: Record<string, string> = {};
    
    Object.keys(data).forEach(field => {
      const error = validateField(field, data[field], section);
      if (error) {
        sectionErrors[field] = error;
      }
    });
    
    return sectionErrors;
  };

  const handleSave = async (section: string) => {
    const sectionData = formData[section as keyof typeof formData];
    
    console.log('🔄 Saving section:', section, 'with data:', sectionData);
    
    // Clear previous errors and success message
    setErrors({});
    setSuccessMessage('');
    
    // Validate the section data
    const sectionErrors = validateSection(section, sectionData);
    if (Object.keys(sectionErrors).length > 0) {
      setErrors(sectionErrors);
      return;
    }
    
    setSaving(true);
    
    try {
      // Define which fields go to auth service vs user service
      const authFields = ['first_name', 'last_name', 'email', 'phone'];
      
      // Prepare separate data objects
      const authData: any = {};
      const profileData: UpdateProfileData = {};
      
      // Map form fields to appropriate service data
      Object.keys(sectionData).forEach(field => {
        const value = sectionData[field as keyof typeof sectionData];
        if (value !== undefined && value !== null && value !== '') {
          
          if (authFields.includes(field)) {
            // Auth service fields (snake_case)
            authData[field] = value;
          } else {
            // User service fields (camelCase conversion)
            switch (field) {
              case 'street_address':
                profileData.streetAddress = value as string;
                break;
              case 'postal_code':
                profileData.postalCode = value as string;
                break;
              case 'property_type':
                profileData.propertyType = value as string;
                break;
              case 'property_ownership':
                profileData.propertyOwnership = value as string;
                break;
              case 'roof_size':
                profileData.roofSize = Number(value);
                break;
              case 'electricity_consumption':
                profileData.electricityConsumption = value as string;
                break;
              case 'electricity_meter_number':
                profileData.electricityMeterNumber = value as string;
                break;
              case 'gps_latitude':
                profileData.gpsLatitude = Number(value);
                break;
              case 'gps_longitude':
                profileData.gpsLongitude = Number(value);
                break;
              case 'preferred_language':
                profileData.preferredLanguage = value as string;
                break;
              case 'email_notifications':
                profileData.emailNotifications = Boolean(value);
                break;
              case 'sms_notifications':
                profileData.smsNotifications = Boolean(value);
                break;
              case 'marketing_consent':
                profileData.marketingConsent = Boolean(value);
                break;
              default:
                // For fields that match exactly
                (profileData as any)[field] = value;
            }
          }
        }
      });
      
      console.log('📤 Auth data:', authData);
      console.log('📤 Profile data:', profileData);
      
      // Make API calls to appropriate services
      let authResult = { success: true };
      let profileResult = { success: true };
      
      // Update auth service if auth fields are present
      if (Object.keys(authData).length > 0) {
        console.log('🔄 Updating auth service...');
        authResult = await authService.updateCurrentUser(authData);
        if (!authResult.success) {
          setErrors({ general: authResult.error || 'Failed to update personal information' });
          return;
        }
      }
      
      // Update user service if profile fields are present  
      if (Object.keys(profileData).length > 0) {
        console.log('🔄 Updating user service...');
        profileResult = await userService.updateProfile(undefined, profileData);
        if (!profileResult.success) {
          setErrors({ general: profileResult.error || 'Failed to update profile information' });
          return;
        }
      }
      
      // Both updates successful
      if (authResult.success && profileResult.success) {
        setSuccessMessage(t('userApp.profile.updateSuccess'));
        
        // Refresh user data from the API to get updated profile
        const refreshResult = await authService.refreshUserData();
        if (refreshResult.success) {
          console.log('✅ User data refreshed after profile update');
        }
        
        // If preferences section and language was changed, apply the language change
        if (section === 'preferences' && sectionData.preferred_language) {
          i18n.changeLanguage(sectionData.preferred_language);
        }
        
        // Call parent component's onUpdate callback if provided
        onUpdate?.(section, sectionData);
        
        setEditingSection(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      setErrors({ general: error.message || 'An unexpected error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (section: string) => {
    const originalData = {
      personal: {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        email: user.email || '',
        date_of_birth: user.date_of_birth || '',
        marital_status: user.marital_status || '',
        dependents: user.dependents || '',
      },
      address: {
        region: user.region || '',
        city: user.city || '',
        district: user.district || '',
        street_address: user.street_address || '',
        landmark: user.landmark || '',
        postal_code: user.postal_code || '',
        gps_latitude: user.gps_latitude || '',
        gps_longitude: user.gps_longitude || '',
      },
      verification: {
        national_id: user.national_id || '',
        sama_verified: user.sama_verified || false,
        nafath_verified: user.nafath_verified || false,
      },
      employment: {
        employment_status: user.employment_status || '',
        employer_name: user.employer_name || '',
        job_title: user.job_title || '',
        monthly_income: user.monthly_income || '',
        years_employed: user.years_employed || '',
      },
      property: {
        property_type: (user as any).propertyType || user.property_type || '',
        property_ownership: (user as any).propertyOwnership || user.property_ownership || '',
        roof_size: (user as any).roofSize || user.roof_size || '',
        electricity_consumption: (user as any).electricityConsumption || user.electricity_consumption || '',
        electricity_meter_number: (user as any).electricityMeterNumber || user.electricity_meter_number || '',
      },
      preferences: {
        preferred_language: user.preferred_language || 'ar',
        email_notifications: user.email_notifications || true,
        sms_notifications: user.sms_notifications || true,
        marketing_consent: user.marketing_consent || false,
      }
    };
    
    setFormData(prev => ({
      ...prev,
      [section]: originalData[section as keyof typeof originalData]
    }));
    setEditingSection(null);
  };

  // Handle getting current location
  const handleGetLocation = async () => {
    try {
      clearError(); // Clear any previous errors
      const locationData = await getCurrentLocation();
      
      // Update form data with location information
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          landmark: locationData.landmark,
          gps_latitude: locationData.latitude.toString(),
          gps_longitude: locationData.longitude.toString(),
        }
      }));

      // Show success message
      setSuccessMessage(t('userApp.profile.locationSuccess'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error getting location:', error);
      // Error is already handled by the hook, just log it
    }
  };

  // Professional SVG Icons for RABHAN Solar BNPL Platform
  const getMenuIcon = (iconType: string) => {
    const iconStyle = {
      width: '20px',
      height: '20px',
      fill: 'currentColor',
    };

    switch (iconType) {
      case 'personal':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.66 13.66 12 12 12S9 10.66 9 12V9L3 7.5V9C3 11.81 5.19 14 8 14V22H10V16H14V22H16V14C18.81 14 21 11.81 21 9Z"/>
          </svg>
        );
      case 'address':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z"/>
          </svg>
        );
      case 'verification':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M23 12L20.56 9.22L20.9 5.54L17.29 4.72L15.4 1.54L12 3L8.6 1.54L6.71 4.72L3.1 5.53L3.44 9.21L1 12L3.44 14.78L3.1 18.47L6.71 19.29L8.6 22.47L12 21L15.4 22.46L17.29 19.28L20.9 18.46L20.56 14.78L23 12ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
          </svg>
        );
      case 'documents':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM9 13V19H7V13H9ZM17 11V19H15V11H17ZM13 15V19H11V15H13Z"/>
          </svg>
        );
      case 'employment':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H8V10H10V8H14V10H16V8H20V19Z"/>
          </svg>
        );
      case 'property':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z"/>
          </svg>
        );
      case 'preferences':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12S19.18 11.36 19.14 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.93 5.93 15.45 5.64 14.92 5.43L14.6 2.83C14.57 2.6 14.37 2.43 14.12 2.43H10.3C10.05 2.43 9.85 2.6 9.82 2.83L9.5 5.43C8.97 5.64 8.5 5.92 8.04 6.29L5.65 5.33C5.43 5.25 5.18 5.33 5.06 5.55L3.14 8.87C3.03 9.07 3.08 9.34 3.27 9.48L5.29 11.06C5.25 11.36 5.23 11.67 5.23 12S5.25 12.64 5.29 12.94L3.27 14.52C3.09 14.66 3.04 14.93 3.15 15.13L5.07 18.45C5.19 18.67 5.44 18.74 5.66 18.67L8.05 17.71C8.5 18.07 8.98 18.36 9.51 18.57L9.83 21.17C9.86 21.4 10.06 21.57 10.31 21.57H14.13C14.38 21.57 14.58 21.4 14.61 21.17L14.93 18.57C15.46 18.36 15.94 18.08 16.39 17.71L18.78 18.67C19 18.75 19.25 18.67 19.37 18.45L21.29 15.13C21.4 14.93 21.35 14.66 21.16 14.52L19.14 12.94ZM12.22 16C9.93 16 8.08 14.15 8.08 11.86S9.93 7.72 12.22 7.72S16.36 9.57 16.36 11.86S14.51 16 12.22 16Z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Beta V2 Services Menu Items based on RABHAN Solar BNPL Platform
  const menuItems = [
    { id: 'personal', label: t('userApp.profile.tabs.personal'), icon: getMenuIcon('personal') },
    { id: 'address', label: t('userApp.profile.tabs.address'), icon: getMenuIcon('address') },
    { id: 'verification', label: t('userApp.profile.tabs.verification'), icon: getMenuIcon('verification') },
    { id: 'documents', label: 'KYC Documents', icon: getMenuIcon('documents') },
    { id: 'employment', label: t('userApp.profile.tabs.employment'), icon: getMenuIcon('employment') },
    { id: 'property', label: t('userApp.profile.tabs.property'), icon: getMenuIcon('property') },
    { id: 'preferences', label: t('userApp.profile.tabs.preferences'), icon: getMenuIcon('preferences') },
  ];

  // Enhanced mobile-first responsive hook
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1200);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1200);
  
  // Form state management
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldValidation, setFieldValidation] = useState<Record<string, { isValid: boolean; message?: string }>>({});
  const [documents, setDocuments] = useState<{[key: string]: any}>({});

  // Geolocation hook
  const { getCurrentLocation, loading: geoLoading, error: geoError, clearError } = useGeolocation({
    timeout: 15000,
    enableHighAccuracy: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1200);
      setIsDesktop(width >= 1200);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial state
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch user documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/profiles/me/documents', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const documentsMap = data.reduce((acc: any, doc: any) => {
            acc[doc.documentType] = doc;
            return acc;
          }, {});
          setDocuments(documentsMap);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, []);

  const styles = {
    container: {
      width: '100%',
      minHeight: '100vh',
      background: 'transparent',
    },
    card: {
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(62, 178, 177, 0.2)',
      boxShadow: '0 8px 32px rgba(62, 178, 177, 0.12)',
      overflow: 'hidden',
      margin: isMobile ? '1rem' : '2rem auto',
      minHeight: 'calc(100vh - 4rem)',
    },
    stickyHeader: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(62, 178, 177, 0.15)',
      padding: isMobile ? '1rem' : '1.5rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    contentLayout: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
      minHeight: 'calc(100vh - 8rem)',
    },
    leftSidebar: {
      background: 'rgba(62, 178, 177, 0.03)',
      borderRight: isMobile ? 'none' : '1px solid rgba(62, 178, 177, 0.15)',
      padding: isMobile ? '1rem' : '2rem 1.5rem',
      display: isMobile ? 'none' : 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem',
    },
    mobileMenu: {
      display: isMobile ? 'flex' : 'none',
      padding: '1rem',
      borderBottom: '1px solid rgba(62, 178, 177, 0.15)',
      background: 'rgba(62, 178, 177, 0.03)',
      overflowX: 'auto' as const,
      gap: '0.5rem',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isMobile ? 'center' : 'flex-start',
      gap: isMobile ? '0.25rem' : '0.75rem',
      padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
      borderRadius: isMobile ? '20px' : '12px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: isMobile ? '0.75rem' : '0.875rem',
      fontWeight: '500',
      color: '#6b7280',
      transition: 'all 0.2s ease-in-out',
      textAlign: isMobile ? 'center' as const : 'left' as const,
      whiteSpace: 'nowrap',
      minWidth: isMobile ? '80px' : 'auto',
      width: isMobile ? 'auto' : '100%',
      flex: isMobile ? '0 0 auto' : 'none',
    },
    activeMenuItem: {
      background: 'rgba(62, 178, 177, 0.1)',
      color: '#3eb2b1',
      fontWeight: '600',
    },
    rightContent: {
      padding: isMobile ? '1.5rem' : '2rem',
      overflow: 'auto',
    },
    profileInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    compactProgress: {
      display: 'flex',
      flexDirection: isMobile ? 'column' as const : 'row' as const,
      alignItems: 'center',
      gap: '1rem',
      minWidth: isMobile ? 'auto' : '200px',
    },
    avatar: {
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #3eb2b1 0%, #22d3db 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#ffffff',
      boxShadow: '0 8px 24px rgba(62, 178, 177, 0.25)',
      flexShrink: 0,
    },
    userInfo: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.25rem',
    },
    name: {
      fontSize: isMobile ? '1.125rem' : '1.25rem',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: 0,
      lineHeight: 1.2,
    },
    email: {
      fontSize: isMobile ? '0.75rem' : '0.813rem',
      color: '#6b7280',
      margin: 0,
      lineHeight: 1.2,
    },
    role: {
      display: 'inline-block',
      background: 'rgba(62, 178, 177, 0.1)',
      color: '#3eb2b1',
      padding: '0.25rem 0.75rem',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      marginTop: '0.25rem',
    },
    progressCircle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    progressText: {
      fontSize: isMobile ? '1.5rem' : '2rem',
      fontWeight: '700',
      background: `linear-gradient(135deg, #3eb2b1 0%, #22d3db 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    formContainer: {
      maxWidth: '800px',
      margin: '0 auto',
    },
    formHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid rgba(62, 178, 177, 0.15)',
    },
    formTitle: {
      fontSize: isMobile ? '1.25rem' : '1.5rem',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: 0,
    },
    editButton: {
      background: 'rgba(62, 178, 177, 0.1)',
      color: '#3eb2b1',
      border: 'none',
      borderRadius: isMobile ? '8px' : '6px',
      padding: isMobile ? '0.5rem 1rem' : '0.375rem 0.75rem',
      fontSize: isMobile ? '0.813rem' : '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: theme.transitions.fast,
      minHeight: isMobile ? '36px' : 'auto', // Touch target
      touchAction: 'manipulation',
    },
    fieldsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile 
        ? '1fr' 
        : isTablet 
        ? 'repeat(2, 1fr)' 
        : 'repeat(2, 1fr)', // Changed from 3 to 2 columns for better alignment
      gap: isMobile ? '1.5rem 0' : '1.5rem 2rem',
      alignItems: 'start',
    },
    field: {
      marginBottom: 0,
      display: 'flex',
      flexDirection: 'column' as const,
      width: '100%',
    },
    label: {
      fontSize: '0.875rem',
      color: '#6b7280',
      fontWeight: '600',
      marginBottom: '0.5rem',
      display: 'block',
      lineHeight: 1.2,
    },
    value: {
      fontSize: isMobile ? '1rem' : '0.938rem',
      color: '#1a1a1a',
      fontWeight: '500',
      lineHeight: 1.4,
      padding: isMobile ? '0.875rem 0' : '0.75rem 0',
      minHeight: '1.5rem',
      wordBreak: 'break-word' as const,
    },
    input: {
      width: '100%',
      padding: isMobile ? '1rem' : '0.875rem 1rem',
      fontSize: isMobile ? '1rem' : '0.938rem', // 16px min for iOS
      color: '#1a1a1a',
      background: 'rgba(62, 178, 177, 0.05)',
      border: '2px solid rgba(62, 178, 177, 0.2)',
      borderRadius: isMobile ? '12px' : '8px',
      outline: 'none',
      transition: 'all 0.2s ease-in-out',
      fontFamily: theme.typography.fonts.primary,
      minHeight: isMobile ? '52px' : '44px', // Better touch target
      touchAction: 'manipulation',
    },
    inputValid: {
      borderColor: '#10b981',
      background: 'rgba(16, 185, 129, 0.05)',
      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
    },
    inputInvalid: {
      borderColor: '#ef4444',
      background: 'rgba(239, 68, 68, 0.05)',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    },
    validationMessage: {
      fontSize: '0.75rem',
      fontWeight: '500',
      marginTop: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
    },
    validationSuccess: {
      color: '#10b981',
    },
    validationError: {
      color: '#ef4444',
    },
    characterCount: {
      fontSize: '0.75rem',
      color: '#6b7280',
      textAlign: 'right' as const,
      marginTop: '0.25rem',
    },
    empty: {
      fontSize: isMobile ? '1rem' : '0.938rem',
      color: '#9ca3af',
      fontStyle: 'italic',
      lineHeight: isMobile ? 1.5 : 1.4,
    },
    buttonGroup: {
      display: 'flex',
      flexDirection: isMobile ? 'column' as const : 'row' as const,
      gap: isMobile ? '0.75rem' : '1rem',
      marginTop: isMobile ? '1.5rem' : '2rem',
      justifyContent: isMobile ? 'stretch' : 'flex-end',
    },
    saveButton: {
      background: 'linear-gradient(135deg, #3eb2b1 0%, #22d3db 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: isMobile ? '12px' : '8px',
      padding: isMobile ? '1rem 1.5rem' : '0.75rem 1.5rem',
      fontSize: isMobile ? '1rem' : '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      minHeight: isMobile ? '52px' : '44px', // Better touch target
      boxShadow: '0 4px 12px rgba(62, 178, 177, 0.3)',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 6px 16px rgba(62, 178, 177, 0.4)'
      }
    },
    cancelButton: {
      background: 'rgba(107, 114, 128, 0.1)',
      color: '#6b7280',
      border: '2px solid rgba(107, 114, 128, 0.2)',
      borderRadius: isMobile ? '12px' : '8px',
      padding: isMobile ? '1rem 1.5rem' : '0.75rem 1.5rem',
      fontSize: isMobile ? '1rem' : '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      minHeight: isMobile ? '52px' : '44px', // Better touch target
      '&:hover': {
        background: 'rgba(107, 114, 128, 0.15)',
        borderColor: 'rgba(107, 114, 128, 0.3)'
      }
    },
    progressInfo: {
      display: isMobile ? 'none' : 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '0.5rem',
    },
    progressBar: {
      width: '60px',
      height: '6px',
      background: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '3px',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #3eb2b1 0%, #22d3db 100%)',
      width: `${completionPercentage}%`,
      borderRadius: '3px',
      transition: 'width 0.5s ease-out',
    },
    emptyState: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '400px',
      color: '#6b7280',
      fontSize: '1rem',
      textAlign: 'center' as const,
    },
    locationButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      width: '100%',
      padding: isMobile ? '1rem 1.5rem' : '0.875rem 1.25rem',
      background: 'linear-gradient(135deg, #3eb2b1 0%, #22d3db 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: isMobile ? '12px' : '8px',
      fontSize: isMobile ? '0.938rem' : '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      minHeight: isMobile ? '52px' : '44px',
      boxShadow: '0 4px 12px rgba(62, 178, 177, 0.3)',
      touchAction: 'manipulation',
    },
    locationButtonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
    locationIcon: {
      width: '18px',
      height: '18px',
      fill: 'currentColor',
    },
    gpsFieldsContainer: {
      gridColumn: '1 / -1', // Full width across all columns
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.25rem',
      padding: isMobile ? '1.25rem' : '1.5rem',
      background: 'rgba(62, 178, 177, 0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(62, 178, 177, 0.15)',
      marginTop: '1rem',
    },
    gpsFieldsHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.5rem',
    },
    gpsFieldsTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#6b7280',
      margin: 0,
    },
    gpsFieldsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: isMobile ? '1.25rem' : '1.5rem 2rem',
      alignItems: 'start',
    },
    gpsField: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem',
      width: '100%',
    },
  };

  const renderSelectedForm = () => {
    if (!activeSection) {
      return (
        <div style={styles.emptyState}>
          {t('userApp.profile.selectSection')}
        </div>
      );
    }

    const isEditing = editingSection === activeSection;
    const sectionData = {
      personal: [
        { field: 'first_name', label: t('auth.register.firstName'), value: user.first_name || '' },
        { field: 'last_name', label: t('auth.register.lastName'), value: user.last_name || '' },
        { field: 'phone', label: t('auth.register.phone'), value: user.phone || '', type: 'tel', verificationStatus: user.phone_verified },
        { field: 'email', label: t('auth.register.email'), value: user.email, type: 'email', readOnly: true, verificationStatus: user.email_verified },
        { field: 'date_of_birth', label: t('userApp.profile.dateOfBirth'), value: user.date_of_birth || '', type: 'date' },
        { field: 'marital_status', label: t('userApp.profile.maritalStatus'), value: user.marital_status || '', type: 'dropdown', options: [
          { value: 'single', label: t('userApp.profile.maritalStatus.single') },
          { value: 'married', label: t('userApp.profile.maritalStatus.married') },
          { value: 'divorced', label: t('userApp.profile.maritalStatus.divorced') },
          { value: 'widowed', label: t('userApp.profile.maritalStatus.widowed') },
        ]},
        { field: 'dependents', label: t('userApp.profile.dependents'), value: user.dependents || '', type: 'number' },
      ],
      address: [
        { field: 'region', label: t('auth.register.region'), value: user.region || '', type: 'dropdown', options: [
          { value: 'riyadh', label: t('auth.register.regions.riyadh') },
          { value: 'makkah', label: t('auth.register.regions.makkah') },
          { value: 'eastern', label: t('auth.register.regions.eastern') },
          { value: 'asir', label: t('auth.register.regions.asir') },
          { value: 'tabuk', label: t('auth.register.regions.tabuk') },
          { value: 'qassim', label: t('auth.register.regions.qassim') },
          { value: 'hail', label: t('auth.register.regions.hail') },
          { value: 'northern', label: t('auth.register.regions.northern') },
          { value: 'jazan', label: t('auth.register.regions.jazan') },
          { value: 'najran', label: t('auth.register.regions.najran') },
          { value: 'bahah', label: t('auth.register.regions.bahah') },
          { value: 'jouf', label: t('auth.register.regions.jouf') },
          { value: 'madinah', label: t('auth.register.regions.madinah') },
        ]},
        { field: 'city', label: t('auth.register.city'), value: user.city || '' },
        { field: 'district', label: t('auth.register.district'), value: user.district || '' },
        { field: 'street_address', label: t('auth.register.streetAddress'), value: user.street_address || '' },
        { field: 'postal_code', label: t('userApp.profile.postalCode'), value: user.postal_code || '' },
      ],
      verification: [
        { field: 'national_id', label: t('auth.register.nationalId'), value: user.national_id || '' },
        { field: 'sama_verified', label: t('userApp.profile.samaVerified'), value: user.sama_verified ? t('common.yes') : t('common.no') },
        { field: 'nafath_verified', label: t('userApp.profile.nafathVerified'), value: user.nafath_verified ? t('common.yes') : t('common.no') },
      ],
      employment: [
        { field: 'employment_status', label: t('auth.register.employmentStatus'), value: user.employment_status || '', type: 'dropdown', options: [
          { value: 'government', label: t('auth.register.employment.government') },
          { value: 'private', label: t('auth.register.employment.private') },
          { value: 'selfEmployed', label: t('auth.register.employment.selfEmployed') },
          { value: 'retired', label: t('auth.register.employment.retired') },
          { value: 'student', label: t('auth.register.employment.student') },
        ]},
        { field: 'employer_name', label: t('auth.register.employerName'), value: user.employer_name || '' },
        { field: 'job_title', label: t('userApp.profile.jobTitle'), value: user.job_title || '' },
        { field: 'monthly_income', label: t('auth.register.monthlyIncome'), value: user.monthly_income || '', type: 'number' },
        { field: 'years_employed', label: t('userApp.profile.yearsEmployed'), value: user.years_employed || '', type: 'number' },
      ],
      property: [
        { field: 'property_type', label: t('auth.register.propertyType'), value: (user as any).propertyType || user.property_type || '', type: 'dropdown', options: [
          { value: 'VILLA', label: t('auth.register.propertyTypes.villa') },
          { value: 'APARTMENT', label: t('auth.register.propertyTypes.apartment') },
          { value: 'DUPLEX', label: t('auth.register.propertyTypes.duplex') },
          { value: 'TOWNHOUSE', label: t('auth.register.propertyTypes.townhouse') },
          { value: 'COMMERCIAL', label: t('auth.register.propertyTypes.commercial') },
          { value: 'INDUSTRIAL', label: 'Industrial' },
          { value: 'OTHER', label: t('auth.register.propertyTypes.other') }
        ]},
        { field: 'property_ownership', label: t('auth.register.propertyOwnership'), value: (user as any).propertyOwnership || user.property_ownership || '', type: 'dropdown', options: [
          { value: 'OWNED', label: t('auth.register.propertyOwnershipTypes.owned') },
          { value: 'RENTED', label: t('auth.register.propertyOwnershipTypes.rented') },
          { value: 'LEASED', label: t('auth.register.propertyOwnershipTypes.leased') },
          { value: 'FAMILY_OWNED', label: 'Family Owned' }
        ]},
        { field: 'roof_size', label: t('auth.register.roofSize'), value: (user as any).roofSize || user.roof_size || '', type: 'number', unit: 'm²' },
        { field: 'electricity_consumption', label: t('userApp.profile.electricityConsumption'), value: (user as any).electricityConsumption || user.electricity_consumption || '', type: 'dropdown', options: [
          { value: '0_200', label: '0-200 kWh' },
          { value: '200_400', label: '200-400 kWh' },
          { value: '400_600', label: '400-600 kWh' },
          { value: '600_800', label: '600-800 kWh' },
          { value: '800_1000', label: '800-1000 kWh' },
          { value: '1000_1200', label: '1000-1200 kWh' },
          { value: '1200_1500', label: '1200-1500 kWh' },
          { value: '1500_PLUS', label: '1500+ kWh' }
        ]},
        { field: 'electricity_meter_number', label: t('auth.register.electricityMeterNumber'), value: (user as any).electricityMeterNumber || user.electricity_meter_number || '' },
      ],
      preferences: [
        { field: 'preferred_language', label: t('userApp.profile.preferredLanguage'), value: user.preferred_language || 'en', type: 'language' },
        { field: 'email_notifications', label: t('userApp.profile.emailNotifications'), value: user.email_notifications ?? true, type: 'toggle' },
        { field: 'sms_notifications', label: t('userApp.profile.smsNotifications'), value: user.sms_notifications ?? true, type: 'toggle' },
        { field: 'marketing_consent', label: t('userApp.profile.marketingConsent'), value: user.marketing_consent ?? false, type: 'toggle' },
      ],
      documents: [
        { field: '99655c95-616f-4f28-8b4d-84b683b23642', label: 'National ID (Front & Back)', type: 'document', required: true },
        { field: '75063139-ab8e-4e5b-96f7-014cc03bdef5', label: 'Proof of Address', type: 'document', required: true },
        { field: '03f5dd41-d602-4839-bf0e-67d8ef28a646', label: 'Income Proof / Salary Certificate', type: 'document', required: false },
        { field: 'c81ef13b-bfa9-4498-bb35-10adbc234edb', label: 'Bank Statement', type: 'document', required: false },
      ]
    };

    const fields = sectionData[activeSection as keyof typeof sectionData] || [];
    const menuItem = menuItems.find(item => item.id === activeSection);

    // Document upload handler
    const handleDocumentUpload = async (documentType: string, file: File) => {
      try {
        setSaving(true);
        console.log('🔄 Starting document upload:', { documentType, fileName: file.name, fileSize: file.size });
        
        // Check available tokens
        const token = localStorage.getItem('rabhan_access_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
        console.log('🔑 Using token:', token ? 'Token available' : 'No token found');
        console.log('🔍 Token sources checked:', {
          rabhan_access_token: !!localStorage.getItem('rabhan_access_token'),
          token: !!localStorage.getItem('token'),
          accessToken: !!localStorage.getItem('accessToken')
        });
        
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }
        
        // Set auth token for document service
        documentService.setAuthToken(token);
        
        console.log('📤 Uploading using DocumentService...');
        console.log('📋 Upload details:', {
          hasFile: !!file,
          fileName: file?.name,
          fileSize: file?.size,
          fileType: file?.type,
          userId: user.id,
          categoryId: documentType
        });
        
        // Upload using DocumentService with progress tracking
        const response = await documentService.uploadDocument(
          file,
          documentType,
          { userId: user.id }, // Add userId in metadata
          (progress) => {
            console.log('📊 Upload progress:', progress);
            // You could show progress UI here if needed
          }
        );
        
        console.log('✅ Upload successful:', response);
        setSuccessMessage('Document uploaded successfully');
        
        // Refresh document status from user service
        console.log('🔄 Refreshing document status...');
        const statusResponse = await fetch('http://localhost:3002/api/profiles/me/documents', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          console.log('📋 Document status updated:', data);
          const documentsMap = data.reduce((acc: any, doc: any) => {
            acc[doc.documentType || doc.category_id] = doc;
            return acc;
          }, {});
          setDocuments(documentsMap);
        }
        
      } catch (error: any) {
        console.error('❌ Document upload error:', error);
        const errorMessage = error.message || 'Upload failed. Please try again.';
        setErrors(prev => ({ ...prev, [documentType]: errorMessage }));
      } finally {
        setSaving(false);
      }
    };

    // Document Upload Component
    const DocumentUpload = ({ documentType, required, onUpload }: { 
      documentType: string; 
      required: boolean; 
      onUpload: (file: File) => void; 
    }) => {
      const [dragActive, setDragActive] = useState(false);
      // Get current document status from documents state
      const currentDoc = documents[documentType];
      const uploadStatus = currentDoc?.verificationStatus || 'pending';
      
      const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
          setDragActive(true);
        } else if (e.type === 'dragleave') {
          setDragActive(false);
        }
      };
      
      const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileSelect(e.dataTransfer.files[0]);
        }
      };
      
      const handleFileSelect = (file: File) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          setErrors(prev => ({ ...prev, [documentType]: 'Please upload JPG, PNG, or PDF files only' }));
          return;
        }
        
        // Validate file size (3MB max)
        if (file.size > 3 * 1024 * 1024) {
          setErrors(prev => ({ ...prev, [documentType]: 'File size must be less than 3MB' }));
          return;
        }
        
        onUpload(file);
      };
      
      const getStatusColor = () => {
        switch (uploadStatus) {
          case 'verified': return '#10B981';
          case 'rejected': return '#EF4444';
          case 'uploaded': return '#F59E0B';
          default: return '#6B7280';
        }
      };
      
      const getStatusText = () => {
        switch (uploadStatus) {
          case 'verified': return '✓ Verified';
          case 'rejected': return '✗ Rejected';
          case 'uploaded': return '⏳ Pending Review';
          default: return 'Upload Required';
        }
      };
      
      return (
        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              border: dragActive ? '2px dashed #3eb2b1' : '2px dashed #D1D5DB',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: dragActive ? 'rgba(62, 178, 177, 0.05)' : '#F9FAFB',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,application/pdf';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileSelect(file);
              };
              input.click();
            }}
          >
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem',
              color: '#6B7280'
            }}>
              📄
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem'
            }}>
              {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6B7280'
            }}>
              JPG, PNG, PDF • Max 3MB
            </div>
          </div>
          
          {/* Status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: 'rgba(62, 178, 177, 0.05)',
            borderRadius: '6px'
          }}>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: getStatusColor()
            }}>
              {getStatusText()}
            </span>
            {required && (
              <span style={{
                fontSize: '0.75rem',
                color: '#EF4444',
                fontWeight: '500'
              }}>
                Required
              </span>
            )}
          </div>
          
          {errors[documentType] && (
            <div style={{
              color: '#EF4444',
              fontSize: '0.875rem',
              marginTop: '0.25rem'
            }}>
              {errors[documentType]}
            </div>
          )}
        </div>
      );
    };

    return (
      <div style={styles.formContainer}>
        <div style={styles.formHeader}>
          <h2 style={styles.formTitle}>{menuItem?.label}</h2>
          <button
            style={styles.editButton}
            onClick={() => setEditingSection(isEditing ? null : activeSection)}
          >
            {isEditing ? t('common.cancel') : (activeSection === 'documents' ? 'Upload Documents' : t('common.edit'))}
          </button>
        </div>

        <div style={styles.fieldsGrid}>
          {fields.map((fieldData: any) => {
            const { field, label, value, type, options, readOnly, verificationStatus } = fieldData;
            // Read-only fields (verification status and email)
            const isReadOnly = ['sama_verified', 'nafath_verified', 'email'].includes(field) || readOnly;
            
            // Check if this is a toggle field
            const isToggleField = type === 'toggle';
            
            // Get current value from formData for toggle fields
            const currentValue = (type === 'toggle' || type === 'language') 
              ? formData[activeSection as keyof typeof formData][field as keyof typeof formData[typeof activeSection]]
              : value;
            
            // Get input type based on field
            const getInputType = (fieldName: string) => {
              if (fieldName.includes('date') || fieldName === 'date_of_birth') return 'date';
              if (fieldName.includes('email')) return 'email';
              if (fieldName.includes('phone')) return 'tel';
              if (fieldName.includes('income') || fieldName.includes('amount') || fieldName.includes('size')) return 'number';
              if (fieldName === 'special_requirements') return 'textarea';
              return 'text';
            };

            const inputType = getInputType(field);
            
            return (
              <div key={field} style={styles.field}>
                <label style={styles.label}>
                  {label}
                  {verificationStatus !== undefined && (
                    <span style={{ 
                      marginLeft: '0.5rem',
                      fontSize: '0.875rem',
                      color: verificationStatus ? '#10B981' : '#EF4444',
                      fontWeight: 500
                    }}>
                      {verificationStatus ? '✓' : '✗'}
                    </span>
                  )}
                </label>
                
                {/* Language Toggle Switch */}
                {type === 'language' ? (
                  isEditing ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '12px',
                      border: '1px solid rgba(62, 178, 177, 0.2)'
                    }}>
                      <button
                        style={{
                          position: 'relative',
                          width: '80px',
                          height: '36px',
                          borderRadius: '18px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: 'linear-gradient(135deg, #3eb2b1 0%, #22d3db 100%)',
                          boxShadow: '0 4px 12px rgba(62, 178, 177, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '2px'
                        }}
                        onClick={() => {
                          const newLang = currentValue === 'en' ? 'ar' : 'en';
                          // Update the form data state only (don't change app language or call onUpdate yet)
                          setFormData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              [field]: newLang
                            }
                          }));
                        }}
                      >
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: currentValue === 'en' ? '#ffffff' : 'rgba(255,255,255,0.5)',
                        flex: 1,
                        textAlign: 'center'
                      }}>
                        EN
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: currentValue === 'ar' ? '#ffffff' : 'rgba(255,255,255,0.5)',
                        flex: 1,
                        textAlign: 'center'
                      }}>
                        AR
                      </div>
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: currentValue === 'en' ? '2px' : '42px',
                        width: '36px',
                        height: '32px',
                        borderRadius: '16px',
                        background: '#ffffff',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#3eb2b1'
                      }}>
                        {currentValue === 'en' ? 'EN' : 'ع'}
                      </div>
                    </button>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#3eb2b1'
                    }}>
                      {currentValue === 'en' ? 'English' : 'العربية'}
                    </span>
                    </div>
                  ) : (
                    <div style={{
                      ...currentValue ? styles.value : styles.empty
                    }}>
                      {currentValue === 'en' ? 'English' : 'العربية'}
                    </div>
                  )
                ) : isToggleField ? (
                  isEditing ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '12px',
                      border: '1px solid rgba(62, 178, 177, 0.2)'
                    }}>
                      <button
                        style={{
                          position: 'relative',
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: currentValue 
                            ? 'linear-gradient(135deg, #3eb2b1 0%, #22d3db 100%)'
                            : '#e5e7eb',
                          boxShadow: currentValue
                            ? '0 4px 12px rgba(62, 178, 177, 0.3)'
                            : '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                        onClick={() => {
                          const newValue = !currentValue;
                          // Update the form data state only (don't call onUpdate until save)
                          setFormData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              [field]: newValue
                            }
                          }));
                        }}
                      >
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: currentValue ? '26px' : '2px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '12px',
                        background: '#ffffff',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      }} />
                    </button>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: currentValue ? '#3eb2b1' : '#6b7280'
                    }}>
                      {field === 'marketing_consent' 
                        ? (currentValue ? t('common.yes') : t('common.no'))
                        : (currentValue ? t('common.enabled') : t('common.disabled'))
                      }
                    </span>
                    </div>
                  ) : (
                    <div style={{
                      ...currentValue ? styles.value : styles.empty
                    }}>
                      {field === 'marketing_consent' 
                        ? (currentValue ? t('common.yes') : t('common.no'))
                        : (currentValue ? t('common.enabled') : t('common.disabled'))
                      }
                    </div>
                  )
                ) : (type === 'document') ? (
                    <DocumentUpload
                      documentType={field}
                      required={fieldData.required}
                      onUpload={(file) => handleDocumentUpload(field, file)}
                    />
                ) : isEditing && !isReadOnly ? (
                  type === 'dropdown' ? (
                    <select
                      style={styles.input}
                      value={formData[activeSection as keyof typeof formData][field as keyof typeof formData[typeof activeSection]]}
                      onChange={(e) => handleInputChange(activeSection, field, e.target.value)}
                    >
                      <option value="">{t('common.selectOption')}</option>
                      {options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : inputType === 'textarea' ? (
                    <textarea
                      style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                      value={formData[activeSection as keyof typeof formData][field as keyof typeof formData[typeof activeSection]]}
                      onChange={(e) => handleInputChange(activeSection, field, e.target.value)}
                      placeholder={t(`userApp.profile.placeholder.${field}`)}
                    />
                  ) : (
                    <div style={{ width: '100%' }}>
                      <input
                        type={inputType}
                        style={{
                          ...styles.input,
                          ...(fieldValidation[field]?.isValid === true ? styles.inputValid : {}),
                          ...(fieldValidation[field]?.isValid === false ? styles.inputInvalid : {})
                        }}
                        value={formData[activeSection as keyof typeof formData][field as keyof typeof formData[typeof activeSection]]}
                        onChange={(e) => handleInputChange(activeSection, field, e.target.value)}
                        placeholder={t(`userApp.profile.placeholder.${field}`)}
                        min={inputType === 'number' && field.includes('income') ? '0' : undefined}
                        step={inputType === 'number' ? '0.01' : undefined}
                        maxLength={
                          ['first_name', 'last_name'].includes(field) ? 25 :
                          ['city', 'district'].includes(field) ? 30 :
                          ['street_address', 'landmark', 'employer_name', 'job_title'].includes(field) ? 50 :
                          field === 'postal_code' ? 5 :
                          field === 'national_id' ? 10 :
                          field === 'electricity_meter_number' ? 15 :
                          undefined
                        }
                      />
                      
                      {/* Character count for text fields */}
                      {['first_name', 'last_name', 'city', 'district', 'street_address', 'landmark', 'employer_name', 'job_title'].includes(field) && (
                        <div style={styles.characterCount}>
                          {(formData[activeSection as keyof typeof formData][field as keyof typeof formData[typeof activeSection]] as string).length} / {
                            ['first_name', 'last_name'].includes(field) ? 25 :
                            ['city', 'district'].includes(field) ? 30 : 50
                          }
                        </div>
                      )}
                      
                      {/* Real-time validation feedback */}
                      {fieldValidation[field] && !fieldValidation[field].isValid && (
                        <div style={{ ...styles.validationMessage, ...styles.validationError }}>
                          <svg style={{ width: '14px', height: '14px', fill: 'currentColor' }} viewBox="0 0 24 24">
                            <path d="M13 13H11V7H13M13 17H11V15H13M12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22A10 10 0 0 0 22 12A10 10 0 0 0 12 2Z"/>
                          </svg>
                          {fieldValidation[field].message}
                        </div>
                      )}
                      
                      {/* Success feedback */}
                      {fieldValidation[field] && fieldValidation[field].isValid && formData[activeSection as keyof typeof formData][field as keyof typeof formData[typeof activeSection]] && (
                        <div style={{ ...styles.validationMessage, ...styles.validationSuccess }}>
                          <svg style={{ width: '14px', height: '14px', fill: 'currentColor' }} viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                          </svg>
                          {t('validation.validInput') || 'Valid'}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div style={{
                    ...currentValue ? styles.value : styles.empty,
                    ...(isReadOnly ? { 
                      background: 'rgba(62, 178, 177, 0.05)',
                      border: '1px solid rgba(62, 178, 177, 0.2)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem'
                    } : {}),
                    ...(field === 'phone_verified' || field === 'email_verified' ? {
                      color: currentValue?.includes('✓') ? '#10B981' : '#EF4444',
                      fontWeight: 500
                    } : {})
                  }}>
                    {currentValue || t('userApp.profile.notProvided')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* GPS Location Section for Address */}
        {activeSection === 'address' && (
          <div style={styles.gpsFieldsContainer}>
            <div style={styles.gpsFieldsHeader}>
              <h3 style={styles.gpsFieldsTitle}>{t('userApp.profile.locationInfo')}</h3>
            </div>
            
            {isEditing ? (
              <div>
                {/* Get Location Button */}
                <button
                  type="button"
                  style={{
                    ...styles.locationButton,
                    ...(geoLoading ? styles.locationButtonDisabled : {}),
                  }}
                  onClick={handleGetLocation}
                  disabled={geoLoading}
                >
                  <svg style={styles.locationIcon} viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z"/>
                  </svg>
                  {geoLoading ? t('userApp.profile.gettingLocation') : t('userApp.profile.getMyLocation')}
                </button>

                {/* GPS Fields Display */}
                <div style={styles.gpsFieldsGrid}>
                  <div style={styles.gpsField}>
                    <label style={styles.label}>{t('userApp.profile.landmark')}</label>
                    <div style={{
                      ...styles.input,
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      cursor: 'default',
                      color: formData.address.landmark ? '#1a1a1a' : '#9ca3af',
                      fontStyle: formData.address.landmark ? 'normal' : 'italic',
                    }}>
                      {formData.address.landmark || t('userApp.profile.clickToGetLocation')}
                    </div>
                  </div>

                  <div style={styles.gpsField}>
                    <label style={styles.label}>{t('userApp.profile.gpsCoordinates')}</label>
                    <div style={{
                      ...styles.input,
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      cursor: 'default',
                      color: formData.address.gps_latitude ? '#1a1a1a' : '#9ca3af',
                      fontStyle: formData.address.gps_latitude ? 'normal' : 'italic',
                    }}>
                      {formData.address.gps_latitude && formData.address.gps_longitude
                        ? `${formData.address.gps_latitude}, ${formData.address.gps_longitude}`
                        : t('userApp.profile.clickToGetLocation')
                      }
                    </div>
                  </div>
                </div>

                {/* Geolocation Error Display */}
                {geoError && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    borderRadius: '8px',
                    color: '#d32f2f',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <svg style={{ width: '16px', height: '16px', fill: 'currentColor', flexShrink: 0 }} viewBox="0 0 24 24">
                      <path d="M13 13H11V7H13M13 17H11V15H13M12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22A10 10 0 0 0 22 12A10 10 0 0 0 12 2Z"/>
                    </svg>
                    {t('userApp.profile.locationError')}: {geoError}
                  </div>
                )}
              </div>
            ) : (
              /* Read-only view */
              <div style={styles.gpsFieldsGrid}>
                <div style={styles.gpsField}>
                  <label style={styles.label}>{t('userApp.profile.landmark')}</label>
                  <div style={user.landmark ? styles.value : styles.empty}>
                    {user.landmark || t('userApp.profile.notProvided')}
                  </div>
                </div>

                <div style={styles.gpsField}>
                  <label style={styles.label}>{t('userApp.profile.gpsCoordinates')}</label>
                  <div style={user.gps_latitude && user.gps_longitude ? styles.value : styles.empty}>
                    {user.gps_latitude && user.gps_longitude
                      ? `${user.gps_latitude}, ${user.gps_longitude}`
                      : t('userApp.profile.notProvided')
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Messages */}
        {Object.keys(errors).length > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            borderRadius: '8px',
            color: '#d32f2f'
          }}>
            {errors.general ? (
              <div>{errors.general}</div>
            ) : (
              <div>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Please fix the following errors:</div>
                {Object.entries(errors).map(([field, error]) => (
                  <div key={field} style={{ fontSize: '0.875rem' }}>• {error}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '8px',
            color: '#2e7d32',
            fontWeight: '500'
          }}>
            {successMessage}
          </div>
        )}

        {isEditing && (
          <div style={styles.buttonGroup}>
            <button 
              style={styles.cancelButton} 
              onClick={() => handleCancel(activeSection)}
              disabled={saving}
            >
              {t('common.cancel')}
            </button>
            <button 
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'not-allowed' : 'pointer'
              }} 
              onClick={() => handleSave(activeSection)}
              disabled={saving}
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Sticky Header */}
        <div style={styles.stickyHeader}>
          {/* Left: Profile Info */}
          <div style={styles.headerLeft}>
            <div style={styles.profileInfo}>
              <div style={styles.avatar}>
                {getUserInitials()}
              </div>
              <div style={styles.userInfo}>
                <h1 style={styles.name}>
                  {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email.split('@')[0]}
                </h1>
                <div style={styles.email}>{user.email}</div>
              </div>
            </div>
          </div>

          {/* Right: Progress */}
          <div style={styles.headerRight}>
            <div style={styles.compactProgress}>
              <div style={styles.progressCircle}>
                <span style={styles.progressText}>{completionPercentage}%</span>
                <div style={styles.progressInfo}>
                  <div style={styles.progressBar}>
                    <div style={styles.progressFill} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div style={styles.mobileMenu}>
          {menuItems.map(item => (
            <button
              key={item.id}
              style={{
                ...styles.menuItem,
                ...(activeSection === item.id ? styles.activeMenuItem : {})
              }}
              onClick={() => setActiveSection(item.id)}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
            </button>
          ))}
        </div>

        {/* Main Content Layout */}
        <div style={styles.contentLayout}>
          {/* Left Sidebar Menu */}
          <div style={styles.leftSidebar}>
            {menuItems.map(item => (
              <button
                key={item.id}
                style={{
                  ...styles.menuItem,
                  ...(activeSection === item.id ? styles.activeMenuItem : {})
                }}
                onClick={() => setActiveSection(item.id)}
                onMouseEnter={(e) => {
                  if (activeSection !== item.id) {
                    e.currentTarget.style.background = 'rgba(62, 178, 177, 0.08)';
                    e.currentTarget.style.color = '#3eb2b1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== item.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right Content Area - Only Selected Form */}
          <div style={styles.rightContent}>
            {renderSelectedForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;