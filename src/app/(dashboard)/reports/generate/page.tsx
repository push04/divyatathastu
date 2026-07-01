'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { usePaymentNotice } from '@/lib/hooks/usePaymentNotice'

interface FamilyMember {
  id: string
  full_name: string
  relation: string
  date_of_birth: string
  time_of_birth: string | null
  place_of_birth: string | null
  birth_latitude: number | null
  birth_longitude: number | null
  birth_timezone: string | null
}

const REPORT_TYPES = [
  { id: 'full_tathastu', label: 'Full Tathastu', labelHi: 'पूर्ण तथास्तु', icon: 'auto_awesome', desc: 'All 12 reports combined - complete life blueprint', descHi: 'सभी 12 रिपोर्ट एक साथ - सम्पूर्ण जीवन खाका', price: 2999, badge: 'BEST VALUE', badgeHi: 'सर्वोत्तम मूल्य' },
  { id: 'astrology', label: 'Kundli / Horoscope', labelHi: 'कुंडली / जन्मपत्री', icon: 'brightness_7', desc: 'Birth chart, planets, dashas, predictions', descHi: 'जन्म कुंडली, ग्रह, दशाएं, भविष्यवाणी', price: 499 },
  { id: 'numerology', label: 'Numerology', labelHi: 'अंकशास्त्र', icon: 'tag', desc: 'Life path, destiny, lucky numbers & mobile compatibility', descHi: 'जीवन पथ, भाग्यांक, शुभ अंक और मोबाइल अनुकूलता', price: 299 },
  { id: 'shakti_chakra', label: 'Chakra Analysis', labelHi: 'चक्र विश्लेषण', icon: 'local_florist', desc: 'All 7 chakras - balance, mantras, crystals', descHi: 'सातों चक्र - संतुलन, मंत्र, क्रिस्टल', price: 299 },
  { id: 'prakriti', label: 'Prakriti (Ayurveda)', labelHi: 'प्रकृति (आयुर्वेद)', icon: 'eco', desc: 'Vata-Pitta-Kapha constitution + diet & herbs', descHi: 'वात-पित्त-कफ प्रकृति + आहार और जड़ी-बूटियां', price: 299 },
  { id: 'yantra_colour', label: 'Yantra & Colour', labelHi: 'यंत्र और रंग', icon: 'palette', desc: 'Personal yantra, power colors, gemstone', descHi: 'व्यक्तिगत यंत्र, शक्तिशाली रंग, रत्न', price: 299 },
  { id: 'mantra_chanting', label: 'Mantra Science', labelHi: 'मंत्र विज्ञान', icon: 'temple_hindu', desc: 'Personal beej mantra, likhit japa guidance', descHi: 'व्यक्तिगत बीज मंत्र, लिखित जप मार्गदर्शन', price: 299 },
  { id: 'mantra_writing', label: 'Likhit Japa (Mantra Lekhnan)', labelHi: 'लिखित जप मार्गदर्शन', icon: 'edit_note', desc: 'Nakshatra-specific written mantra practice — 4-step Ganpati + Gayatri + VS Shloka protocol', descHi: 'नक्षत्र-आधारित लिखित जप अभ्यास — चार-चरण गणपति + गायत्री + विष्णु सहस्रनाम श्लोक', price: 199 },
  { id: 'astro_vastu', label: 'Vastu Report', labelHi: 'वास्तु रिपोर्ट', icon: 'house', desc: 'Home/office direction analysis & remedies', descHi: 'घर/कार्यालय दिशा विश्लेषण और उपाय', price: 399 },
  { id: 'child_development', label: 'Child Development', labelHi: 'बाल विकास', icon: 'child_care', desc: 'Learning style, talents, education guidance', descHi: 'सीखने की शैली, प्रतिभा, शिक्षा मार्गदर्शन', price: 399 },
  { id: 'dmit', label: 'DMIT (Brain Mapping)', labelHi: 'DMIT (मस्तिष्क मानचित्र)', icon: 'psychology', desc: 'Multiple intelligence profile, career fit', descHi: 'बहु-बुद्धिमत्ता प्रोफाइल, करियर उपयुक्तता', price: 499 },
  { id: 'colour_therapy', label: 'Colour Therapy', labelHi: 'रंग चिकित्सा', icon: 'colorize', desc: 'Healing colors for health, wealth & love', descHi: 'स्वास्थ्य, धन और प्रेम के लिए उपचारात्मक रंग', price: 299 },
  { id: 'psychology', label: 'Vedic Psychology', labelHi: 'वैदिक मनोविज्ञान', icon: 'self_improvement', desc: 'Moon sign personality, EQ, shadow work', descHi: 'चंद्र राशि व्यक्तित्व, भावनात्मक बुद्धि, छाया कार्य', price: 399 },
]

const DIRECTIONS = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West']
const DIRECTIONS_HI = ['उत्तर', 'उत्तर-पूर्व', 'पूर्व', 'दक्षिण-पूर्व', 'दक्षिण', 'दक्षिण-पश्चिम', 'पश्चिम', 'उत्तर-पश्चिम']
const SLEEP_DIRS = ['North', 'South', 'East', 'West']
const SLEEP_DIRS_HI = ['उत्तर', 'दक्षिण', 'पूर्व', 'पश्चिम']

// Section definitions - each becomes one /api/noxatra/section call
const FULL_TATHASTU_SECTIONS = [
  { sectionType: 'astrology',       name: 'Kundli & Birth Chart',         nameHi: 'कुंडली व जन्म पत्री',    icon: 'brightness_7',   estSeconds: 12 },
  { sectionType: 'numerology',      name: 'Numerology Analysis',          nameHi: 'अंक विज्ञान',             icon: 'tag',            estSeconds: 4  },
  { sectionType: 'shakti_chakra',   name: 'Shakti Chakra Analysis',       nameHi: 'शक्ति चक्र विश्लेषण',   icon: 'local_florist',  estSeconds: 4  },
  { sectionType: 'prakriti',        name: 'Prakriti (Ayurveda)',          nameHi: 'प्रकृति आयुर्वेद',        icon: 'eco',            estSeconds: 3  },
  { sectionType: 'yantra_colour',   name: 'Yantra & Colour Therapy',      nameHi: 'यंत्र और रंग चिकित्सा',  icon: 'palette',        estSeconds: 3  },
  { sectionType: 'mantra_chanting', name: 'Mantra Science',               nameHi: 'मंत्र विज्ञान',            icon: 'temple_hindu',   estSeconds: 3  },
  { sectionType: 'psychology',      name: 'Vedic Psychology',             nameHi: 'वैदिक मनोविज्ञान',       icon: 'self_improvement', estSeconds: 3 },
  { sectionType: 'astro_vastu',     name: 'Astro Vastu Report',           nameHi: 'ज्योतिष वास्तु',          icon: 'house',          estSeconds: 4  },
  { sectionType: 'dmit',            name: 'Brain Mapping (DMIT)',         nameHi: 'मस्तिष्क मानचित्र',      icon: 'psychology',     estSeconds: 4  },
  { sectionType: 'colour_therapy',  name: 'Colour Therapy',               nameHi: 'रंग चिकित्सा',             icon: 'colorize',       estSeconds: 3  },
  { sectionType: '_finale',         name: 'Annual Predictions & Remedies',nameHi: 'वार्षिक भविष्यवाणी',     icon: 'event_note',     estSeconds: 4  },
]

// Sanskrit subtitles for progress screen
const SECTION_SANSKRIT: Record<string, string> = {
  astrology: 'ग्रह ज्योतिष',
  numerology: 'अंक विद्या',
  shakti_chakra: 'शक्ति चक्र',
  prakriti: 'त्रिदोष प्रकृति',
  yantra_colour: 'यंत्र शास्त्र',
  mantra_chanting: 'बीज मंत्र',
  psychology: 'मनो विश्लेषण',
  astro_vastu: 'दिशा शास्त्र',
  dmit: 'मस्तिष्क मानचित्र',
  colour_therapy: 'रंग चिकित्सा',
  _finale: 'काल भविष्यवाणी',
}

// Individual report type → section list (single section)
const SINGLE_SECTIONS: Record<string, { sectionType: string; name: string; nameHi: string; icon: string; estSeconds: number }[]> = {
  astrology:       [{ sectionType: 'astrology',       name: 'Kundli & Birth Chart',   nameHi: 'कुंडली विश्लेषण', icon: 'brightness_7',     estSeconds: 12 }],
  numerology:      [{ sectionType: 'numerology',      name: 'Numerology Analysis',    nameHi: 'अंक विश्लेषण',   icon: 'tag',               estSeconds: 6  }],
  shakti_chakra:   [{ sectionType: 'shakti_chakra',   name: 'Chakra Analysis',        nameHi: 'चक्र विश्लेषण',  icon: 'local_florist',    estSeconds: 8  }],
  prakriti:        [{ sectionType: 'prakriti',        name: 'Prakriti (Ayurveda)',    nameHi: 'आयुर्वेद प्रकृति', icon: 'eco',             estSeconds: 6  }],
  yantra_colour:   [{ sectionType: 'yantra_colour',   name: 'Yantra & Colour',        nameHi: 'यंत्र और रंग',   icon: 'palette',          estSeconds: 6  }],
  mantra_chanting: [{ sectionType: 'mantra_chanting', name: 'Mantra Science',         nameHi: 'मंत्र विज्ञान',   icon: 'temple_hindu',    estSeconds: 6  }],
  mantra_writing:  [{ sectionType: 'mantra_writing',  name: 'Likhit Japa Guide',      nameHi: 'लिखित जप मार्गदर्शन', icon: 'edit_note',    estSeconds: 6  }],
  astro_vastu:     [{ sectionType: 'astro_vastu',     name: 'Vastu Analysis',         nameHi: 'वास्तु विश्लेषण', icon: 'house',           estSeconds: 8  }],
  child_development:[{ sectionType: 'child_development', name: 'Child Development',   nameHi: 'बाल विकास',       icon: 'child_care',      estSeconds: 8  }],
  dmit:            [{ sectionType: 'dmit',            name: 'Brain Mapping',          nameHi: 'मस्तिष्क मानचित्र', icon: 'psychology',   estSeconds: 8  }],
  colour_therapy:  [{ sectionType: 'colour_therapy',  name: 'Colour Therapy',         nameHi: 'रंग चिकित्सा',   icon: 'colorize',        estSeconds: 6  }],
  psychology:      [{ sectionType: 'psychology',      name: 'Vedic Psychology',       nameHi: 'वैदिक मनोविज्ञान', icon: 'self_improvement', estSeconds: 8 }],
  mobile_number:   [{ sectionType: 'mobile_number',   name: 'Mobile Analysis',        nameHi: 'मोबाइल विश्लेषण', icon: 'phone',           estSeconds: 4  }],
}

const T = {
  en: {
    title: 'Generate Nakshatra Report',
    subtitle: 'Vedic analysis powered by astronomy calculations',
    steps: ['Select Member', 'Choose Report', 'Additional Info', 'Generate'],
    selectMember: 'Select Family Member',
    noMembers: 'No family members yet',
    noMembersDesc: 'Add a family member first to generate reports',
    addMember: 'Add Member',
    chooseReport: 'Choose Report Type',
    additionalInfo: 'Additional Information',
    vastuDesc: 'Vastu report requires a few details about your home.',
    doorDir: 'Main Door Direction',
    selectDir: 'Select direction',
    sleepDir: 'Sleep Direction (head points to)',
    allSet: 'All set!',
    allSetDesc: 'No additional information needed for this report type.',
    readyGenerate: 'Ready to Generate',
    member: 'Member',
    reportType: 'Report Type',
    poweredBy: 'Engine',
    estTime: 'Est. Time',
    prevFailed: 'Previous attempt failed',
    generate: 'Generate Report Now',
    retry: 'Retry Generation',
    back: 'Back',
    continue: 'Continue',
    craftingTitle: 'Divinely Crafting Your Report',
    craftingSubtitle: 'Each chapter is being computed from sacred astronomical calculations',
    remaining: 'seconds remaining',
    viewReport: 'View Your Report',
    langToggle: 'EN',
  },
  hi: {
    title: 'नोक्षत्र रिपोर्ट बनाएं',
    subtitle: 'ज्योतिषीय गणनाओं पर आधारित वैदिक विश्लेषण',
    steps: ['सदस्य चुनें', 'रिपोर्ट चुनें', 'अतिरिक्त जानकारी', 'बनाएं'],
    selectMember: 'परिवार का सदस्य चुनें',
    noMembers: 'अभी कोई परिवार सदस्य नहीं',
    noMembersDesc: 'रिपोर्ट बनाने के लिए पहले परिवार का सदस्य जोड़ें',
    addMember: 'सदस्य जोड़ें',
    chooseReport: 'रिपोर्ट प्रकार चुनें',
    additionalInfo: 'अतिरिक्त जानकारी',
    vastuDesc: 'वास्तु रिपोर्ट के लिए आपके घर की कुछ जानकारी चाहिए।',
    doorDir: 'मुख्य द्वार की दिशा',
    selectDir: 'दिशा चुनें',
    sleepDir: 'सोने की दिशा (सिर की ओर)',
    allSet: 'सब तैयार है!',
    allSetDesc: 'इस रिपोर्ट के लिए कोई अतिरिक्त जानकारी की आवश्यकता नहीं।',
    readyGenerate: 'रिपोर्ट बनाने के लिए तैयार',
    member: 'सदस्य',
    reportType: 'रिपोर्ट प्रकार',
    poweredBy: 'इंजन',
    estTime: 'अनुमानित समय',
    prevFailed: 'पिछला प्रयास विफल हुआ',
    generate: 'अभी रिपोर्ट बनाएं',
    retry: 'पुनः प्रयास करें',
    back: 'वापस',
    continue: 'आगे बढ़ें',
    craftingTitle: 'आपकी रिपोर्ट दिव्य रूप से बन रही है',
    craftingSubtitle: 'प्रत्येक अध्याय पवित्र ज्योतिषीय गणनाओं से तैयार हो रहा है',
    remaining: 'सेकंड शेष',
    viewReport: 'रिपोर्ट देखें',
    langToggle: 'हिं',
  },
}

type SectionStatus = 'pending' | 'active' | 'done' | 'error'

interface SectionProgress {
  sectionType: string
  name: string
  nameHi: string
  icon: string
  estSeconds: number
  status: SectionStatus
  elapsed?: number
}

function GenerateReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [lang, setLang] = useState<'en' | 'hi'>('en')
  const [step, setStep] = useState(0)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [reportPrices, setReportPrices] = useState<Record<string, number>>({})
  const [selectedMember, setSelectedMember] = useState<string>(searchParams.get('member') || '')
  const [selectedReport, setSelectedReport] = useState<string>('')
  const [vastuData, setVastuData] = useState({ homeDirection: '', sleepDirection: 'south' })
  const [lastError, setLastError] = useState<string | null>(null)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)
  const [sections, setSections] = useState<SectionProgress[]>([])
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [allDone, setAllDone] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const { confirmPayment, NoticeModal } = usePaymentNotice()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const t = T[lang]
  const isHindi = lang === 'hi'

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: family } = await supabase.from('families').select('id').eq('owner_id', user.id).single()
      if (!family) return
      const { data } = await supabase.from('family_members').select('id,full_name,relation,date_of_birth,time_of_birth,place_of_birth,birth_latitude,birth_longitude,birth_timezone').eq('family_id', family.id)
      if (data) setMembers(data)
      try {
        const pr = await fetch('/api/report-pricing', { cache: 'no-store' }).then(r => r.json())
        if (pr && Object.keys(pr).length > 0) setReportPrices(pr)
      } catch {}
    }
    load()
    if (searchParams.get('member')) setStep(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (!generating || allDone) return
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [generating, allDone])

  async function doGenerate() {
    setLastError(null)
    setGenerating(true)

    // Build section list
    const sectionDefs = selectedReport === 'full_tathastu'
      ? FULL_TATHASTU_SECTIONS
      : (SINGLE_SECTIONS[selectedReport] || [{ sectionType: selectedReport, name: selectedReport, nameHi: selectedReport, icon: 'article', estSeconds: 10 }])

    const initialSections: SectionProgress[] = sectionDefs.map(s => ({ ...s, status: 'pending' }))
    setSections(initialSections)
    setSecondsLeft(sectionDefs.reduce((a, s) => a + s.estSeconds, 0))

    try {
      // Step 1: Create report record (instant)
      const createRes = await fetch('/api/noxatra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_member_id: selectedMember,
          report_types: [selectedReport],
          vastu: selectedReport === 'astro_vastu' ? vastuData : undefined,
          language: lang,
        }),
      })

      if (!createRes.ok) {
        const d = await createRes.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to create report')
      }

      const createData = await createRes.json()
      const rId = createData.reportId
      if (!rId) throw new Error('No report ID returned')
      setReportId(rId)

      // Step 2: Generate sections sequentially
      for (let i = 0; i < sectionDefs.length; i++) {
        const sec = sectionDefs[i]
        const isFinal = i === sectionDefs.length - 1

        // Mark as active
        setSections(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'active' } : s
        ))

        const start = Date.now()
        const secRes = await fetch('/api/noxatra/section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportId: rId, sectionType: sec.sectionType, isFinal }),
        })

        const elapsed = Math.round((Date.now() - start) / 1000)

        if (!secRes.ok) {
          const d = await secRes.json().catch(() => ({}))
          // Mark as error but continue with other sections
          setSections(prev => prev.map((s, idx) =>
            idx === i ? { ...s, status: 'error', elapsed } : s
          ))
          console.error(`Section ${sec.sectionType} failed:`, d.error)
          continue
        }

        setSections(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'done', elapsed } : s
        ))

        // Update remaining time estimate
        const remainingEst = sectionDefs.slice(i + 1).reduce((a, s) => a + s.estSeconds, 0)
        setSecondsLeft(remainingEst)
      }

      // Ensure report is marked generated even if the _finale section errored
      const { data: finalReport } = await supabase.from('reports').select('status').eq('id', rId).single()
      if (finalReport?.status !== 'generated') {
        await supabase.from('reports').update({ status: 'generated' as any }).eq('id', rId)
      }

      setAllDone(true)
      setSecondsLeft(0)
      if (timerRef.current) clearInterval(timerRef.current)
      toast.success(isHindi ? 'रिपोर्ट सफलतापूर्वक बनाई गई!' : 'Report generated successfully!')
    } catch (err: any) {
      const msg = err.message || 'Generation failed. Please try again.'
      setLastError(msg)
      toast.error(msg)
      setGenerating(false)
      setSections([])
    }
  }

  async function handleGenerate() {
    if (!selectedMember || !selectedReport) {
      toast.error(isHindi ? 'सदस्य और रिपोर्ट प्रकार चुनें' : 'Select member and report type')
      return
    }
    if (selectedReport === 'astro_vastu' && !vastuData.homeDirection) {
      toast.error(isHindi ? 'कृपया वास्तु रिपोर्ट के लिए मुख्य द्वार की दिशा चुनें' : 'Please select the main door direction for Vastu report')
      setStep(2)
      return
    }
    const price = selectedReportInfo?.price || 0
    if (price > 0) {
      confirmPayment(selectedReportInfo?.label || 'Vedic Report', price, () => proceedToPayment(price))
      return
    }
    doGenerate()
  }

  async function proceedToPayment(price: number) {
    setPaymentProcessing(true)
    try {
        const res = await fetch('/api/payment?action=create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ id: selectedReport, name: selectedReportInfo?.label, price, quantity: 1, product_type: 'report' }],
          }),
        })
        const orderData = await res.json()
        if (!res.ok) throw new Error(orderData.error)

        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        document.head.appendChild(script)
        await new Promise(resolve => { script.onload = resolve })

        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: 'INR',
          order_id: orderData.order_id,
          name: 'MahaTathastu',
          description: `${isHindi ? selectedReportInfo?.labelHi : selectedReportInfo?.label} Report`,
          theme: { color: '#2F2A44' },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch('/api/payment?action=verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...response, db_order_id: orderData.db_order_id }),
              })
              const verifyData = await verifyRes.json()
              if (!verifyRes.ok || !verifyData.verified) {
                throw new Error(verifyData.error || 'Payment verification failed')
              }
            } catch (err: any) {
              setPaymentProcessing(false)
              toast.error(err.message || 'Payment verification failed. Contact support.')
              return
            }
            setPaymentProcessing(false)
            toast.success(isHindi ? 'भुगतान सफल! रिपोर्ट बन रही है…' : 'Payment successful! Generating report…')
            doGenerate()
          },
          modal: { ondismiss: () => setPaymentProcessing(false) },
        })
      rzp.open()
    } catch (err: any) {
      toast.error(err.message || 'Payment failed')
      setPaymentProcessing(false)
    }
  }

  const canProceed = [
    selectedMember !== '',
    selectedReport !== '',
    selectedReport === 'astro_vastu' ? vastuData.homeDirection !== '' : true,
    true,
  ]

  const selectedReportInfoBase = REPORT_TYPES.find(r => r.id === selectedReport)
  const selectedReportInfo = selectedReportInfoBase
    ? { ...selectedReportInfoBase, price: reportPrices[selectedReportInfoBase.id] ?? selectedReportInfoBase.price }
    : undefined
  const selectedMemberInfo = members.find(m => m.id === selectedMember)
  const totalEstSeconds = selectedReport === 'full_tathastu' ? 47 : (SINGLE_SECTIONS[selectedReport]?.[0]?.estSeconds || 10)

  // ── GENERATION PROGRESS VIEW ──
  if (generating) {
    const doneSections = sections.filter(s => s.status === 'done').length
    const totalSections = sections.length
    const progressPct = totalSections > 0 ? Math.round((doneSections / totalSections) * 100) : 0

    return (
      <>
        <style>{`
          @keyframes gen-om-float {
            0%,100%{transform:translateY(0) scale(1);filter:drop-shadow(0 0 18px rgba(212,160,23,0.7))}
            50%{transform:translateY(-10px) scale(1.06);filter:drop-shadow(0 0 36px rgba(212,160,23,1))}
          }
          @keyframes gen-ring-cw{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(360deg)}}
          @keyframes gen-ring-ccw{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(-360deg)}}
          @keyframes gen-gold-pulse{
            0%,100%{box-shadow:0 0 0 0 rgba(212,160,23,0.3),0 2px 8px rgba(0,0,0,0.06);border-color:rgba(212,160,23,0.5)}
            50%{box-shadow:0 0 18px 5px rgba(212,160,23,0.18),0 2px 8px rgba(0,0,0,0.06);border-color:rgba(212,160,23,0.95)}
          }
          @keyframes gen-shimmer{
            0%{background-position:-300% center}
            100%{background-position:300% center}
          }
          @keyframes gen-bar-glow{
            0%,100%{filter:drop-shadow(0 0 3px rgba(212,160,23,0.45))}
            50%{filter:drop-shadow(0 0 10px rgba(212,160,23,0.85))}
          }
          @keyframes gen-dot{
            0%,100%{opacity:1;transform:scale(1)}
            50%{opacity:0.25;transform:scale(0.5)}
          }
          @keyframes gen-done-pop{
            0%{transform:scale(0.85);opacity:0}
            60%{transform:scale(1.08)}
            100%{transform:scale(1);opacity:1}
          }
          @keyframes gen-cta-shine{
            0%,100%{box-shadow:0 8px 28px rgba(194,98,42,0.45)}
            50%{box-shadow:0 12px 40px rgba(194,98,42,0.65),0 0 0 4px rgba(212,160,23,0.15)}
          }
          @keyframes gen-star-twinkle-a{0%,100%{opacity:.15}50%{opacity:.7}}
          @keyframes gen-star-twinkle-b{0%,100%{opacity:.25}60%{opacity:.9}}
          @keyframes gen-star-twinkle-c{0%,100%{opacity:.1}40%{opacity:.6}}
          .gen-om{animation:gen-om-float 3.4s ease-in-out infinite}
          .gen-ring-cw{position:absolute;top:50%;left:50%;border-radius:50%;pointer-events:none;animation:gen-ring-cw 22s linear infinite}
          .gen-ring-ccw{position:absolute;top:50%;left:50%;border-radius:50%;pointer-events:none;animation:gen-ring-ccw 15s linear infinite}
          .gen-active{animation:gen-gold-pulse 1.9s ease-in-out infinite}
          .gen-shimmer{background:linear-gradient(90deg,#d1fae5 0%,#a7f3d0 20%,#ecfdf5 40%,#bbf7d0 60%,#a7f3d0 80%,#d1fae5 100%);background-size:300% auto;animation:gen-shimmer 2.8s linear infinite}
          .gen-bar-fill{animation:gen-bar-glow 2.2s ease-in-out infinite}
          .gen-d1{animation:gen-dot 1.2s ease-in-out 0s infinite}
          .gen-d2{animation:gen-dot 1.2s ease-in-out 0.22s infinite}
          .gen-d3{animation:gen-dot 1.2s ease-in-out 0.44s infinite}
          .gen-cta{animation:gen-cta-shine 2.8s ease-in-out infinite}
          .gen-s-a{animation:gen-star-twinkle-a 2.1s ease-in-out infinite}
          .gen-s-b{animation:gen-star-twinkle-b 2.9s ease-in-out 0.4s infinite}
          .gen-s-c{animation:gen-star-twinkle-c 1.8s ease-in-out 0.8s infinite}
          .gen-s-d{animation:gen-star-twinkle-a 3.2s ease-in-out 1.2s infinite}
          .gen-s-e{animation:gen-star-twinkle-b 2.5s ease-in-out 0.6s infinite}
          .gen-s-f{animation:gen-star-twinkle-c 3.8s ease-in-out 0.2s infinite}
          .gen-s-g{animation:gen-star-twinkle-a 1.6s ease-in-out 1.6s infinite}
          .gen-s-h{animation:gen-star-twinkle-b 2.3s ease-in-out 0.9s infinite}
        `}</style>
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
          <div style={{ borderRadius: 22, overflow: 'hidden', boxShadow: '0 28px 80px rgba(47,42,68,0.32), 0 0 0 1px rgba(212,160,23,0.18)' }}>

            {/* ── Cosmic header ── */}
            <div style={{ background: 'linear-gradient(160deg, #0f0b22 0%, #2F2A44 50%, #3a1e04 100%)', padding: '44px 32px 38px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              {/* Stars */}
              {[
                {cls:'gen-s-a',top:'12%',left:'8%',sz:3},{cls:'gen-s-b',top:'20%',left:'85%',sz:2},{cls:'gen-s-c',top:'35%',left:'14%',sz:2},
                {cls:'gen-s-d',top:'8%',left:'55%',sz:2},{cls:'gen-s-e',top:'65%',left:'92%',sz:3},{cls:'gen-s-f',top:'80%',left:'6%',sz:2},
                {cls:'gen-s-g',top:'50%',left:'78%',sz:2},{cls:'gen-s-h',top:'28%',left:'42%',sz:2},
              ].map((s, i) => (
                <div key={i} className={s.cls} style={{ position: 'absolute', top: s.top, left: s.left, width: s.sz, height: s.sz, borderRadius: '50%', background: 'white', zIndex: 0 }} />
              ))}

              {/* Concentric rings */}
              <div className="gen-ring-cw" style={{ width: 380, height: 380, marginLeft: -190, marginTop: -190, border: '1px solid rgba(212,160,23,0.1)', zIndex: 0 }} />
              <div className="gen-ring-ccw" style={{ width: 270, height: 270, marginLeft: -135, marginTop: -135, border: '1px dashed rgba(212,160,23,0.18)', zIndex: 0 }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 170, height: 170, border: '1px solid rgba(212,160,23,0.09)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

              {/* Chakra logo */}
              <div className="gen-om" style={{ marginBottom: 18, position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <SudarshanLoader px={72} />
              </div>

              <h2 style={{ color: '#fff', fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 6, position: 'relative', zIndex: 2 }}>
                {t.craftingTitle}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: 13, position: 'relative', zIndex: 2 }}>{t.craftingSubtitle}</p>
              {selectedMemberInfo && (
                <p style={{ color: '#D4A017', fontSize: 13, fontWeight: 600, marginTop: 12, position: 'relative', zIndex: 2, letterSpacing: '0.01em' }}>
                  {selectedMemberInfo.full_name} · {isHindi ? selectedReportInfo?.labelHi : selectedReportInfo?.label}
                </p>
              )}
            </div>

            {/* ── Progress bar ── */}
            <div style={{ background: '#FDFAF5', padding: '20px 28px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2F2A44' }}>
                  {doneSections}/{totalSections} {isHindi ? 'अध्याय पूर्ण' : 'chapters done'}
                </span>
                {!allDone && secondsLeft > 0 ? (
                  <span style={{ fontSize: 12, color: 'rgba(42,32,28,0.45)' }}>~{secondsLeft}s {t.remaining}</span>
                ) : allDone ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{isHindi ? 'पूर्ण ✓' : 'Complete ✓'}</span>
                ) : null}
              </div>
              <div style={{ background: '#EDE8DC', borderRadius: 9999, height: 8, overflow: 'hidden' }}>
                <div
                  className="gen-bar-fill"
                  style={{ height: '100%', borderRadius: 9999, background: 'linear-gradient(90deg, #C2622A, #D4A017)', width: `${allDone ? 100 : progressPct}%`, transition: 'width 0.8s ease' }}
                />
              </div>
            </div>

            {/* ── Section list ── */}
            <div style={{ background: '#FDFAF5', padding: '14px 28px 26px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sections.map((sec) => {
                const isDone = sec.status === 'done'
                const isActive = sec.status === 'active'
                const isErr = sec.status === 'error'
                return (
                  <div
                    key={sec.sectionType}
                    className={isActive ? 'gen-active' : isDone ? 'gen-shimmer' : ''}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 16px', borderRadius: 14,
                      border: `1.5px solid ${isDone ? '#6ee7b7' : isActive ? 'rgba(212,160,23,0.5)' : isErr ? '#fca5a5' : '#EDE8DC'}`,
                      background: isErr ? '#fef2f2' : undefined,
                      transition: 'border-color 0.35s ease',
                    }}
                  >
                    {/* Icon */}
                    <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isDone ? (
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#10b981', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      ) : isActive ? (
                        <SudarshanLoader size="sm" />
                      ) : isErr ? (
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#f87171', fontVariationSettings: "'FILL' 1" }}>error</span>
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'rgba(42,32,28,0.2)' }}>{sec.icon}</span>
                      )}
                    </div>

                    {/* Name + Sanskrit */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: isDone ? '#065f46' : isActive ? '#2F2A44' : isErr ? '#dc2626' : 'rgba(42,32,28,0.28)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                        {isHindi ? sec.nameHi : sec.name}
                      </p>
                      {sec.status !== 'pending' && (
                        <p style={{ fontSize: 10, color: isDone ? '#10b981' : 'rgba(42,32,28,0.3)', margin: '2px 0 0' }}>
                          {SECTION_SANSKRIT[sec.sectionType] || ''}
                        </p>
                      )}
                    </div>

                    {/* Time / dots */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {isActive && (
                        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                          <span className="gen-d1" style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4A017', display: 'inline-block' }} />
                          <span className="gen-d2" style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4A017', display: 'inline-block' }} />
                          <span className="gen-d3" style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4A017', display: 'inline-block' }} />
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 600, color: isDone ? '#10b981' : isActive ? '#D4A017' : 'rgba(42,32,28,0.22)' }}>
                        {isDone && sec.elapsed ? `${sec.elapsed}s` : sec.status === 'pending' ? `~${sec.estSeconds}s` : ''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Done CTA ── */}
            {allDone && reportId && (
              <div style={{ padding: '0 28px 30px', background: '#FDFAF5' }}>
                <button
                  onClick={() => router.push(`/reports/${reportId}`)}
                  className="gen-cta"
                  style={{ width: '100%', padding: '17px', background: 'linear-gradient(135deg, #2F2A44 0%, #C2622A 100%)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '0.02em', fontFamily: "'Playfair Display', serif" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  {t.viewReport}
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // ── SETUP WIZARD ──
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {NoticeModal}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)]">{t.title}</h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center bg-[var(--warm-sand)] rounded-lg p-0.5 gap-0.5 flex-shrink-0">
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${lang === 'en' ? 'bg-[var(--indigo-deep)] text-white' : 'text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}
          >EN</button>
          <button
            onClick={() => setLang('hi')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${lang === 'hi' ? 'bg-[var(--indigo-deep)] text-white' : 'text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}
          >हिं</button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {t.steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50'}`}>
              {i < step ? <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-[var(--indigo-deep)]' : 'text-[var(--warm-charcoal)]/50'}`}>{s}</span>
            {i < t.steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-emerald-500' : 'bg-[var(--warm-sand)]'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Select Member */}
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--indigo-deep)]">{t.selectMember}</h2>
          {members.length === 0 ? (
            <div className="card-divine p-8 text-center">
              <div className="flex justify-center mb-3"><span className="material-symbols-outlined text-[32px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>family_restroom</span></div>
              <p className="font-medium text-[var(--indigo-deep)] mb-1">{t.noMembers}</p>
              <p className="text-sm text-[var(--warm-charcoal)]/60 mb-4">{t.noMembersDesc}</p>
              <Link href="/family/add" className="btn-divine px-6 py-2.5 text-sm">{t.addMember}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${selectedMember === m.id ? 'border-[var(--terracotta)] bg-[var(--warm-sand)]' : 'border-[var(--warm-sand)] bg-white hover:border-[var(--saffron)]'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${selectedMember === m.id ? 'bg-[var(--terracotta)]' : 'bg-[var(--indigo-deep)]'}`}>
                    {m.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--indigo-deep)]">{m.full_name}</p>
                    <p className="text-xs text-[var(--warm-charcoal)]/60 capitalize">{m.relation} · {new Date(m.date_of_birth).getFullYear()}</p>
                  </div>
                  {selectedMember === m.id && <span className="material-symbols-outlined text-[20px] text-[var(--terracotta)] ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Report Type */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--indigo-deep)]">{t.chooseReport}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REPORT_TYPES.map(rt => (
              <button
                key={rt.id}
                onClick={() => setSelectedReport(rt.id)}
                className={`relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${selectedReport === rt.id ? 'border-[var(--terracotta)] bg-[var(--warm-sand)]' : 'border-[var(--warm-sand)] bg-white hover:border-[var(--saffron)]'}`}
              >
                {rt.badge && (
                  <span className="absolute top-2 right-2 text-xs bg-[var(--terracotta)] text-white px-2 py-0.5 rounded-full font-bold">
                    {isHindi ? rt.badgeHi : rt.badge}
                  </span>
                )}
                <span className="material-symbols-outlined text-[24px] flex-shrink-0 text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>{rt.icon}</span>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="font-semibold text-[var(--indigo-deep)] text-sm">{isHindi ? rt.labelHi : rt.label}</p>
                  <p className="text-xs text-[var(--warm-charcoal)]/60 mt-0.5">{isHindi ? rt.descHi : rt.desc}</p>
                  <p className="text-xs font-bold text-[var(--terracotta)] mt-1">₹{(reportPrices[rt.id] ?? rt.price).toLocaleString('en-IN')}</p>
                </div>
                {selectedReport === rt.id && <span className="material-symbols-outlined text-[20px] text-[var(--terracotta)] ml-auto flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Additional Info */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--indigo-deep)]">{t.additionalInfo}</h2>
          {selectedReport === 'astro_vastu' ? (
            <div className="card-divine p-6 space-y-4">
              <p className="text-sm text-[var(--warm-charcoal)]/70 mb-2">{t.vastuDesc}</p>
              <div>
                <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">{t.doorDir}</label>
                <select value={vastuData.homeDirection} onChange={e => setVastuData(v => ({ ...v, homeDirection: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]">
                  <option value="">{t.selectDir}</option>
                  {DIRECTIONS.map((d, i) => <option key={d} value={d}>{isHindi ? DIRECTIONS_HI[i] : d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">{t.sleepDir}</label>
                <select value={vastuData.sleepDirection} onChange={e => setVastuData(v => ({ ...v, sleepDirection: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm">
                  {SLEEP_DIRS.map((d, i) => <option key={d} value={d.toLowerCase()}>{isHindi ? SLEEP_DIRS_HI[i] : d}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="card-divine p-6 text-center">
              <div className="flex justify-center mb-3"><span className="material-symbols-outlined text-[40px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span></div>
              <p className="font-medium text-[var(--indigo-deep)]">{t.allSet}</p>
              <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">{t.allSetDesc}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Confirm & Generate */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--indigo-deep)]">{t.readyGenerate}</h2>

          <div className="card-divine p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--warm-charcoal)]/60">{t.member}</span>
              <span className="font-medium text-[var(--indigo-deep)]">{selectedMemberInfo?.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--warm-charcoal)]/60">{t.reportType}</span>
              <span className="font-medium text-[var(--indigo-deep)]">{isHindi ? selectedReportInfo?.labelHi : selectedReportInfo?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--warm-charcoal)]/60">{t.poweredBy}</span>
              <span className="font-medium text-[var(--indigo-deep)]">Nakshatra Vedic Engine</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--warm-charcoal)]/60">{t.estTime}</span>
              <span className="font-medium text-[var(--indigo-deep)]">~{totalEstSeconds}s</span>
            </div>
            {(selectedReportInfo?.price || 0) > 0 && (
              <div className="flex justify-between text-sm border-t border-[var(--warm-sand)] pt-2 mt-1">
                <span className="font-bold text-[var(--indigo-deep)]">{isHindi ? 'मूल्य' : 'Price'}</span>
                <span className="font-bold text-[var(--terracotta)]">₹{(selectedReportInfo?.price || 0).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {lastError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">error</span>
              <div>
                <p className="font-semibold">{t.prevFailed}</p>
                <p className="mt-0.5 opacity-80">{lastError}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={paymentProcessing}
            className="btn-divine w-full py-4 text-base font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {paymentProcessing ? (
              <><SudarshanLoader px={20} /><span>{isHindi ? 'भुगतान हो रहा है…' : 'Processing payment…'}</span></>
            ) : (selectedReportInfo?.price || 0) > 0 ? (
              <><span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
              {lastError ? t.retry : `${isHindi ? 'भुगतान करें' : 'Pay'} ₹${(selectedReportInfo?.price || 0).toLocaleString('en-IN')} & ${isHindi ? 'बनाएं' : 'Generate'}`}</>
            ) : (
              <><span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              {lastError ? t.retry : t.generate}</>
            )}
          </button>
          {(selectedReportInfo?.price || 0) > 0 && !paymentProcessing && (
            <p className="text-center text-xs text-[var(--warm-charcoal)]/40 mt-1 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              Secured by Razorpay · 256-bit SSL
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-4 py-2 rounded-lg border border-[var(--warm-sand)] text-sm font-medium text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)] hover:text-[var(--indigo-deep)] disabled:opacity-30 transition-all"
        >
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>{t.back}
          </span>
        </button>

        {step < t.steps.length - 1 && (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed[step]}
            className="btn-divine px-6 py-2 text-sm disabled:opacity-40 inline-flex items-center gap-1"
          >
            {t.continue} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default function GenerateReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>}>
      <GenerateReportContent />
    </Suspense>
  )
}
