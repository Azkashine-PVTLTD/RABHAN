import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { authService } from '../services/auth.service';
import { contractorService } from '../services/contractor.service';
import { useGeolocation } from '../hooks/useGeolocation';

// Add spin animation styles and custom checkbox styles
const profileStyles = `
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Custom Checkbox Styles */
.custom-checkbox {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.custom-checkbox:hover {
  border-color: #3eb2b1;
}

.custom-checkbox:checked {
  background: #3eb2b1;
  border-color: #3eb2b1;
}

.custom-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.custom-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-checkbox:disabled:hover {
  border-color: #d1d5db;
}

/* Language Toggle Switch Styles */
.language-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: #f3f4f6;
  border-radius: 25px;
  padding: 4px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 140px;
  height: 44px;
}

.language-toggle:hover {
  border-color: #3eb2b1;
}

.language-toggle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.language-toggle.disabled:hover {
  border-color: #e5e7eb;
}

.language-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  z-index: 2;
}

.language-option.active {
  background: #3eb2b1;
  color: white;
  box-shadow: 0 2px 4px rgba(62, 178, 177, 0.3);
}

.language-option.inactive {
  color: #6b7280;
  background: transparent;
}

/* Responsive Layout Styles */
.profile-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .profile-layout {
    grid-template-columns: 280px 1fr;
    gap: 2rem;
  }
  
  .profile-layout.rtl {
    grid-template-columns: 1fr 280px;
  }
}

@media (max-width: 767px) {
  .profile-navigation {
    order: 2;
  }
  
  .profile-content {
    order: 1;
  }
}

/* Responsive Grid Layouts */
.responsive-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .responsive-grid-2 {
    grid-template-columns: 1fr 1fr;
  }
}

.responsive-grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.5rem;
}

@media (max-width: 639px) {
  .responsive-grid-auto {
    grid-template-columns: 1fr;
  }
}

/* Language Toggle Responsive */
@media (max-width: 480px) {
  .language-toggle {
    min-width: 120px;
    height: 40px;
  }
  
  .language-option {
    padding: 6px 8px;
    font-size: 0.8rem;
  }
}

/* Mobile Optimizations */
@media (max-width: 767px) {
  .profile-header {
    padding: 1rem !important;
  }
  
  .profile-title {
    font-size: 1.5rem !important;
    line-height: 1.3 !important;
  }
  
  .profile-badges {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 0.75rem !important;
  }
  
  .profile-card {
    padding: 1.5rem !important;
    margin-bottom: 1rem !important;
  }
  
  .section-title {
    font-size: 1.125rem !important;
    margin-bottom: 1rem !important;
  }
  
  .action-buttons {
    justify-content: center !important;
    flex-direction: column-reverse !important;
  }
  
  .action-buttons button {
    width: 100% !important;
  }
}

/* Tablet Optimizations */
@media (min-width: 768px) and (max-width: 1023px) {
  .profile-layout {
    gap: 1.5rem;
  }
  
  .profile-card {
    padding: 1.75rem;
  }
}

/* Responsive Layout for Unified Card */
.contractor-profile-layout {
  display: flex;
  gap: 2rem;
}

@media (max-width: 767px) {
  .contractor-profile-layout {
    flex-direction: column;
    gap: 1.5rem;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .contractor-profile-layout {
    gap: 1.5rem;
  }
}

/* Profile Header Responsive */
@media (max-width: 767px) {
  .profile-header-content {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 1rem !important;
  }
  
  .profile-header-content h1 {
    font-size: 1.5rem !important;
  }
  
  .profile-header-content h2 {
    font-size: 1.125rem !important;
  }
}

@media (max-width: 480px) {
  .profile-header-content h1 {
    font-size: 1.25rem !important;
  }
  
  .profile-header-content h2 {
    font-size: 1rem !important;
  }
}

/* Tag Input Styles */
.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #ffffff;
  min-height: 44px;
  cursor: text;
  transition: all 0.2s ease;
}

.tag-input-container:focus-within {
  border-color: #3eb2b1;
  box-shadow: 0 0 0 3px rgba(62, 178, 177, 0.1);
}

.tag-input-container.disabled {
  background: #f9fafb;
  cursor: not-allowed;
  opacity: 0.7;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #3eb2b1 0%, #22d3ee 100%);
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  animation: tagFadeIn 0.2s ease-out;
}

.tag-item:hover {
  background: linear-gradient(135deg, #0891b2 0%, #0ea5e9 100%);
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
  transition: background 0.2s ease;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tag-input {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  padding: 0;
}

.tag-input::placeholder {
  color: #9ca3af;
}

.tag-input:disabled {
  cursor: not-allowed;
}

@keyframes tagFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive tag layout */
@media (max-width: 767px) {
  .tag-input-container {
    padding: 0.625rem;
  }
  
  .tag-item {
    padding: 0.25rem 0.625rem;
    font-size: 0.8125rem;
  }
  
  .tag-input {
    min-width: 100px;
    font-size: 0.8125rem;
  }
}
`;

// Inject styles
if (!document.querySelector('#contractor-profile-styles')) {
  const style = document.createElement('style');
  style.id = 'contractor-profile-styles';
  style.textContent = profileStyles;
  document.head.appendChild(style);
}

interface ContractorProfileProps {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    phone?: string;
    
    // Business Information
    business_name?: string;
    business_type?: string;
    business_name_ar?: string;
    cr_number?: string;
    vat_number?: string;
    commercial_license?: string;
    
    // Address Information
    region?: string;
    city?: string;
    district?: string;
    street_address?: string;
    postal_code?: string;
    gps_latitude?: string;
    gps_longitude?: string;
    
    // Service Information
    service_categories?: string[];
    service_areas?: string[];
    years_experience?: number;
    employee_count?: string;
    
    // Verification & Compliance
    verification_level?: number;
    status?: string;
    sama_verified?: boolean;
    nafath_verified?: boolean;
    saso_certified?: boolean;
    sec_licensed?: boolean;
    
    // Financial Information
    bank_name?: string;
    iban?: string;
    account_holder_name?: string;
    
    // Business Details
    description?: string;
    description_ar?: string;
    website?: string;
    established_year?: string;
    specializations?: string[];
    
    // Contact Information
    business_phone?: string;
    business_email?: string;
    contact_person?: string;
    contact_position?: string;
    
    // Preferences
    preferred_language?: string;
    email_notifications?: boolean;
    sms_notifications?: boolean;
    marketing_consent?: boolean;
  };
  onUpdate?: (section: string, data: any) => void;
}

const ContractorProfile: React.FC<ContractorProfileProps> = ({ user: initialUser, onUpdate }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeSection, setActiveSection] = useState('business');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  
  // State for user data that updates with auth service
  const [user, setUser] = useState(initialUser);
  
  // Tag input state for specializations
  const [tagInput, setTagInput] = useState('');
  
  // Location hook
  const { location, isLoading: locationLoading, error: locationError, getCurrentLocation } = useGeolocation();
  
  // Subscribe to auth service changes to get updated user data
  useEffect(() => {
    const unsubscribe = authService.subscribe((authState) => {
      if (authState.user) {
        console.log('🔄 Contractor data updated from auth service:', authState.user);
        setUser(authState.user);
      }
    });
    
    return unsubscribe;
  }, []);

  // Initialize language from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred_language') as 'ar' | 'en';
    if (savedLanguage && savedLanguage !== i18n.language) {
      console.log(`🔄 Loading saved language: ${savedLanguage}`);
      i18n.changeLanguage(savedLanguage);
      handleInputChange('preferences', 'preferred_language', savedLanguage);
    }
  }, []);
  
  const [formData, setFormData] = useState({
    business: {
      business_name: user.business_name || '',
      business_name_ar: user.business_name_ar || '',
      business_type: user.business_type || 'individual',
      commercial_registration: user.commercial_registration || '',
      vat_number: user.vat_number || '',
      description: user.description || '',
      description_ar: user.description_ar || '',
      website: user.website || '',
      established_year: user.established_year || '',
      employee_count: user.employee_count || '',
    },
    contact: {
      email: user.email || '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
    },
    address: {
      address_line1: user.address_line1 || '',
      address_line2: user.address_line2 || '',
      city: user.city || '',
      region: user.region || '',
      postal_code: user.postal_code || '',
      country: user.country || 'SA',
    },
    services: {
      service_categories: user.service_categories || [],
      service_areas: user.service_areas || [],
      years_experience: user.years_experience || 0,
      specializations: user.specializations || [], // This will be stored locally, not in contractor DB
    },
    verification: {
      status: user.status || 'pending',
      verification_level: user.verification_level || 0,
      bank_account_verified: user.bank_account_verified || false,
      tax_clearance_verified: user.tax_clearance_verified || false,
      financial_standing_verified: user.financial_standing_verified || false,
    },
    financial: {
      bank_name: user.bank_name || '', // This will be stored locally for now
      custom_bank_name: user.custom_bank_name || '', // Local field for custom bank
    },
    preferences: {
      preferred_language: user.preferred_language || 'ar',
      email_notifications: user.email_notifications !== false,
      sms_notifications: user.sms_notifications !== false,
      marketing_consent: user.marketing_consent || false,
    }
  });

  // Update form data when user data changes
  useEffect(() => {
    console.log('📋 Updating contractor form data with new user data:', user);
    setFormData({
      business: {
        business_name: user.business_name || '',
        business_name_ar: user.business_name_ar || '',
        business_type: user.business_type || 'individual',
        commercial_registration: user.commercial_registration || '',
        vat_number: user.vat_number || '',
        description: user.description || '',
        description_ar: user.description_ar || '',
        website: user.website || '',
        established_year: user.established_year || '',
        employee_count: user.employee_count || '',
      },
      contact: {
        email: user.email || '',
        phone: user.phone || '',
        whatsapp: user.whatsapp || '',
      },
      address: {
        address_line1: user.address_line1 || '',
        address_line2: user.address_line2 || '',
        city: user.city || '',
        region: user.region || '',
        postal_code: user.postal_code || '',
        country: user.country || 'SA',
      },
      services: {
        service_categories: user.service_categories || [],
        service_areas: user.service_areas || [],
        years_experience: user.years_experience || 0,
        specializations: user.specializations || [],
      },
      verification: {
        status: user.status || 'pending',
        verification_level: user.verification_level || 0,
        bank_account_verified: user.bank_account_verified || false,
        tax_clearance_verified: user.tax_clearance_verified || false,
        financial_standing_verified: user.financial_standing_verified || false,
      },
      financial: {
        bank_name: user.bank_name || '',
        custom_bank_name: user.custom_bank_name || '',
      },
      preferences: {
        preferred_language: user.preferred_language || 'ar',
        email_notifications: user.email_notifications !== false,
        sms_notifications: user.sms_notifications !== false,
        marketing_consent: user.marketing_consent || false,
      }
    });
  }, [user]);

  // Calculate business profile completion

  const getVerificationStatus = () => {
    const level = user.verification_level || 0;
    if (level >= 4) return { 
      text: t('contractorApp.verification.verified'), 
      color: '#10b981', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    };
    if (level >= 2) return { 
      text: t('contractorApp.verification.partial'), 
      color: '#f59e0b', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    };
    return { 
      text: t('contractorApp.verification.pending'), 
      color: '#ef4444', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
          <path d="M8 12H16" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    };
  };

  const verificationStatus = getVerificationStatus();

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleArrayInputChange = (section: string, field: string, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: items
      }
    }));
  };

  const handleGetLocation = async () => {
    try {
      await getCurrentLocation();
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  // Update form data when location is retrieved
  useEffect(() => {
    if (location && !locationError) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          gps_latitude: location.latitude.toString(),
          gps_longitude: location.longitude.toString(),
        }
      }));
      
      if (location.city) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            city: location.city || prev.address.city,
          }
        }));
      }
    }
  }, [location, locationError]);

  const handleSaveSection = async (section: string) => {
    console.log(`🔧 handleSaveSection called with section: ${section}`);
    try {
      console.log(`🔧 Setting isLoading to true`);
      setIsLoading(true);
      const sectionData = formData[section as keyof typeof formData];
      
      console.log(`💾 Saving contractor ${section} data:`, sectionData);
      
      // Get current user
      const user = authService.getCurrentUser();
      if (!user?.id) {
        console.error('No user found for saving contractor data');
        setUpdateStatus(t('contractorApp.profile.updateError') || 'Error updating profile');
        setIsLoading(false);
        return;
      }

      // Prepare data for API based on section
      let apiData = {};
      
      if (section === 'business') {
        apiData = {
          business_name: sectionData.business_name,
          business_name_ar: sectionData.business_name_ar,
          business_type: sectionData.business_type,
          commercial_registration: sectionData.commercial_registration,
          vat_number: sectionData.vat_number,
          description: sectionData.description,
          description_ar: sectionData.description_ar,
          website: sectionData.website,
          established_year: sectionData.established_year ? parseInt(sectionData.established_year) : null,
          employee_count: sectionData.employee_count ? parseInt(sectionData.employee_count) : null,
        };
      } else if (section === 'contact') {
        apiData = {
          email: sectionData.email,
          phone: sectionData.phone,
          whatsapp: sectionData.whatsapp,
        };
      } else if (section === 'address') {
        apiData = {
          address_line1: sectionData.address_line1,
          address_line2: sectionData.address_line2,
          city: sectionData.city,
          region: sectionData.region,
          postal_code: sectionData.postal_code,
          country: sectionData.country,
        };
      } else if (section === 'services') {
        apiData = {
          service_categories: sectionData.service_categories,
          service_areas: sectionData.service_areas,
          years_experience: sectionData.years_experience || 0,
        };
        
        // Save specializations to localStorage since it's not in DB
        const storageKey = `contractor_${user.id}_specializations`;
        localStorage.setItem(storageKey, JSON.stringify(sectionData.specializations || []));
      } else {
        // For verification, financial, preferences - save locally only for now
        const storageKey = `contractor_${user.id}_${section}`;
        localStorage.setItem(storageKey, JSON.stringify(sectionData));
        console.log(`✅ Successfully saved ${section} data locally`);
        return;
      }

      // Call contractor service API
      console.log(`🌐 Calling contractor service API with data:`, apiData);
      const result = await contractorService.updateProfile(user.id, section, apiData);
      
      if (result.success) {
        console.log(`✅ Successfully saved ${section} data via API`);
        
        // Also backup to localStorage
        const storageKey = `contractor_${user.id}_${section}`;
        localStorage.setItem(storageKey, JSON.stringify(sectionData));
      } else {
        throw new Error('API returned unsuccessful response');
      }
      
      setUpdateStatus(t('contractorApp.profile.updateSuccess') || 'Profile updated successfully');
      setEditingSection(null);
      
      // Call onUpdate callback if provided (safely)
      try {
        onUpdate?.(section, sectionData);
      } catch (callbackError) {
        console.warn('Error in onUpdate callback:', callbackError);
      }
      
      // Clear status after 3 seconds
      setTimeout(() => setUpdateStatus(null), 3000);
      
      console.log(`🔧 Save process completed successfully for ${section}`);
      
    } catch (error) {
      console.error(`Error saving contractor ${section}:`, error);
      setUpdateStatus(t('contractorApp.profile.updateError') || 'Error updating profile');
      setTimeout(() => setUpdateStatus(null), 5000);
    } finally {
      console.log(`🔧 Setting isLoading to false`);
      setIsLoading(false);
      console.log(`🔧 handleSaveSection completed for ${section}`);
    }
  };

  // Handle language change with immediate application and save
  const handleLanguageChange = async (newLanguage: 'ar' | 'en') => {
    console.log(`🌍 handleLanguageChange called with: ${newLanguage}`);
    console.log('🔍 Current form data before change:', formData.preferences);
    
    try {
      setIsLoading(true);
      
      // Update form data
      handleInputChange('preferences', 'preferred_language', newLanguage);
      console.log('✅ Form data updated');
      
      // Apply language change immediately to the interface
      await i18n.changeLanguage(newLanguage);
      console.log('✅ i18n language changed');
      
      // Also persist to localStorage so it survives page refreshes
      localStorage.setItem('preferred_language', newLanguage);
      console.log('✅ Language saved to localStorage');
      
      // Auto-save the preference to backend
      console.log(`🌍 Language changed to: ${newLanguage}`);
      
      // Simulate API call to save preference
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call onUpdate callback if provided to save to backend
      const updatedPreferences = { ...formData.preferences, preferred_language: newLanguage };
      console.log('💾 Calling onUpdate with:', updatedPreferences);
      onUpdate?.('preferences', updatedPreferences);
      
      // Show success message
      setUpdateStatus(t('contractorApp.profile.languageUpdated'));
      setTimeout(() => setUpdateStatus(null), 2000);
      
    } catch (error) {
      console.error('❌ Error changing language:', error);
      setUpdateStatus(t('contractorApp.profile.updateError') || 'Error updating profile');
      setTimeout(() => setUpdateStatus(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Tag management functions
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.services.specializations.includes(trimmedTag)) {
      const updatedSpecializations = [...formData.services.specializations, trimmedTag];
      handleInputChange('services', 'specializations', updatedSpecializations);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedSpecializations = formData.services.specializations.filter(tag => tag !== tagToRemove);
    handleInputChange('services', 'specializations', updatedSpecializations);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && formData.services.specializations.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      const lastTag = formData.services.specializations[formData.services.specializations.length - 1];
      removeTag(lastTag);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Auto-add tag if comma is typed
    if (value.includes(',')) {
      const newTag = value.replace(',', '').trim();
      if (newTag) {
        addTag(newTag);
      } else {
        setTagInput('');
      }
    } else {
      setTagInput(value);
    }
  };

  const sections = [
    { 
      id: 'business', 
      label: t('contractorApp.profile.tabs.business'), 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'contact', 
      label: t('contractorApp.profile.tabs.contact'), 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.59531 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5865 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'address', 
      label: t('contractorApp.profile.tabs.address'), 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'services', 
      label: t('contractorApp.profile.tabs.services'), 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'verification', 
      label: t('contractorApp.profile.tabs.verification'), 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'financial', 
      label: t('contractorApp.profile.tabs.financial'), 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    { 
      id: 'preferences', 
      label: t('contractorApp.profile.tabs.preferences'), 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
  ];

  // Saudi Banks List
  const saudiBanks = [
    { value: '', label: isRTL ? 'اختر البنك' : 'Select Bank' },
    { value: 'al_rajhi_bank', label: isRTL ? 'مصرف الراجحي' : 'Al Rajhi Bank' },
    { value: 'saudi_national_bank', label: isRTL ? 'البنك الأهلي السعودي' : 'Saudi National Bank' },
    { value: 'riyad_bank', label: isRTL ? 'بنك الرياض' : 'Riyad Bank' },
    { value: 'banque_saudi_fransi', label: isRTL ? 'البنك السعودي الفرنسي' : 'Banque Saudi Fransi' },
    { value: 'samba_financial_group', label: isRTL ? 'مجموعة سامبا المالية' : 'Samba Financial Group' },
    { value: 'arab_national_bank', label: isRTL ? 'البنك العربي الوطني' : 'Arab National Bank' },
    { value: 'saudi_british_bank', label: isRTL ? 'البنك السعودي البريطاني' : 'Saudi British Bank' },
    { value: 'alinma_bank', label: isRTL ? 'بنك الإنماء' : 'Alinma Bank' },
    { value: 'saudi_investment_bank', label: isRTL ? 'البنك السعودي للاستثمار' : 'Saudi Investment Bank' },
    { value: 'alawwal_bank', label: isRTL ? 'البنك الأول' : 'Alawwal Bank' },
    { value: 'gulf_international_bank', label: isRTL ? 'بنك الخليج الدولي' : 'Gulf International Bank' },
    { value: 'al_bilad_bank', label: isRTL ? 'بنك البلاد' : 'Al Bilad Bank' },
    { value: 'bank_aljazira', label: isRTL ? 'بنك الجزيرة' : 'Bank AlJazira' },
    { value: 'national_commercial_bank', label: isRTL ? 'البنك الأهلي التجاري' : 'National Commercial Bank' },
    { value: 'other', label: isRTL ? 'أخرى' : 'Other' },
  ];

  const businessTypes = [
    { value: 'individual', label: t('contractorApp.profile.businessTypes.individual') },
    { value: 'llc', label: t('contractorApp.profile.businessTypes.llc') },
    { value: 'corporation', label: t('contractorApp.profile.businessTypes.corporation') },
    { value: 'partnership', label: t('contractorApp.profile.businessTypes.partnership') },
  ];

  const serviceCategories = [
    'residential_solar',
    'commercial_solar',
    'industrial_solar',
    'maintenance',
    'consultation',
    'design',
    'installation',
    'monitoring'
  ];

  const saudiRegions = [
    'riyadh', 'makkah', 'eastern', 'asir', 'jazan', 'medina', 'qassim', 
    'hail', 'northern_borders', 'najran', 'tabuk', 'bahah', 'jouf'
  ];


  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: '12px',
    border: '1px solid rgba(62, 178, 177, 0.3)',
    background: 'rgba(255, 255, 255, 0.8)',
    fontSize: '0.875rem',
    fontFamily: theme.typography.fonts.primary,
    transition: theme.transitions.fast,
    direction: isRTL ? 'rtl' : 'ltr' as 'ltr' | 'rtl',
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #3eb2b1 0%, #22d3db 100%)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: theme.transitions.fast,
    fontFamily: theme.typography.fonts.primary,
    whiteSpace: 'nowrap' as const,
  };

  const renderBusinessSection = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
        {t('contractorApp.profile.sections.businessInfo')}
      </h3>
      
      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.businessName')} *
          </label>
          <input
            type="text"
            value={formData.business.business_name}
            onChange={(e) => handleInputChange('business', 'business_name', e.target.value)}
            style={inputStyle}
            placeholder={t('contractorApp.profile.placeholders.businessName')}
            disabled={editingSection !== 'business'}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.businessNameAr')}
          </label>
          <input
            type="text"
            value={formData.business.business_name_ar}
            onChange={(e) => handleInputChange('business', 'business_name_ar', e.target.value)}
            style={inputStyle}
            placeholder={t('contractorApp.profile.placeholders.businessNameAr')}
            disabled={editingSection !== 'business'}
          />
        </div>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.businessType')} *
          </label>
          <select
            value={formData.business.business_type}
            onChange={(e) => handleInputChange('business', 'business_type', e.target.value)}
            style={inputStyle}
            disabled={editingSection !== 'business'}
          >
            <option value="">{t('contractorApp.profile.placeholders.selectBusinessType')}</option>
            {businessTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.establishedYear')}
          </label>
          <input
            type="number"
            value={formData.business.established_year}
            onChange={(e) => handleInputChange('business', 'established_year', e.target.value)}
            style={inputStyle}
            placeholder="2020"
            min="1950"
            max={new Date().getFullYear()}
            disabled={editingSection !== 'business'}
          />
        </div>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.employeeCount')}
          </label>
          <select
            value={formData.business.employee_count}
            onChange={(e) => handleInputChange('business', 'employee_count', e.target.value)}
            style={inputStyle}
            disabled={editingSection !== 'business'}
          >
            <option value="">{t('contractorApp.profile.placeholders.selectEmployeeCount')}</option>
            <option value="1-5">1-5 {t('contractorApp.profile.employees')}</option>
            <option value="6-15">6-15 {t('contractorApp.profile.employees')}</option>
            <option value="16-50">16-50 {t('contractorApp.profile.employees')}</option>
            <option value="51-100">51-100 {t('contractorApp.profile.employees')}</option>
            <option value="100+">100+ {t('contractorApp.profile.employees')}</option>
          </select>
        </div>
        
        <div>
          {/* Empty div for grid layout balance */}
        </div>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.crNumber')} *
          </label>
          <input
            type="text"
            value={formData.business.commercial_registration}
            onChange={(e) => handleInputChange('business', 'commercial_registration', e.target.value)}
            style={inputStyle}
            placeholder="1010000000"
            disabled={editingSection !== 'business'}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.vatNumber')} *
          </label>
          <input
            type="text"
            value={formData.business.vat_number}
            onChange={(e) => handleInputChange('business', 'vat_number', e.target.value)}
            style={inputStyle}
            placeholder="300000000000003"
            disabled={editingSection !== 'business'}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.website')}
        </label>
        <input
          type="url"
          value={formData.business.website}
          onChange={(e) => handleInputChange('business', 'website', e.target.value)}
          style={inputStyle}
          placeholder="https://www.company.com"
          disabled={editingSection !== 'business'}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.description')}
        </label>
        <textarea
          value={formData.business.description}
          onChange={(e) => handleInputChange('business', 'description', e.target.value)}
          style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
          placeholder={t('contractorApp.profile.placeholders.description')}
          disabled={editingSection !== 'business'}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.descriptionAr')}
        </label>
        <textarea
          value={formData.business.description_ar}
          onChange={(e) => handleInputChange('business', 'description_ar', e.target.value)}
          style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
          placeholder={t('contractorApp.profile.placeholders.descriptionAr')}
          disabled={editingSection !== 'business'}
        />
      </div>
    </div>
  );

  const renderContactSection = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
        {t('contractorApp.profile.sections.contactInfo')}
      </h3>
      
      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.firstName')} *
          </label>
          <input
            type="text"
            value={formData.contact.first_name}
            onChange={(e) => handleInputChange('contact', 'first_name', e.target.value)}
            style={inputStyle}
            placeholder={t('contractorApp.profile.placeholders.firstName')}
            disabled={editingSection !== 'contact'}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.lastName')} *
          </label>
          <input
            type="text"
            value={formData.contact.last_name}
            onChange={(e) => handleInputChange('contact', 'last_name', e.target.value)}
            style={inputStyle}
            placeholder={t('contractorApp.profile.placeholders.lastName')}
            disabled={editingSection !== 'contact'}
          />
        </div>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.email')} *
          </label>
          <input
            type="email"
            value={formData.contact.email}
            onChange={(e) => handleInputChange('contact', 'email', e.target.value)}
            style={inputStyle}
            placeholder="contact@company.com"
            disabled={true} // Email should not be editable
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.phone')} *
          </label>
          <input
            type="tel"
            value={formData.contact.phone}
            onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
            style={inputStyle}
            placeholder="+966501234567"
            disabled={editingSection !== 'contact'}
          />
        </div>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.businessPhone')}
          </label>
          <input
            type="tel"
            value={formData.contact.business_phone}
            onChange={(e) => handleInputChange('contact', 'business_phone', e.target.value)}
            style={inputStyle}
            placeholder="+966112345678"
            disabled={editingSection !== 'contact'}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.businessEmail')}
          </label>
          <input
            type="email"
            value={formData.contact.business_email}
            onChange={(e) => handleInputChange('contact', 'business_email', e.target.value)}
            style={inputStyle}
            placeholder="info@company.com"
            disabled={editingSection !== 'contact'}
          />
        </div>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.contactPerson')}
          </label>
          <input
            type="text"
            value={formData.contact.contact_person}
            onChange={(e) => handleInputChange('contact', 'contact_person', e.target.value)}
            style={inputStyle}
            placeholder={t('contractorApp.profile.placeholders.contactPerson')}
            disabled={editingSection !== 'contact'}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.contactPosition')}
          </label>
          <input
            type="text"
            value={formData.contact.contact_position}
            onChange={(e) => handleInputChange('contact', 'contact_position', e.target.value)}
            style={inputStyle}
            placeholder={t('contractorApp.profile.placeholders.contactPosition')}
            disabled={editingSection !== 'contact'}
          />
        </div>
      </div>
    </div>
  );

  const renderAddressSection = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
        {t('contractorApp.profile.sections.addressInfo')}
      </h3>
      
      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.region')} *
          </label>
          <select
            value={formData.address.region}
            onChange={(e) => handleInputChange('address', 'region', e.target.value)}
            style={inputStyle}
            disabled={editingSection !== 'address'}
          >
            <option value="">{t('contractorApp.profile.placeholders.selectRegion')}</option>
            {saudiRegions.map(region => (
              <option key={region} value={region}>
                {t(`contractorApp.profile.regions.${region}`)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.city')} *
          </label>
          <input
            type="text"
            value={formData.address.city}
            onChange={(e) => handleInputChange('address', 'city', e.target.value)}
            style={inputStyle}
            placeholder={t('contractorApp.profile.placeholders.city')}
            disabled={editingSection !== 'address'}
          />
        </div>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.district')}
          </label>
          <input
            type="text"
            value={formData.address.district}
            onChange={(e) => handleInputChange('address', 'district', e.target.value)}
            style={inputStyle}
            placeholder={t('contractorApp.profile.placeholders.district')}
            disabled={editingSection !== 'address'}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.postalCode')}
          </label>
          <input
            type="text"
            value={formData.address.postal_code}
            onChange={(e) => handleInputChange('address', 'postal_code', e.target.value)}
            style={inputStyle}
            placeholder="12345"
            disabled={editingSection !== 'address'}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.streetAddress')}
        </label>
        <input
          type="text"
          value={formData.address.address_line1}
          onChange={(e) => handleInputChange('address', 'address_line1', e.target.value)}
          style={inputStyle}
          placeholder={t('contractorApp.profile.placeholders.streetAddress')}
          disabled={editingSection !== 'address'}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.addressLine2')}
        </label>
        <input
          type="text"
          value={formData.address.address_line2}
          onChange={(e) => handleInputChange('address', 'address_line2', e.target.value)}
          style={inputStyle}
          placeholder={t('contractorApp.profile.placeholders.addressLine2')}
          disabled={editingSection !== 'address'}
        />
      </div>

      {/* GPS location removed - not in contractor database schema */}
    </div>
  );

  const renderServicesSection = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
        {t('contractorApp.profile.sections.serviceInfo')}
      </h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.serviceCategories')} *
        </label>
        <div className="responsive-grid-auto">
          {serviceCategories.map(category => (
            <label key={category} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={formData.services.service_categories.includes(category)}
                onChange={(e) => {
                  const current = formData.services.service_categories;
                  const updated = e.target.checked 
                    ? [...current, category]
                    : current.filter(c => c !== category);
                  handleInputChange('services', 'service_categories', updated);
                }}
                disabled={editingSection !== 'services'}
              />
              <span style={{ fontSize: '0.875rem' }}>
                {t(`contractorApp.profile.serviceCategories.${category}`)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.serviceAreas')} *
        </label>
        <input
          type="text"
          value={formData.services.service_areas.join(', ')}
          onChange={(e) => handleArrayInputChange('services', 'service_areas', e.target.value)}
          style={inputStyle}
          placeholder={t('contractorApp.profile.placeholders.serviceAreas')}
          disabled={editingSection !== 'services'}
        />
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
          {t('contractorApp.profile.hints.separateWithComma')}
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.yearsExperience')} *
        </label>
        <input
          type="number"
          value={formData.services.years_experience}
          onChange={(e) => handleInputChange('services', 'years_experience', parseInt(e.target.value) || 0)}
          style={inputStyle}
          placeholder="5"
          min="0"
          max="50"
          disabled={editingSection !== 'services'}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.specializations')}
        </label>
        
        <div 
          className={`tag-input-container ${editingSection !== 'services' ? 'disabled' : ''}`}
          onClick={() => {
            if (editingSection === 'services') {
              document.querySelector('.tag-input')?.focus();
            }
          }}
        >
          {/* Existing Tags */}
          {formData.services.specializations.map((tag, index) => (
            <div key={index} className="tag-item">
              <span>{tag}</span>
              {editingSection === 'services' && (
                <button
                  type="button"
                  className="tag-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  aria-label={`Remove ${tag} tag`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          {/* Input Field */}
          {editingSection === 'services' && (
            <input
              type="text"
              className="tag-input"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              placeholder={formData.services.specializations.length === 0 ? 
                t('contractorApp.profile.placeholders.specializations') : 
                t('contractorApp.profile.placeholders.addSpecialization')
              }
              disabled={editingSection !== 'services'}
            />
          )}
        </div>
        
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
          {editingSection === 'services' ? 
            t('contractorApp.profile.hints.tagInput') : 
            t('contractorApp.profile.hints.separateWithComma')
          }
        </p>
      </div>
    </div>
  );

  const renderVerificationSection = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
        {t('contractorApp.profile.sections.verification')}
      </h3>
      
      <div style={{ 
        background: `linear-gradient(135deg, ${verificationStatus.color}20 0%, ${verificationStatus.color}10 100%)`,
        border: `1px solid ${verificationStatus.color}40`,
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{verificationStatus.icon}</span>
          <span style={{ fontWeight: '600', color: verificationStatus.color }}>
            {verificationStatus.text}
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          {t('contractorApp.profile.verificationDescription')}
        </p>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div style={{ 
          padding: '1rem',
          border: '1px solid rgba(62, 178, 177, 0.2)',
          borderRadius: '12px',
          background: formData.verification.sama_verified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span>{formData.verification.sama_verified ? '✅' : '❌'}</span>
            <span style={{ fontWeight: '600' }}>{t('contractorApp.profile.verifications.sama')}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
            {t('contractorApp.profile.verificationStatuses.sama')}
          </p>
        </div>

        <div style={{ 
          padding: '1rem',
          border: '1px solid rgba(62, 178, 177, 0.2)',
          borderRadius: '12px',
          background: formData.verification.nafath_verified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span>{formData.verification.nafath_verified ? '✅' : '❌'}</span>
            <span style={{ fontWeight: '600' }}>{t('contractorApp.profile.verifications.nafath')}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
            {t('contractorApp.profile.verificationStatuses.nafath')}
          </p>
        </div>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: '1rem' }}>
        <div style={{ 
          padding: '1rem',
          border: '1px solid rgba(62, 178, 177, 0.2)',
          borderRadius: '12px',
          background: formData.verification.saso_certified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span>{formData.verification.saso_certified ? '✅' : '❌'}</span>
            <span style={{ fontWeight: '600' }}>{t('contractorApp.profile.verifications.saso')}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
            {t('contractorApp.profile.verificationStatuses.saso')}
          </p>
        </div>

        <div style={{ 
          padding: '1rem',
          border: '1px solid rgba(62, 178, 177, 0.2)',
          borderRadius: '12px',
          background: formData.verification.sec_licensed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span>{formData.verification.sec_licensed ? '✅' : '❌'}</span>
            <span style={{ fontWeight: '600' }}>{t('contractorApp.profile.verifications.sec')}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
            {t('contractorApp.profile.verificationStatuses.sec')}
          </p>
        </div>
      </div>

      <div style={{ 
        padding: '1rem',
        background: 'rgba(62, 178, 177, 0.1)',
        border: '1px solid rgba(62, 178, 177, 0.2)',
        borderRadius: '12px',
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
          {t('contractorApp.profile.verificationLevel')}: {formData.verification.verification_level}/4
        </h4>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          {t('contractorApp.profile.adminControlled')}
        </p>
      </div>
    </div>
  );

  const renderFinancialSection = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
        {t('contractorApp.profile.sections.financialInfo')}
      </h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.bankName')}
        </label>
        <select
          value={formData.financial.bank_name}
          onChange={(e) => handleInputChange('financial', 'bank_name', e.target.value)}
          style={{
            ...inputStyle,
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: isRTL ? 'left 0.75rem center' : 'right 0.75rem center',
            backgroundSize: '1rem',
            paddingLeft: isRTL ? '2.5rem' : '0.75rem',
            paddingRight: isRTL ? '0.75rem' : '2.5rem',
            appearance: 'none',
            cursor: editingSection === 'financial' ? 'pointer' : 'default'
          }}
          disabled={editingSection !== 'financial'}
        >
          {saudiBanks.map((bank) => (
            <option key={bank.value} value={bank.value}>
              {bank.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Bank Name Input - Show when "Other" is selected */}
      {formData.financial.bank_name === 'other' && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            {t('contractorApp.profile.fields.customBankName')}
          </label>
          <input
            type="text"
            value={formData.financial.custom_bank_name || ''}
            onChange={(e) => handleInputChange('financial', 'custom_bank_name', e.target.value)}
            style={inputStyle}
            placeholder={t('contractorApp.profile.placeholders.customBankName')}
            disabled={editingSection !== 'financial'}
          />
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.iban')}
        </label>
        <input
          type="text"
          value={formData.financial.iban}
          onChange={(e) => handleInputChange('financial', 'iban', e.target.value)}
          style={inputStyle}
          placeholder="SA0000000000000000000000"
          disabled={editingSection !== 'financial'}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.accountHolderName')}
        </label>
        <input
          type="text"
          value={formData.financial.account_holder_name}
          onChange={(e) => handleInputChange('financial', 'account_holder_name', e.target.value)}
          style={inputStyle}
          placeholder={t('contractorApp.profile.placeholders.accountHolderName')}
          disabled={editingSection !== 'financial'}
        />
      </div>

      <div style={{ 
        padding: '1rem',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '12px',
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#d97706' }}>
          ⚠️ {t('contractorApp.profile.securityNote')}
        </h4>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          {t('contractorApp.profile.financialSecurityNote')}
        </p>
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
        {t('contractorApp.profile.sections.preferences')}
      </h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500', color: '#374151' }}>
          {t('contractorApp.profile.fields.preferredLanguage')}
        </label>
        <div 
          className={`language-toggle ${editingSection !== 'preferences' ? 'disabled' : ''}`}
          style={{ 
            opacity: editingSection !== 'preferences' ? 0.5 : 1,
            pointerEvents: editingSection !== 'preferences' ? 'none' : 'auto'
          }}
        >
          <div
            className={`language-option ${i18n.language === 'ar' ? 'active' : 'inactive'}`}
            onClick={() => editingSection === 'preferences' && handleLanguageChange('ar')}
          >
            العربية
          </div>
          <div
            className={`language-option ${i18n.language === 'en' ? 'active' : 'inactive'}`}
            onClick={() => editingSection === 'preferences' && handleLanguageChange('en')}
          >
            English
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            className="custom-checkbox"
            checked={formData.preferences.email_notifications}
            onChange={(e) => handleInputChange('preferences', 'email_notifications', e.target.checked)}
            disabled={editingSection !== 'preferences'}
          />
          <span style={{ fontWeight: '500' }}>{t('contractorApp.profile.fields.emailNotifications')}</span>
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            className="custom-checkbox"
            checked={formData.preferences.sms_notifications}
            onChange={(e) => handleInputChange('preferences', 'sms_notifications', e.target.checked)}
            disabled={editingSection !== 'preferences'}
          />
          <span style={{ fontWeight: '500' }}>{t('contractorApp.profile.fields.smsNotifications')}</span>
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            className="custom-checkbox"
            checked={formData.preferences.marketing_consent}
            onChange={(e) => handleInputChange('preferences', 'marketing_consent', e.target.checked)}
            disabled={editingSection !== 'preferences'}
          />
          <span style={{ fontWeight: '500' }}>{t('contractorApp.profile.fields.marketingConsent')}</span>
        </label>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'business': return renderBusinessSection();
      case 'contact': return renderContactSection();
      case 'address': return renderAddressSection();
      case 'services': return renderServicesSection();
      case 'verification': return renderVerificationSection();
      case 'financial': return renderFinancialSection();
      case 'preferences': return renderPreferencesSection();
      default: return renderBusinessSection();
    }
  };

  // Card style similar to user profile
  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(62, 178, 177, 0.2)',
    boxShadow: '0 8px 32px rgba(62, 178, 177, 0.1)',
    padding: '2rem',
    minHeight: '600px',
  };

  const sidebarStyle = {
    width: '280px',
    marginRight: isRTL ? '0' : '2rem',
    marginLeft: isRTL ? '2rem' : '0',
  };

  const contentStyle = {
    flex: 1,
    minHeight: '600px',
  };

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    margin: '0.25rem 0',
    background: 'transparent',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: theme.transitions.fast,
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#6b7280',
    textDecoration: 'none',
    width: '100%',
    textAlign: isRTL ? 'right' : 'left' as 'left' | 'right',
  };

  const activeMenuItemStyle = {
    background: 'linear-gradient(135deg, rgba(62, 178, 177, 0.15) 0%, rgba(34, 211, 219, 0.15) 100%)',
    color: '#3eb2b1',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(62, 178, 177, 0.2)',
  };

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const totalFields = [
      // Business Information (matches contractor DB schema)
      formData.business.business_name,
      formData.business.business_name_ar,
      formData.business.business_type,
      formData.business.commercial_registration,
      formData.business.vat_number,
      formData.business.established_year,
      formData.business.employee_count,
      formData.business.website,
      formData.business.description,
      formData.business.description_ar,
      
      // Contact Information (matches contractor DB schema)
      formData.contact.email,
      formData.contact.phone,
      formData.contact.whatsapp,
      
      // Address Information (matches contractor DB schema)
      formData.address.address_line1,
      formData.address.address_line2,
      formData.address.city,
      formData.address.region,
      formData.address.postal_code,
      formData.address.country,
      
      // Services (matches contractor DB schema)
      formData.services.service_categories?.length > 0 ? 'filled' : null,
      formData.services.service_areas?.length > 0 ? 'filled' : null,
      formData.services.years_experience,
      
      // Financial Information (local storage only)
      formData.financial.bank_name,
      formData.financial.bank_name === 'other' ? formData.financial.custom_bank_name : 'filled',
      
      // Preferences (local storage only)
      formData.preferences.preferred_language,
    ];
    
    const filledFields = totalFields.filter(field => 
      field !== null && field !== undefined && field !== '' && field !== 0
    ).length;
    
    return Math.round((filledFields / totalFields.length) * 100);
  };

  const completionPercentage = calculateCompletion();
  const displayName = formData.business.business_name || 
                     user?.first_name + ' ' + user?.last_name ||
                     user?.email ||
                     t('contractorApp.profile.defaultName');

  // Add safety checks to prevent crashes
  if (!theme || !theme.colors) {
    console.error('Theme not available, returning basic layout');
    return <div>Loading...</div>;
  }

  console.log('ContractorProfile rendering, activeSection:', activeSection, 'isLoading:', isLoading);

  return (
    <div style={{ 
      direction: isRTL ? 'rtl' : 'ltr',
      padding: '1.5rem',
      minHeight: '100vh',
      background: theme.colors?.gradients?.primaryLight || '#f5f5f5',
    }}>
      <style>{profileStyles}</style>
      
      {/* Status Message */}
      {updateStatus && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          background: updateStatus.includes('Error') || updateStatus.includes('error') ? 
            'rgba(244, 67, 54, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: `1px solid ${updateStatus.includes('Error') || updateStatus.includes('error') ? 
            'rgba(244, 67, 54, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          borderRadius: '8px',
          color: updateStatus.includes('Error') || updateStatus.includes('error') ? 
            '#dc2626' : '#059669',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          {updateStatus}
        </div>
      )}

      {/* Main Container - Single Card */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        <div style={cardStyle}>
          {/* Profile Header */}
          <div style={{
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid rgba(62, 178, 177, 0.2)',
          }}>
            {/* Title and Profile Name */}
            <div className="profile-header-content" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#1a1a1a',
                  margin: '0 0 0.5rem 0',
                  textAlign: isRTL ? 'right' : 'left'
                }}>
                  {t('contractorApp.profile.title')}
                </h1>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#3eb2b1',
                  margin: 0,
                  textAlign: isRTL ? 'right' : 'left'
                }}>
                  {displayName}
                </h2>
              </div>
              
              {/* Verification Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: user?.verification_level >= 3 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${user?.verification_level >= 3 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: user?.verification_level >= 3 ? '#059669' : '#d97706'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z" fill="currentColor" fillOpacity="0.2"/>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {user?.verification_level >= 3 ? t('contractorApp.profile.verified') : t('contractorApp.profile.pending')}
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  {t('contractorApp.profile.completionProgress')}
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: '#3eb2b1'
                }}>
                  {completionPercentage}%
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '8px',
                background: '#f3f4f6',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${completionPercentage}%`,
                  height: '100%',
                  background: completionPercentage >= 80 ? 
                    'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 
                    completionPercentage >= 50 ? 
                    'linear-gradient(90deg, #3eb2b1 0%, #0891b2 100%)' : 
                    'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}>
                </div>
              </div>
              
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: '0.5rem 0 0 0',
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {completionPercentage >= 80 ? 
                  t('contractorApp.profile.excellentProgress') :
                  completionPercentage >= 50 ?
                  t('contractorApp.profile.goodProgress') :
                  t('contractorApp.profile.completeProfile')
                }
              </p>
            </div>
          </div>

          {/* Content Layout */}
          <div className="contractor-profile-layout" style={{
            display: 'flex',
            gap: '2rem',
          }}>
            {/* Left Sidebar Navigation */}
            <div style={sidebarStyle}>
              <nav style={{ display: 'flex', flexDirection: 'column' }}>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      ...menuItemStyle,
                      ...(activeSection === section.id ? activeMenuItemStyle : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== section.id) {
                        e.currentTarget.style.background = 'rgba(62, 178, 177, 0.08)';
                        e.currentTarget.style.color = '#3eb2b1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== section.id) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                      }
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {section.icon}
                    </span>
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Right Content Area */}
            <div style={contentStyle}>
              {/* Section Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#3eb2b1' }}>
                    {sections.find(s => s.id === activeSection)?.icon}
                  </span>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1a1a1a',
                    margin: 0
                  }}>
                    {sections.find(s => s.id === activeSection)?.label}
                  </h2>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
                {editingSection === activeSection ? (
                  <>
                    <button
                      onClick={() => setEditingSection(null)}
                      style={{
                        ...buttonStyle,
                        background: 'transparent',
                        border: '1px solid #d1d5db',
                        color: '#6b7280',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: isRTL ? '0' : '0.5rem', marginLeft: isRTL ? '0.5rem' : '0' }}>
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={() => handleSaveSection(activeSection)}
                      disabled={isLoading}
                      style={{
                        ...buttonStyle,
                        background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #3eb2b1 0%, #22d3db 100%)',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isLoading ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: isRTL ? '0' : '0.5rem', marginLeft: isRTL ? '0.5rem' : '0', animation: 'spin 1s linear infinite' }}>
                          <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: isRTL ? '0' : '0.5rem', marginLeft: isRTL ? '0.5rem' : '0' }}>
                          <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="7,3 7,8 15,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {isLoading ? t('common.saving') : t('common.save')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingSection(activeSection)}
                    style={{
                      ...buttonStyle,
                      background: 'linear-gradient(135deg, rgba(62, 178, 177, 0.1) 0%, rgba(34, 211, 219, 0.1) 100%)',
                      border: '1px solid rgba(62, 178, 177, 0.3)',
                      color: '#3eb2b1',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: isRTL ? '0' : '0.5rem', marginLeft: isRTL ? '0.5rem' : '0' }}>
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t('common.edit')}
                  </button>
                )}
              </div>
            </div>

              {/* Form Content */}
              <div>
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorProfile;