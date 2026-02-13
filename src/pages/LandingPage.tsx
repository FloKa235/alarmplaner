import { useState } from 'react'
import type { TargetGroup } from '@/types'
import { landingContent } from '@/data/landing-content'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import ChallengesSection from '@/components/landing/ChallengesSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import BenefitsSection from '@/components/landing/BenefitsSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import PricingSection from '@/components/landing/PricingSection'
import FAQSection from '@/components/landing/FAQSection'
import CTABanner from '@/components/landing/CTABanner'
import ContactSection from '@/components/landing/ContactSection'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<TargetGroup>('kommunen')
  const content = landingContent[activeTab]

  const handleTabChange = (tab: TargetGroup) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
      <main>
        <HeroSection content={content.hero} activeTab={activeTab} onTabChange={handleTabChange} />
        <ChallengesSection
          title={content.challenges.title}
          subtitle={content.challenges.subtitle}
          items={content.challenges.items}
        />
        <FeaturesSection
          title={content.features.title}
          subtitle={content.features.subtitle}
          items={content.features.items}
        />
        <BenefitsSection
          title={content.benefits.title}
          subtitle={content.benefits.subtitle}
          items={content.benefits.items}
        />
        <TestimonialsSection
          title={content.testimonials.title}
          items={content.testimonials.items}
        />
        <PricingSection pricing={content.pricing} activeTab={activeTab} />
        <FAQSection items={content.faq} />
        <CTABanner content={content.ctaBanner} activeTab={activeTab} />
        <ContactSection activeTab={activeTab} />
      </main>
      <Footer />
    </div>
  )
}
