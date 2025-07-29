import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { theme } from '../theme';
import ContractorSidebar from '../components/ContractorSidebar';
import ContractorProfile from './ContractorProfile';
import ContractorDocuments from './ContractorDocuments';
import ContractorDashboard from './ContractorDashboard';
import ContractorProjects from './ContractorProjects';
import ContractorMarketplace from './ContractorMarketplace';
import ContractorQuotes from './ContractorQuotes';
import ContractorWallet from './ContractorWallet';

interface ContractorAppProps {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    phone?: string;
    national_id?: string;
    region?: string;
    city?: string;
    district?: string;
    street_address?: string;
    business_name?: string;
    business_type?: string;
    service_categories?: string[];
    service_areas?: string[];
    years_experience?: number;
    verification_level?: number;
    status?: string;
  };
  onLogout: () => void;
  initialActiveItem?: string;
}

const ContractorApp: React.FC<ContractorAppProps> = ({ 
  user, 
  onLogout, 
  initialActiveItem = 'dashboard' 
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';
  const [activeMenuItem, setActiveMenuItem] = useState(initialActiveItem);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync activeMenuItem with URL changes
  useEffect(() => {
    const path = location.pathname;
    if (path === '/contractor/dashboard') {
      setActiveMenuItem('dashboard');
    } else if (path === '/contractor/profile') {
      setActiveMenuItem('profile');
    } else if (path === '/contractor/projects') {
      setActiveMenuItem('projects');
    } else if (path === '/contractor/marketplace') {
      setActiveMenuItem('marketplace');
    } else if (path === '/contractor/quotes') {
      setActiveMenuItem('quotes');
    } else if (path === '/contractor/wallet') {
      setActiveMenuItem('wallet');
    } else if (path === '/contractor/documents') {
      setActiveMenuItem('documents');
    }
  }, [location.pathname]);

  // Get display name for contractor
  const getDisplayName = () => {
    if (user.business_name) {
      return user.business_name;
    } else if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else {
      return user.email.split('@')[0];
    }
  };

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item);
    // Navigate to appropriate contractor URL
    switch (item) {
      case 'dashboard':
        navigate('/contractor/dashboard');
        break;
      case 'profile':
        navigate('/contractor/profile');
        break;
      case 'projects':
        navigate('/contractor/projects');
        break;
      case 'marketplace':
        navigate('/contractor/marketplace');
        break;
      case 'quotes':
        navigate('/contractor/quotes');
        break;
      case 'wallet':
        navigate('/contractor/wallet');
        break;
      case 'documents':
        navigate('/contractor/documents');
        break;
      default:
        navigate('/contractor/dashboard');
        break;
    }
  };

  const renderActiveContent = () => {
    switch (activeMenuItem) {
      case 'dashboard':
        return <ContractorDashboard user={user} />;
      case 'profile':
        return (
          <ContractorProfile 
            user={user} 
            onUpdate={(section, updatedData) => {
              console.log('Contractor profile section updated:', section, updatedData);
              // Here you would typically call the contractor service API
            }}
          />
        );
      case 'projects':
        return <ContractorProjects user={user} />;
      case 'marketplace':
        return <ContractorMarketplace user={user} />;
      case 'quotes':
        return <ContractorQuotes user={user} />;
      case 'wallet':
        return <ContractorWallet user={user} />;
      case 'documents':
        return <ContractorDocuments userType="CONTRACTOR" />;
      default:
        return <ContractorDashboard user={user} />;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.colors.gradients.primaryLight,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fonts.primary,
        direction: isRTL ? 'rtl' : 'ltr'
      }}
    >
      <ContractorSidebar 
        user={user}
        onLogout={onLogout}
        activeItem={activeMenuItem}
        onItemClick={handleMenuItemClick}
      />
      
      {/* Main Contractor Content */}
      <main
        style={{
          minHeight: '100vh',
          marginLeft: isRTL ? '0' : (isDesktop ? '280px' : '0'),
          marginRight: isRTL ? (isDesktop ? '280px' : '0') : '0',
          padding: isDesktop 
            ? '1.5rem'
            : '4.5rem 1rem 1.5rem 1rem', // Top padding for mobile menu
          boxSizing: 'border-box',
          width: isDesktop ? 'calc(100% - 280px)' : '100%',
          transition: theme.transitions.normal,
        }}
      >
        {renderActiveContent()}
      </main>
    </div>
  );
};

export default ContractorApp;