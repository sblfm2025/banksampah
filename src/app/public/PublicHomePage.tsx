import {
  FeaturedProgramsSection,
  FoundationIntroSection,
  FounderStorySection,
  HeroSection,
  HowItWorksSection,
  ImpactStatsSection,
  LandingHeader,
  PublicFooter,
  QuickBenefitsSection,
  RoleLoginSection,
  ServiceAreaSection,
  ServicesSection,
  SolutionsSection,
  WasteTypesSection,
  WhatsAppCTASection,
} from './landing/LandingSections';

export function PublicHomePage() {
  return (
    <>
      <LandingHeader />
      <main>
        <HeroSection />
        <QuickBenefitsSection />
        <FoundationIntroSection />
        <ServicesSection />
        <FeaturedProgramsSection />
        <HowItWorksSection />
        <WasteTypesSection />
        <SolutionsSection />
        <ImpactStatsSection />
        <FounderStorySection />
        <ServiceAreaSection />
        <RoleLoginSection />
        <WhatsAppCTASection />
      </main>
      <PublicFooter />
    </>
  );
}
