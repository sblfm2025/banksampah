import {
  FeaturedProgramsSection,
  FoundationIntroSection,
  FounderStorySection,
  HeroSection,
  HowItWorksSection,
  ImpactStatsSection,
  ImpactVisualSection,
  LandingHeader,
  MediaMentionSection,
  PublicFooter,
  QuickBenefitsSection,
  RecognitionSection,
  RoleLoginSection,
  ServiceAreaSection,
  ServicesSection,
  SolutionsSection,
  WasteTypesSection,
  WhatsAppCTASection,
  CommunityFeatureSection,
} from './landing/LandingSections';

export function PublicHomePage() {
  return (
    <>
      <LandingHeader />
      <main>
        <HeroSection />
        <FoundationIntroSection />
        <CommunityFeatureSection />
        <QuickBenefitsSection />
        <ServicesSection />
        <FeaturedProgramsSection />
        <HowItWorksSection />
        <WasteTypesSection />
        <SolutionsSection />
        <ImpactVisualSection />
        <ImpactStatsSection />
        <FounderStorySection />
        <RecognitionSection />
        <MediaMentionSection />
        <ServiceAreaSection />
        <RoleLoginSection />
        <WhatsAppCTASection />
      </main>
      <PublicFooter />
    </>
  );
}
