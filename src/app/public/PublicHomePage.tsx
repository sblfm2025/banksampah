import {
  FeaturedProgramsSection,
  FAQSection,
  FoundationIntroSection,
  FounderStorySection,
  HeroSection,
  HowItWorksSection,
  ImpactStatsSection,
  ImpactVisualSection,
  LandingBootAnimation,
  LandingHeader,
  MediaMentionSection,
  PublicFooter,
  ProcessingPartnersSection,
  ProfessionalServicesSection,
  QuickBenefitsSection,
  RecognitionSection,
  RoleLoginSection,
  ServiceAreaSection,
  ServicesSection,
  SolutionFinderSection,
  SolutionsSection,
  WasteTypesSection,
  WhatsAppCTASection,
  CommunityFeatureSection,
} from './landing/LandingSections';
import { FloatingWhatsApp } from '../ui/FloatingWhatsApp';

export function PublicHomePage() {
  return (
    <>
      <LandingHeader />
      <LandingBootAnimation />
      <main>
        <HeroSection />
        <SolutionFinderSection />
        <FoundationIntroSection />
        <QuickBenefitsSection />
        <ServicesSection />
        <ProfessionalServicesSection />
        <HowItWorksSection />
        <CommunityFeatureSection />
        <FeaturedProgramsSection />
        <WasteTypesSection />
        <SolutionsSection />
        <ImpactStatsSection />
        <ProcessingPartnersSection />
        <ImpactVisualSection />
        <FounderStorySection />
        <RecognitionSection />
        <MediaMentionSection />
        <ServiceAreaSection />
        <FAQSection />
        <RoleLoginSection />
        <WhatsAppCTASection />
      </main>
      <FloatingWhatsApp />
      <PublicFooter />
    </>
  );
}
