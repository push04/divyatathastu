import HeroSection from '@/components/home/HeroSection'
import PanchangWidget from '@/components/home/PanchangWidget'
import ServicesGrid from '@/components/home/ServicesGrid'
import HowItWorks from '@/components/home/HowItWorks'
import Testimonials from '@/components/home/Testimonials'
import InMediaSection from '@/components/home/InMediaSection'
import MandirTeaser from '@/components/home/MandirTeaser'
import TathastuCTA from '@/components/home/TathastuCTA'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import DivineServicesSection from '@/components/home/DivineServicesSection'
import NewsletterStrip from '@/components/layout/NewsletterStrip'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "MahaTathastu - India's First 360° Holistic Life Report Platform",
  description: "14 personalized holistic life reports for your entire family - Vedic astrology, numerology, chakra, Vastu, Prakriti & more. Powered by Nakshatra AI.",
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PanchangWidget />
      <ServicesGrid />
      <HowItWorks />
      <TathastuCTA />
      <DivineServicesSection />
      <FeaturedProducts />
      <MandirTeaser />
      <Testimonials />
      <InMediaSection />
      <NewsletterStrip />
    </>
  )
}
