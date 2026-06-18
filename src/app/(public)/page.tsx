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

const SITE_URL = 'https://www.mahatathastu.com'

const LOCAL_BIZ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': `${SITE_URL}/#business`,
  name: 'MahaTathastu',
  url: SITE_URL,
  telephone: '+91-9858784784',
  email: 'support@mahatathastu.com',
  description: "India's first 360° holistic life platform - Vedic astrology, numerology, chakra analysis, Vastu, and Ayurveda reports for your entire family.",
  priceRange: '₹299 - ₹2999',
  areaServed: { '@type': 'Country', name: 'India' },
  serviceType: ['Vedic Astrology', 'Numerology', 'Chakra Analysis', 'Vastu Consultation', 'Ayurveda', 'Spiritual Reports'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Holistic Life Reports',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Vedic Astrology & Kundli Report' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Numerology Report' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Chakra Analysis Report' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Vastu Report' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Prakriti Ayurveda Report' } },
    ],
  },
}

export const metadata: Metadata = {
  title: { absolute: 'MahaTathastu | Vedic Astrology & Holistic Reports' },
  description: "14 personalized holistic life reports for your entire family - Vedic astrology, numerology, chakra, Vastu, Prakriti & more. Powered by Nakshatra AI.",
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BIZ_SCHEMA) }} />
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
