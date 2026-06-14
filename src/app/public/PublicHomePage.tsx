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
        <HowItWorksSection />
        <CommunityFeatureSection />
        <FeaturedProgramsSection />
        <WasteTypesSection />
        <SolutionsSection />
        <ImpactStatsSection />
        <ImpactVisualSection />
        <FounderStorySection />
        <RecognitionSection />
        <MediaMentionSection />
        <ServiceAreaSection />
        <FAQSection />
        <RoleLoginSection />
        <WhatsAppCTASection />
      </main>
      <PublicFooter />
    </>
  );
}
