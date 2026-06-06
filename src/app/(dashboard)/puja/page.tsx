'use client'

import SudarshanLoader from '@/components/SudarshanLoader'
import { useState } from 'react'
import { toast } from 'sonner'

const PUJAS = [
  {
    id: 'ganesh',
    name: 'Ganesh Puja',
    nameHi: 'गणेश पूजा',
    desc: 'Remove obstacles, new beginnings',
    descHi: 'विघ्न विनाशक, नई शुरुआत के लिए',
    icon: 'star',
  },
  {
    id: 'lakshmi',
    name: 'Lakshmi Puja',
    nameHi: 'लक्ष्मी पूजा',
    desc: 'Wealth, prosperity & fortune',
    descHi: 'धन, समृद्धि और सौभाग्य',
    icon: 'currency_rupee',
  },
  {
    id: 'saraswati',
    name: 'Saraswati Puja',
    nameHi: 'सरस्वती पूजा',
    desc: 'Knowledge, arts & wisdom',
    descHi: 'विद्या, कला और ज्ञान',
    icon: 'school',
  },
  {
    id: 'rudrabhishek',
    name: 'Rudrabhishek',
    nameHi: 'रुद्राभिषेक',
    desc: 'Shiva worship for health & peace',
    descHi: 'शिव पूजा, स्वास्थ्य और शांति',
    icon: 'water_drop',
  },
  {
    id: 'satyanarayan',
    name: 'Satyanarayan Katha',
    nameHi: 'सत्यनारायण कथा',
    desc: 'Family welfare & divine blessings',
    descHi: 'पारिवारिक कल्याण और दिव्य आशीर्वाद',
    icon: 'menu_book',
  },
  {
    id: 'navgraha',
    name: 'Navgraha Puja',
    nameHi: 'नवग्रह पूजा',
    desc: 'Planetary remedies & life balance',
    descHi: 'ग्रह शांति और जीवन संतुलन',
    icon: 'brightness_7',
  },
  {
    id: 'durga',
    name: 'Durga Puja',
    nameHi: 'दुर्गा पूजा',
    desc: 'Strength, protection & courage',
    descHi: 'शक्ति, सुरक्षा और साहस',
    icon: 'local_fire_department',
  },
  {
    id: 'hanuman',
    name: 'Hanuman Puja',
    nameHi: 'हनुमान पूजा',
    desc: 'Devotion, courage & success',
    descHi: 'भक्ति, वीरता और सफलता',
    icon: 'favorite',
  },
  {
    id: 'surya',
    name: 'Surya Arghya',
    nameHi: 'सूर्य अर्घ्य',
    desc: 'Health, vitality & solar energy',
    descHi: 'स्वास्थ्य, ऊर्जा और जीवन शक्ति',
    icon: 'wb_sunny',
  },
  {
    id: 'kali',
    name: 'Kali Puja',
    nameHi: 'काली पूजा',
    desc: 'Transformation & fierce protection',
    descHi: 'परिवर्तन और दुष्ट शक्तियों से रक्षा',
    icon: 'bolt',
  },
]

const SYSTEM_EN = `You are Pandit Divya, a learned Vedic priest and ritual specialist with deep knowledge of Hindu scriptures — the Agamas, Puranas, Tantras, and classical puja paddhatis. You provide comprehensive, authentic, and respectful guidance for Hindu religious rituals.

When asked about a puja or ritual, always structure your response with these exact sections:

## Deity & Significance
Who this deity is, their divine attributes, symbolism, and why this puja is performed. Include the mythology and spiritual importance.

## Auspicious Timing (Muhurta)
Best days of the week, tithis (lunar dates), nakshatras, and specific times. Mention any especially powerful dates in the Hindu calendar for this puja.

## Puja Samagri (Items Required)
A complete, specific list of everything needed — puja thali, flowers, incense (agarbatti / dhoop), lamps (diya), fruits, sweets, sacred threads, holy water, kumkum, haldi, roli, chandan, akshat, holy grains, cloth, and any deity-specific items. Organize under sub-categories.

## Preparation
How to prepare yourself (bath, attire, fasting rules) and how to set up and purify the puja space. Include achaman, pranayama, and sankalp.

## Puja Vidhi — Step-by-Step Procedure
A numbered, complete step-by-step ritual procedure. Include: Invocation (Avahana), Seat offering (Asana), Water offering (Padya, Arghya, Achamana), Bath (Abhisheka if applicable), Clothing (Vastra), Sacred thread (Yajnopavita), Sandalwood (Gandha), Flowers (Pushpa), Incense (Dhupa), Lamp (Dipa), Food offering (Naivedya), Betel (Tambula), Pradakshina (circumambulation), and Pushpanjali.

## Sacred Mantras
For each mantra provide:
- **Sanskrit** (in Devanagari script)
- *Transliteration* (Roman)
- Meaning & when to chant it
Include: Dhyana shloka, Beej mantra, Main stotra/mantra, and Closing mantra.

## Aarti
Complete aarti lyrics in Hindi/Sanskrit with transliteration. Specify the aarti name and when to sing it.

## Prasad Preparation
What to prepare, how to offer it, and how to distribute. Include specific recipes where traditional.

## Visarjan (Closing Prayers)
How to properly conclude the puja — closing prayers, immersion (if applicable), and how to take the deity's leave respectfully.

## Spiritual Benefits
Specific spiritual, mental, and material benefits as described in the scriptures. Reference relevant Puranic stories where appropriate.

## Do's and Don'ts
Important rules (niyamas and prohibitions) specific to this puja. Include purity rules, dietary restrictions, and behavioral guidelines during the observance.

Write in a warm, reverent, and deeply knowledgeable tone. Use Sanskrit terms with explanations in parentheses. Be specific and practical so a devotee can perform this puja at home without a priest.`

const SYSTEM_HI = `आप पंडित दिव्य हैं — एक विद्वान वैदिक पुरोहित और अनुष्ठान विशेषज्ञ जिन्हें हिंदू शास्त्रों — आगम, पुराण, तंत्र और पूजा पद्धतियों का गहन ज्ञान है।

जब भी कोई पूजा या अनुष्ठान के बारे में पूछे, तो सदैव इन खंडों में उत्तर दें:

## देवता परिचय और महत्व
यह देवता कौन हैं, उनके दिव्य गुण, प्रतीकवाद, और यह पूजा क्यों की जाती है। पुराणिक कथा और आध्यात्मिक महत्व शामिल करें।

## शुभ मुहूर्त
सबसे उत्तम दिन, तिथि, नक्षत्र और समय। इस पूजा के लिए विशेष रूप से शुभ हिंदू पंचांग तिथियां बताएं।

## पूजा सामग्री (आवश्यक वस्तुएं)
सभी आवश्यक वस्तुओं की पूरी सूची — पूजा थाली, फूल, धूप-अगरबत्ती, दीपक, फल, मिठाई, मौली, जल, कुमकुम, हल्दी, रोली, चंदन, अक्षत, पवित्र अनाज, वस्त्र, और देवता विशेष वस्तुएं। उप-श्रेणियों में व्यवस्थित करें।

## तैयारी
स्वयं को कैसे तैयार करें (स्नान, वेशभूषा, उपवास नियम) और पूजा स्थान को कैसे स्थापित और शुद्ध करें। आचमन, प्राणायाम और संकल्प शामिल करें।

## पूजा विधि — क्रमबद्ध प्रक्रिया
एक संख्यांकित, पूर्ण चरण-दर-चरण अनुष्ठान प्रक्रिया। शामिल करें: आवाहन, आसन, पाद्य-अर्घ्य-आचमन, अभिषेक (यदि लागू), वस्त्र, यज्ञोपवीत, गंध, पुष्प, धूप, दीप, नैवेद्य, ताम्बूल, प्रदक्षिणा, और पुष्पांजलि।

## पवित्र मंत्र
प्रत्येक मंत्र के लिए प्रदान करें:
- **संस्कृत** (देवनागरी लिपि में)
- *उच्चारण* (रोमन लिपि में)
- अर्थ और कब जपें
ध्यान श्लोक, बीज मंत्र, मुख्य स्तोत्र/मंत्र, और समापन मंत्र शामिल करें।

## आरती
हिंदी/संस्कृत में पूर्ण आरती के बोल उच्चारण सहित। आरती का नाम और गाने का समय बताएं।

## प्रसाद
क्या तैयार करें, कैसे अर्पित करें, और कैसे वितरित करें। पारंपरिक व्यंजनों की विधि शामिल करें।

## विसर्जन (समापन प्रार्थना)
पूजा को उचित रूप से कैसे समाप्त करें — समापन प्रार्थनाएं, विसर्जन (यदि लागू), और देवता से विदाई।

## आध्यात्मिक लाभ
शास्त्रों में वर्णित आध्यात्मिक, मानसिक और भौतिक लाभ। प्रासंगिक पौराणिक कथाओं का संदर्भ दें।

## क्या करें, क्या न करें
इस पूजा के लिए विशेष नियम और निषेध। शुद्धता नियम, आहार प्रतिबंध और आचरण दिशानिर्देश।

**महत्वपूर्ण: सभी उत्तर केवल हिंदी में दें।** गर्मजोशी, श्रद्धा और गहन ज्ञान के साथ लिखें। संस्कृत शब्दों का हिंदी में अर्थ दें। इतना व्यावहारिक और विस्तृत लिखें कि एक भक्त बिना पुरोहित के घर पर यह पूजा कर सके।`

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-[var(--indigo-deep)] text-sm mt-4 mb-1.5">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-[var(--indigo-deep)] text-base mt-5 mb-2 flex items-center gap-2"><span class="text-[var(--saffron-vivid)]">◈</span> $1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-[var(--indigo-deep)] text-lg mt-4 mb-2">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--indigo-deep)]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[var(--terracotta)]">$1</em>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-3 flex gap-2"><span class="text-[var(--saffron-vivid)] flex-shrink-0 mt-0.5">•</span><span>$1</span></li>')
    .replace(/^  [-•] (.+)$/gm, '<li class="ml-7 flex gap-2 text-sm opacity-80"><span class="flex-shrink-0 text-[var(--terracotta)]">◦</span><span>$1</span></li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-3 list-decimal list-inside text-[var(--warm-charcoal)]">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>(\n|$))+/g, (match) => `<ul class="space-y-1 my-2">${match}</ul>`)
    .replace(/^---$/gm, '<hr class="border-[var(--warm-sand)] my-3"/>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n(?!<)/g, '<br/>')
}

export default function PujaPage() {
  const [lang, setLang] = useState<'en' | 'hi'>('en')
  const [selected, setSelected] = useState<string | null>(null)
  const [custom, setCustom] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [result, setResult] = useState('')
  const [pujaTitle, setPujaTitle] = useState('')

  const isHindi = lang === 'hi'

  const selectedPuja = PUJAS.find(p => p.id === selected)
  const canGenerate = selected === 'custom' ? custom.trim().length > 2 : !!selected

  async function generate() {
    if (!canGenerate || streaming) return

    const title = selected === 'custom'
      ? custom.trim()
      : (isHindi ? selectedPuja!.nameHi : selectedPuja!.name)

    setPujaTitle(title)
    setResult('')
    setStreaming(true)

    const userMsg = isHindi
      ? `कृपया "${title}" के लिए एक संपूर्ण, विस्तृत मार्गदर्शिका प्रदान करें — सभी खंड शामिल करें।`
      : `Please provide a complete, detailed guide for ${title} — include all sections.`

    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMsg }],
          system: isHindi ? SYSTEM_HI : SYSTEM_EN,
          stream: true,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Generation failed')
      }
      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content || ''
            full += delta
            setResult(full)
          } catch {}
        }
      }
    } catch (err: any) {
      toast.error(err.message || (isHindi ? 'मार्गदर्शिका प्राप्त नहीं हुई। पुनः प्रयास करें।' : 'Failed to generate guide. Please try again.'))
      setResult('')
    }

    setStreaming(false)
  }

  function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) { toast.error('Allow popups to print'); return }

    const htmlContent = renderMarkdown(result)
      // strip Tailwind classes from print copy — rendered as plain HTML
      .replace(/class="[^"]*"/g, '')

    printWindow.document.write(`<!DOCTYPE html>
<html lang="${isHindi ? 'hi' : 'en'}">
<head>
<meta charset="utf-8"/>
<title>${pujaTitle} — Puja Guide</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Noto+Serif+Devanagari:wght@400;600&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Serif Devanagari',Georgia,serif;color:#1a1530;line-height:1.85;font-size:13.5px;background:#fff;padding:48px 56px;max-width:820px;margin:0 auto}
.hdr{text-align:center;padding-bottom:24px;margin-bottom:32px;border-bottom:3px double #E36414}
.brand{font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#C67D53;margin-bottom:10px;font-family:Georgia,serif}
.hdr h1{font-size:30px;color:#2F2A44;font-family:'Playfair Display',Georgia,serif;line-height:1.2}
.hdr .sub{font-size:12px;color:#888;margin-top:8px}
h1{font-size:18px;color:#2F2A44;margin:28px 0 10px;font-family:'Playfair Display',Georgia,serif}
h2{font-size:15px;font-weight:700;color:#2F2A44;margin:26px 0 8px;padding:7px 14px;background:linear-gradient(to right,#FFF3E8,#FFF8F3);border-left:4px solid #E36414;border-radius:0 6px 6px 0;page-break-after:avoid}
h3{font-size:13.5px;font-weight:700;color:#2F2A44;margin:18px 0 6px;padding-left:6px;border-left:2px solid #C67D53}
p{margin:7px 0}
ul,ol{margin:8px 0 8px 22px}
li{margin:4px 0;line-height:1.75}
strong{color:#2F2A44;font-weight:700}
em{color:#C67D53;font-style:italic}
hr{border:none;border-top:1px solid #e8ddd0;margin:20px 0}
.ftr{margin-top:48px;padding-top:16px;border-top:2px solid #E36414;text-align:center;font-size:11px;color:#aaa;font-family:Georgia,serif}
.ftr .om{font-size:16px;color:#E36414;display:block;margin-bottom:4px}
@media print{
  body{padding:28px 36px;font-size:12.5px}
  h2{background:#FFF3E8!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .no-break{page-break-inside:avoid}
}
</style>
</head>
<body>
<div class="hdr">
  <div class="brand">MahaTathastu &nbsp;·&nbsp; Vedic Wisdom</div>
  <h1>${pujaTitle}</h1>
  <div class="sub">Complete Puja Guide &nbsp;·&nbsp; Generated by AI Spiritual Guide</div>
</div>
${htmlContent}
<div class="ftr">
  <span class="om">ॐ</span>
  mahatathastu.com &nbsp;·&nbsp; May this puja bring peace, prosperity &amp; divine blessings
</div>
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`)
    printWindow.document.close()
  }

  function reset() {
    setResult('')
    setPujaTitle('')
    setSelected(null)
    setCustom('')
    setStreaming(false)
  }

  const showResult = streaming || result

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-[var(--indigo-deep)] text-white flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center">
          <SudarshanLoader size="sm" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {isHindi ? 'पूजा और अनुष्ठान मार्गदर्शक' : 'Puja & Rituals Guide'}
          </h1>
          <p className="text-xs text-white/55">
            {isHindi ? 'AI-संचालित वैदिक अनुष्ठान विधि' : 'AI-powered Vedic ritual guidance'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-[var(--indigo-deep)]' : 'text-white/70 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${lang === 'hi' ? 'bg-white text-[var(--indigo-deep)]' : 'text-white/70 hover:text-white'}`}
            >
              हिं
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ── Result view ── */}
        {showResult ? (
          <div>
            {/* Result header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-[var(--terracotta)] font-semibold uppercase tracking-widest mb-0.5">
                  {isHindi ? 'पूजा मार्गदर्शिका' : 'Ritual Guide'}
                </p>
                <h2 className="text-xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {pujaTitle}
                </h2>
              </div>
              {!streaming && (
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--warm-sand)] text-sm font-medium text-[var(--indigo-deep)]/60 hover:bg-[var(--warm-sand)] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  {isHindi ? 'नई पूजा' : 'New Puja'}
                </button>
              )}
            </div>

            {/* Streaming indicator */}
            {streaming && (
              <div className="flex items-center gap-3 mb-5 p-4 rounded-2xl bg-gradient-to-r from-[var(--warm-sand)] to-amber-50 border border-[var(--warm-sand)]">
                <SudarshanLoader size="sm" />
                <div>
                  <p className="text-sm font-semibold text-[var(--indigo-deep)]">
                    {isHindi ? 'पूजा विधि तैयार हो रही है...' : 'Preparing your puja guide...'}
                  </p>
                  <p className="text-xs text-[var(--warm-charcoal)]/50 mt-0.5">
                    {isHindi ? 'वैदिक ग्रंथों से ज्ञान संकलित किया जा रहा है' : 'Compiling wisdom from Vedic scriptures'}
                  </p>
                </div>
              </div>
            )}

            {/* Result content */}
            {result && (
              <div className="card-divine p-5 lg:p-7">
                <div
                  className="text-[var(--warm-charcoal)] text-sm leading-relaxed prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
                />
                {streaming && (
                  <span className="inline-block w-1.5 h-4 bg-[var(--saffron-vivid)] animate-pulse ml-1 rounded-sm" />
                )}
              </div>
            )}

            {/* Actions after done */}
            {!streaming && result && (
              <div className="mt-5 flex gap-3 justify-end">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--warm-sand)] text-sm font-medium text-[var(--indigo-deep)]/60 hover:bg-[var(--warm-sand)] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  {isHindi ? 'प्रिंट करें' : 'Print'}
                </button>
                <button
                  onClick={reset}
                  className="btn-divine px-5 py-2 text-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  {isHindi ? 'नई पूजा खोजें' : 'New Puja'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Selection view ── */
          <div>
            {/* Section heading */}
            <div className="mb-6 text-center">
              <p className="text-xs text-[var(--terracotta)] font-semibold uppercase tracking-widest mb-1">
                {isHindi ? 'पूजा चुनें' : 'Choose your puja'}
              </p>
              <h2 className="text-lg font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {isHindi ? 'कौन सी पूजा करना चाहते हैं?' : 'Which puja would you like to perform?'}
              </h2>
              <p className="text-xs text-[var(--warm-charcoal)]/50 mt-1">
                {isHindi
                  ? 'नीचे से चुनें या अपनी पूजा लिखें — AI संपूर्ण विधि बताएगा'
                  : 'Select from below or write your own — AI will guide you through every step'}
              </p>
            </div>

            {/* Puja grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 mb-5">
              {PUJAS.map((puja) => {
                const active = selected === puja.id
                return (
                  <button
                    key={puja.id}
                    onClick={() => { setSelected(puja.id); setCustom('') }}
                    className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 group ${
                      active
                        ? 'border-[var(--saffron-vivid)] bg-gradient-to-br from-orange-50 to-amber-50 shadow-md'
                        : 'border-[var(--warm-sand)] bg-white hover:border-[var(--terracotta)]/40 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      active ? 'bg-[var(--saffron-vivid)]' : 'bg-[var(--warm-sand)] group-hover:bg-[var(--saffron-vivid)]/10'
                    }`}>
                      <span
                        className={`material-symbols-outlined text-[18px] transition-colors ${
                          active ? 'text-white' : 'text-[var(--indigo-deep)]/60 group-hover:text-[var(--saffron-vivid)]'
                        }`}
                        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {puja.icon}
                      </span>
                    </div>
                    <p className={`font-bold text-sm leading-tight mb-1 ${active ? 'text-[var(--saffron-vivid)]' : 'text-[var(--indigo-deep)]'}`}>
                      {isHindi ? puja.nameHi : puja.name}
                    </p>
                    <p className="text-[11px] text-[var(--warm-charcoal)]/50 leading-tight">
                      {isHindi ? puja.descHi : puja.desc}
                    </p>
                    {active && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-[var(--saffron-vivid)]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="text-[10px] text-[var(--saffron-vivid)] font-bold">{isHindi ? 'चुना गया' : 'Selected'}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[var(--warm-sand)]" />
              <span className="text-xs text-[var(--warm-charcoal)]/40 font-medium px-2">
                {isHindi ? 'या अपनी लिखें' : 'or write your own'}
              </span>
              <div className="flex-1 h-px bg-[var(--warm-sand)]" />
            </div>

            {/* Custom input */}
            <div className={`relative rounded-2xl border-2 transition-all duration-200 ${
              selected === 'custom' ? 'border-[var(--saffron-vivid)] bg-orange-50/30' : 'border-[var(--warm-sand)] bg-white'
            }`}>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[var(--warm-charcoal)]/40">
                edit_note
              </span>
              <input
                type="text"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); if (e.target.value.trim()) setSelected('custom') }}
                onFocus={() => { if (custom.trim()) setSelected('custom') }}
                placeholder={isHindi ? 'जैसे: कुंडली दोष निवारण पूजा, वास्तु शांति...' : 'e.g. Vastu Shanti, Graha Dosha Nivaran, Mrityunjaya Havan...'}
                className="w-full pl-11 pr-4 py-3.5 text-sm bg-transparent rounded-2xl focus:outline-none placeholder:text-[var(--warm-charcoal)]/30 text-[var(--indigo-deep)]"
              />
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={!canGenerate}
              className={`w-full mt-5 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 ${
                canGenerate
                  ? 'bg-[var(--indigo-deep)] text-white hover:bg-[var(--indigo-deep)]/90 shadow-lg shadow-[var(--indigo-deep)]/20'
                  : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/30 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              {isHindi ? 'संपूर्ण पूजा विधि बनाएं' : 'Generate Complete Puja Guide'}
              {canGenerate && (
                <span className="text-xs opacity-60 font-normal">
                  {isHindi ? '· ~30 सेकंड' : '· ~30 sec'}
                </span>
              )}
            </button>

            {/* Info strip */}
            <div className="mt-4 p-3 rounded-xl bg-[var(--warm-sand)]/50 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[15px] text-[var(--terracotta)] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <p className="text-[11px] text-[var(--warm-charcoal)]/60 leading-relaxed">
                {isHindi
                  ? 'हमारा AI वैदिक शास्त्रों पर आधारित मार्गदर्शन प्रदान करता है। अनुष्ठान की शुद्धता के लिए स्थानीय पंडित से भी परामर्श करें।'
                  : 'Our AI provides guidance based on Vedic scriptures. For complete ritual purity, also consult a local priest or pandit.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
