/* ═══════════════════════════════════════════════════════════════════════════
   MANTRA & SHLOKA LIBRARY

   Every entry carries its Devanagari, an IAST transliteration, a plain-English
   meaning and — importantly — its actual source. Mantras circulate online
   detached from their origin and often subtly corrupted; citing chapter and
   verse is the difference between a spiritual product and a devotional
   scrapbook.

   Only well-attested, canonical texts are included. Where a stotra is long
   (Saraswati Vandana, Shanti Path) the opening verse is given rather than a
   silently truncated fragment presented as the whole.
   ═══════════════════════════════════════════════════════════════════════════ */

export type MantraCategory =
  | 'universal'
  | 'ganesha'
  | 'shiva'
  | 'vishnu'
  | 'devi'
  | 'surya'
  | 'guru'
  | 'gita'
  | 'daily'

export interface Mantra {
  id: string
  category: MantraCategory
  title: string
  /** Deity or theme, shown as a subtitle. */
  subtitle: string
  devanagari: string
  transliteration: string
  meaning: string
  source: string
  /** Traditional japa count. */
  count: number
  /** When it is traditionally practised. */
  bestTime: string
  /** What the practice is held to cultivate. */
  benefit: string
}

export const CATEGORY_LABELS: Record<MantraCategory, string> = {
  universal: 'Universal & Shanti',
  ganesha: 'Ganesha',
  shiva: 'Shiva',
  vishnu: 'Vishnu & Rama',
  devi: 'Devi',
  surya: 'Surya & Navagraha',
  guru: 'Guru',
  gita: 'Bhagavad Gita',
  daily: 'Daily Practice',
}

export const CATEGORY_ICONS: Record<MantraCategory, string> = {
  universal: 'yantra',
  ganesha: 'brightness_5',
  shiva: 'nakshatra',
  vishnu: 'chakra',
  devi: 'lotus',
  surya: 'light_mode',
  guru: 'school',
  gita: 'menu_book',
  daily: 'bedtime',
}

export const MANTRAS: Mantra[] = [
  // ── Universal & Shanti ───────────────────────────────────────────────────
  {
    id: 'pranava',
    category: 'universal',
    title: 'Pranava — Om',
    subtitle: 'The primordial sound',
    devanagari: 'ॐ',
    transliteration: 'oṁ',
    meaning:
      'The single syllable held to contain all sound and all creation. Chanted as three parts — A, U, M — followed by the silence that completes it.',
    source: 'Mandukya Upanishad 1',
    count: 108,
    bestTime: 'Brahma Muhurta (before sunrise)',
    benefit: 'Steadies the breath and settles the mind before any other practice.',
  },
  {
    id: 'gayatri',
    category: 'universal',
    title: 'Gayatri Mantra',
    subtitle: 'To Savitr, the illuminating Sun',
    devanagari:
      'ॐ भूर्भुवः स्वः ।\nतत्सवितुर्वरेण्यं ।\nभर्गो देवस्य धीमहि ।\nधियो यो नः प्रचोदयात् ॥',
    transliteration:
      'oṁ bhūr bhuvaḥ svaḥ\ntat savitur vareṇyaṁ\nbhargo devasya dhīmahi\ndhiyo yo naḥ pracodayāt',
    meaning:
      'We meditate on the radiant glory of the divine Sun, source of the three worlds. May it illuminate our understanding.',
    source: 'Rig Veda 3.62.10',
    count: 108,
    bestTime: 'Sunrise, midday and sunset (the three sandhyas)',
    benefit: 'Clarity of intellect and discernment. The most widely practised Vedic mantra.',
  },
  {
    id: 'mahamrityunjaya',
    category: 'universal',
    title: 'Mahamrityunjaya Mantra',
    subtitle: 'The great death-conquering mantra',
    devanagari:
      'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।\nउर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात् ॥',
    transliteration:
      'oṁ tryambakaṁ yajāmahe sugandhiṁ puṣṭi-vardhanam\nurvārukam iva bandhanān mṛtyor mukṣīya mā\'mṛtāt',
    meaning:
      'We worship the three-eyed one, fragrant and nourishing. As a ripe cucumber is freed from its stem, may we be freed from death — not from immortality.',
    source: 'Rig Veda 7.59.12 · Yajur Veda',
    count: 108,
    bestTime: 'Monday, or during illness and difficulty',
    benefit: 'Traditionally chanted for healing, protection and longevity.',
  },
  {
    id: 'asato-ma',
    category: 'universal',
    title: 'Asato Mā Sadgamaya',
    subtitle: 'Prayer for truth and light',
    devanagari:
      'ॐ असतो मा सद्गमय ।\nतमसो मा ज्योतिर्गमय ।\nमृत्योर्मा अमृतं गमय ।\nॐ शान्तिः शान्तिः शान्तिः ॥',
    transliteration:
      'oṁ asato mā sadgamaya\ntamaso mā jyotirgamaya\nmṛtyormā amṛtaṁ gamaya\noṁ śāntiḥ śāntiḥ śāntiḥ',
    meaning:
      'Lead me from the unreal to the real, from darkness to light, from death to immortality. Peace, peace, peace.',
    source: 'Brihadaranyaka Upanishad 1.3.28',
    count: 11,
    bestTime: 'Evening, or to close a sitting',
    benefit: 'A prayer for discernment; often used to end meditation.',
  },
  {
    id: 'saha-nau',
    category: 'universal',
    title: 'Saha Nāvavatu',
    subtitle: 'Shanti mantra of teacher and student',
    devanagari:
      'ॐ सह नाववतु । सह नौ भुनक्तु ।\nसह वीर्यं करवावहै ।\nतेजस्वि नावधीतमस्तु मा विद्विषावहै ।\nॐ शान्तिः शान्तिः शान्तिः ॥',
    transliteration:
      'oṁ saha nāvavatu · saha nau bhunaktu\nsaha vīryaṁ karavāvahai\ntejasvi nāvadhītamastu mā vidviṣāvahai\noṁ śāntiḥ śāntiḥ śāntiḥ',
    meaning:
      'May we be protected together, nourished together, and work together with vigour. May our study be luminous. May we never quarrel.',
    source: 'Taittiriya Upanishad 2.1 · Katha Upanishad',
    count: 3,
    bestTime: 'Before study or teaching',
    benefit: 'Chanted to open learning and shared work.',
  },
  {
    id: 'sarve-bhavantu',
    category: 'universal',
    title: 'Sarve Bhavantu Sukhinaḥ',
    subtitle: 'May all beings be happy',
    devanagari:
      'सर्वे भवन्तु सुखिनः ।\nसर्वे सन्तु निरामयाः ।\nसर्वे भद्राणि पश्यन्तु ।\nमा कश्चिद्दुःखभाग्भवेत् ॥',
    transliteration:
      'sarve bhavantu sukhinaḥ\nsarve santu nirāmayāḥ\nsarve bhadrāṇi paśyantu\nmā kaścid duḥkhabhāg bhavet',
    meaning:
      'May all be happy. May all be free from illness. May all see what is auspicious. May no one suffer.',
    source: 'Brihadaranyaka Upanishad tradition',
    count: 11,
    bestTime: 'Any time; especially to close a practice',
    benefit: 'Cultivates goodwill extended beyond oneself.',
  },
  {
    id: 'purnamadah',
    category: 'universal',
    title: 'Pūrṇamadaḥ Pūrṇamidaṁ',
    subtitle: 'The invocation of wholeness',
    devanagari:
      'ॐ पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते ।\nपूर्णस्य पूर्णमादाय पूर्णमेवावशिष्यते ॥\nॐ शान्तिः शान्तिः शान्तिः ॥',
    transliteration:
      'oṁ pūrṇamadaḥ pūrṇamidaṁ pūrṇāt pūrṇamudacyate\npūrṇasya pūrṇamādāya pūrṇamevāvaśiṣyate\noṁ śāntiḥ śāntiḥ śāntiḥ',
    meaning:
      'That is whole; this is whole. From the whole, the whole arises. Take the whole from the whole, and the whole yet remains.',
    source: 'Isha Upanishad, Shanti Path',
    count: 3,
    bestTime: 'To open or close any practice',
    benefit: 'The classical contemplation of fullness and non-diminishment.',
  },

  // ── Ganesha ──────────────────────────────────────────────────────────────
  {
    id: 'vakratunda',
    category: 'ganesha',
    title: 'Vakratuṇḍa Mahākāya',
    subtitle: 'Remover of obstacles',
    devanagari:
      'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
    transliteration:
      'vakratuṇḍa mahākāya sūryakoṭi samaprabha\nnirvighnaṁ kuru me deva sarva-kāryeṣu sarvadā',
    meaning:
      'O curved-trunked, mighty one, radiant as ten million suns — make all my undertakings free of obstacles, always.',
    source: 'Brahmanda Purana · traditional invocation',
    count: 108,
    bestTime: 'Before beginning anything new',
    benefit: 'The customary opening verse before any work, journey or study.',
  },
  {
    id: 'ganesha-beej',
    category: 'ganesha',
    title: 'Ganesha Beeja Mantra',
    subtitle: 'Seed syllable of Ganapati',
    devanagari: 'ॐ गं गणपतये नमः ॥',
    transliteration: 'oṁ gaṁ gaṇapataye namaḥ',
    meaning: 'Salutations to Ganapati, lord of the ganas and of beginnings.',
    source: 'Ganapati Upanishad tradition',
    count: 108,
    bestTime: 'Wednesday, and at the start of practice',
    benefit: 'Short enough for mala japa; clears the way for what follows.',
  },

  // ── Shiva ────────────────────────────────────────────────────────────────
  {
    id: 'panchakshara',
    category: 'shiva',
    title: 'Panchakshara — Om Namah Shivaya',
    subtitle: 'The five-syllable mantra',
    devanagari: 'ॐ नमः शिवाय ॥',
    transliteration: 'oṁ namaḥ śivāya',
    meaning: 'Salutations to Shiva, the auspicious one. Its five syllables correspond to the five elements.',
    source: 'Krishna Yajur Veda, Shri Rudram (Taittiriya Samhita 4.5)',
    count: 108,
    bestTime: 'Monday, pradosha, and Brahma Muhurta',
    benefit: 'Among the most practised mantras; steadies the mind through repetition.',
  },
  {
    id: 'shiva-dhyana',
    category: 'shiva',
    title: 'Karacharana Kritam',
    subtitle: 'Prayer for forgiveness',
    devanagari:
      'करचरणकृतं वाक्कायजं कर्मजं वा ।\nश्रवणनयनजं वा मानसं वापराधम् ।\nविहितमविहितं वा सर्वमेतत्क्षमस्व ।\nजय जय करुणाब्धे श्रीमहादेव शम्भो ॥',
    transliteration:
      'karacaraṇakṛtaṁ vākkāyajaṁ karmajaṁ vā\nśravaṇanayanajaṁ vā mānasaṁ vāparādham\nvihitamavihitaṁ vā sarvametat kṣamasva\njaya jaya karuṇābdhe śrīmahādeva śambho',
    meaning:
      'Whatever wrong I have done by hand or foot, speech or body, by ear or eye or mind — intended or unintended — forgive it all. Victory to the ocean of compassion, Mahadeva.',
    source: 'Traditional Shiva stotra',
    count: 3,
    bestTime: 'Evening, to close the day',
    benefit: 'A closing prayer of accountability and release.',
  },

  // ── Vishnu & Rama ────────────────────────────────────────────────────────
  {
    id: 'shantakaram',
    category: 'vishnu',
    title: 'Śāntākāraṁ Bhujagaśayanaṁ',
    subtitle: 'Meditation on Vishnu',
    devanagari:
      'शान्ताकारं भुजगशयनं पद्मनाभं सुरेशं ।\nविश्वाधारं गगनसदृशं मेघवर्णं शुभाङ्गम् ।\nलक्ष्मीकान्तं कमलनयनं योगिभिर्ध्यानगम्यं ।\nवन्दे विष्णुं भवभयहरं सर्वलोकैकनाथम् ॥',
    transliteration:
      'śāntākāraṁ bhujagaśayanaṁ padmanābhaṁ sureśaṁ\nviśvādhāraṁ gaganasadṛśaṁ meghavarṇaṁ śubhāṅgam\nlakṣmīkāntaṁ kamalanayanaṁ yogibhirdhyānagamyaṁ\nvande viṣṇuṁ bhavabhayaharaṁ sarvalokaikanātham',
    meaning:
      'Serene in form, resting on the serpent, lotus-navelled, lord of the devas; support of the universe, vast as the sky, cloud-hued and auspicious. I bow to Vishnu, who removes the fear of existence.',
    source: 'Vishnu Sahasranama, dhyana shloka',
    count: 3,
    bestTime: 'Thursday, and before sleep',
    benefit: 'A visualisation verse — read slowly rather than repeated quickly.',
  },
  {
    id: 'maha-mantra',
    category: 'vishnu',
    title: 'Hare Krishna Maha Mantra',
    subtitle: 'The sixteen names',
    devanagari:
      'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे ।\nहरे राम हरे राम राम राम हरे हरे ॥',
    transliteration:
      'hare kṛṣṇa hare kṛṣṇa kṛṣṇa kṛṣṇa hare hare\nhare rāma hare rāma rāma rāma hare hare',
    meaning:
      'An invocation of the divine by name, addressing the Lord and his energy. Traditionally chanted aloud or sung.',
    source: 'Kali-Santarana Upanishad',
    count: 108,
    bestTime: 'Any time; often chanted in group kirtan',
    benefit: 'Prescribed for this age as a simple, continuous practice.',
  },
  {
    id: 'hanuman-dhyana',
    category: 'vishnu',
    title: 'Manojavaṁ Māruta-tulya-vegaṁ',
    subtitle: 'Meditation on Hanuman',
    devanagari:
      'मनोजवं मारुततुल्यवेगं जितेन्द्रियं बुद्धिमतां वरिष्ठम् ।\nवातात्मजं वानरयूथमुख्यं श्रीरामदूतं शरणं प्रपद्ये ॥',
    transliteration:
      'manojavaṁ mārutatulyavegaṁ jitendriyaṁ buddhimatāṁ variṣṭham\nvātātmajaṁ vānarayūthamukhyaṁ śrīrāmadūtaṁ śaraṇaṁ prapadye',
    meaning:
      'Swift as thought, rapid as the wind, master of the senses, foremost among the wise; son of the wind, chief of the vanaras, messenger of Rama — I take refuge in him.',
    source: 'Valmiki Ramayana · Sundara Kanda tradition',
    count: 11,
    bestTime: 'Tuesday and Saturday',
    benefit: 'Chanted for courage, focus and steadiness.',
  },

  // ── Devi ─────────────────────────────────────────────────────────────────
  {
    id: 'saraswati-vandana',
    category: 'devi',
    title: 'Yā Kundendu Tuṣārahāra-dhavalā',
    subtitle: 'Saraswati Vandana (opening verse)',
    devanagari:
      'या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता ।\nया वीणावरदण्डमण्डितकरा या श्वेतपद्मासना ॥',
    transliteration:
      'yā kundendu tuṣārahāra-dhavalā yā śubhravastrāvṛtā\nyā vīṇāvaradaṇḍamaṇḍitakarā yā śvetapadmāsanā',
    meaning:
      'She who is white as jasmine, the moon and a garland of frost; robed in white, her hands adorned with the veena, seated on a white lotus.',
    source: 'Saraswati Stotra — opening verse of four',
    count: 3,
    bestTime: 'Before study, music or examinations',
    benefit: 'The traditional invocation of learning and the arts.',
  },
  {
    id: 'durga',
    category: 'devi',
    title: 'Sarva Maṅgala Māṅgalye',
    subtitle: 'To Durga, auspiciousness itself',
    devanagari:
      'सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके ।\nशरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते ॥',
    transliteration:
      'sarvamaṅgalamāṅgalye śive sarvārthasādhike\nśaraṇye tryambake gauri nārāyaṇi namo\'stu te',
    meaning:
      'Auspiciousness of all that is auspicious, benevolent one, fulfiller of every aim; refuge, three-eyed Gauri — salutations to you, Narayani.',
    source: 'Devi Mahatmyam 11.10',
    count: 108,
    bestTime: 'Navratri, Tuesday and Friday',
    benefit: 'Invoked for protection and resolve.',
  },
  {
    id: 'lakshmi',
    category: 'devi',
    title: 'Mahalakshmi Mantra',
    subtitle: 'To Lakshmi, abundance',
    devanagari: 'ॐ श्रीं ह्रीं श्रीं कमले कमलालये प्रसीद प्रसीद ।\nॐ श्रीं ह्रीं श्रीं महालक्ष्म्यै नमः ॥',
    transliteration:
      'oṁ śrīṁ hrīṁ śrīṁ kamale kamalālaye prasīda prasīda\noṁ śrīṁ hrīṁ śrīṁ mahālakṣmyai namaḥ',
    meaning: 'Seated on the lotus, dweller in the lotus — be gracious. Salutations to Mahalakshmi.',
    source: 'Shri Suktam tradition',
    count: 108,
    bestTime: 'Friday, and Diwali',
    benefit: 'Chanted for prosperity understood as sufficiency, not excess.',
  },

  // ── Surya & Navagraha ────────────────────────────────────────────────────
  {
    id: 'surya',
    category: 'surya',
    title: 'Surya Mantra',
    subtitle: 'To the Sun',
    devanagari: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः ॥',
    transliteration: 'oṁ hrāṁ hrīṁ hrauṁ saḥ sūryāya namaḥ',
    meaning: 'Salutations to Surya, through the seed syllables of the solar principle.',
    source: 'Navagraha mantra tradition',
    count: 108,
    bestTime: 'Sunday at sunrise, facing east',
    benefit: 'For vitality, confidence and clarity of purpose.',
  },
  {
    id: 'navagraha-shanti',
    category: 'surya',
    title: 'Brahma Murari',
    subtitle: 'Navagraha invocation',
    devanagari:
      'ब्रह्मा मुरारिस्त्रिपुरान्तकारी भानुः शशी भूमिसुतो बुधश्च ।\nगुरुश्च शुक्रः शनिराहुकेतवः कुर्वन्तु सर्वे मम सुप्रभातम् ॥',
    transliteration:
      'brahmā murāristripurāntakārī bhānuḥ śaśī bhūmisuto budhaśca\nguruśca śukraḥ śanirāhuketavaḥ kurvantu sarve mama suprabhātam',
    meaning:
      'Brahma, Vishnu, Shiva; Sun, Moon, Mars and Mercury; Jupiter, Venus, Saturn, Rahu and Ketu — may all of them make my morning auspicious.',
    source: 'Traditional Prabhat stotra',
    count: 3,
    bestTime: 'On waking',
    benefit: 'A morning verse acknowledging all nine grahas at once.',
  },

  // ── Guru ─────────────────────────────────────────────────────────────────
  {
    id: 'guru-brahma',
    category: 'guru',
    title: 'Gurur Brahmā Gurur Viṣṇuḥ',
    subtitle: 'Salutation to the teacher',
    devanagari:
      'गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः ।\nगुरुः साक्षात् परब्रह्म तस्मै श्रीगुरवे नमः ॥',
    transliteration:
      'gurur brahmā gurur viṣṇuḥ gurur devo maheśvaraḥ\nguruḥ sākṣāt parabrahma tasmai śrī gurave namaḥ',
    meaning:
      'The guru is Brahma, Vishnu and Maheshvara; the guru is verily the supreme reality. To that guru, salutations.',
    source: 'Guru Gita, Skanda Purana',
    count: 11,
    bestTime: 'Guru Purnima, Thursday',
    benefit: 'Chanted before study and on beginning any discipline.',
  },
  {
    id: 'twameva',
    category: 'guru',
    title: 'Tvameva Mātā ca Pitā Tvameva',
    subtitle: 'You are all things to me',
    devanagari:
      'त्वमेव माता च पिता त्वमेव त्वमेव बन्धुश्च सखा त्वमेव ।\nत्वमेव विद्या द्रविणं त्वमेव त्वमेव सर्वं मम देव देव ॥',
    transliteration:
      'tvameva mātā ca pitā tvameva tvameva bandhuśca sakhā tvameva\ntvameva vidyā draviṇaṁ tvameva tvameva sarvaṁ mama deva deva',
    meaning:
      'You alone are mother and father, kinsman and friend; you alone are knowledge and wealth. You are everything to me, my God.',
    source: 'Traditional prayer, Pandava Gita',
    count: 3,
    bestTime: 'Any time; often at the close of puja',
    benefit: 'A verse of complete refuge.',
  },

  // ── Bhagavad Gita ────────────────────────────────────────────────────────
  {
    id: 'gita-2-47',
    category: 'gita',
    title: 'Karmaṇyevādhikāraste',
    subtitle: 'On action without attachment',
    devanagari:
      'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    transliteration:
      'karmaṇyevādhikāraste mā phaleṣu kadācana\nmā karmaphalaheturbhūrmā te saṅgo\'stvakarmaṇi',
    meaning:
      'You have a right to action alone, never to its fruits. Do not act for the sake of results, nor be attached to inaction.',
    source: 'Bhagavad Gita 2.47',
    count: 3,
    bestTime: 'Before work',
    benefit: 'The Gita\'s central teaching on duty; meant for contemplation, not counting.',
  },
  {
    id: 'gita-2-20',
    category: 'gita',
    title: 'Na Jāyate Mriyate Vā',
    subtitle: 'On the imperishable self',
    devanagari:
      'न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः ।\nअजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे ॥',
    transliteration:
      'na jāyate mriyate vā kadācin nāyaṁ bhūtvā bhavitā vā na bhūyaḥ\najo nityaḥ śāśvato\'yaṁ purāṇo na hanyate hanyamāne śarīre',
    meaning:
      'It is never born and never dies; having been, it never ceases to be. Unborn, eternal, everlasting and ancient — it is not slain when the body is slain.',
    source: 'Bhagavad Gita 2.20',
    count: 3,
    bestTime: 'In grief, or in contemplation of impermanence',
    benefit: 'Traditionally read at times of loss.',
  },
  {
    id: 'gita-4-7',
    category: 'gita',
    title: 'Yadā Yadā Hi Dharmasya',
    subtitle: 'On the descent of the divine',
    devanagari:
      'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत ।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥',
    transliteration:
      'yadā yadā hi dharmasya glānirbhavati bhārata\nabhyutthānamadharmasya tadātmānaṁ sṛjāmyaham',
    meaning:
      'Whenever dharma declines and adharma rises, O Bharata, then I manifest myself.',
    source: 'Bhagavad Gita 4.7',
    count: 3,
    bestTime: 'Any time',
    benefit: 'Contemplated as an assurance of restoration and balance.',
  },

  // ── Daily practice ───────────────────────────────────────────────────────
  {
    id: 'karagre',
    category: 'daily',
    title: 'Karāgre Vasate Lakṣmīḥ',
    subtitle: 'On waking, before rising',
    devanagari:
      'कराग्रे वसते लक्ष्मीः करमध्ये सरस्वती ।\nकरमूले तु गोविन्दः प्रभाते करदर्शनम् ॥',
    transliteration:
      'karāgre vasate lakṣmīḥ karamadhye sarasvatī\nkaramūle tu govindaḥ prabhāte karadarśanam',
    meaning:
      'At the fingertips dwells Lakshmi, in the middle of the palm Saraswati, at its base Govinda. So at dawn one looks at one\'s hands.',
    source: 'Traditional morning verse',
    count: 1,
    bestTime: 'The first moment of waking',
    benefit: 'The classical first act of the day, before the feet touch the ground.',
  },
  {
    id: 'bhojana',
    category: 'daily',
    title: 'Annapūrṇe Sadāpūrṇe',
    subtitle: 'Before eating',
    devanagari:
      'अन्नपूर्णे सदापूर्णे शङ्करप्राणवल्लभे ।\nज्ञानवैराग्यसिद्ध्यर्थं भिक्षां देहि च पार्वति ॥',
    transliteration:
      'annapūrṇe sadāpūrṇe śaṅkaraprāṇavallabhe\njñānavairāgyasiddhyarthaṁ bhikṣāṁ dehi ca pārvati',
    meaning:
      'O Annapurna, ever full, beloved of Shankara — grant me alms, that I may attain knowledge and dispassion.',
    source: 'Annapurna Stotra, attributed to Adi Shankaracharya',
    count: 1,
    bestTime: 'Before a meal',
    benefit: 'Turns eating into an act of gratitude.',
  },
  {
    id: 'shanti-path',
    category: 'daily',
    title: 'Dyauḥ Śāntiḥ',
    subtitle: 'The great peace invocation',
    devanagari:
      'ॐ द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः ।\nवनस्पतयः शान्तिर्विश्वेदेवाः शान्तिर्ब्रह्म शान्तिः सर्वं शान्तिः ।\nशान्तिरेव शान्तिः सा मा शान्तिरेधि ।\nॐ शान्तिः शान्तिः शान्तिः ॥',
    transliteration:
      'oṁ dyauḥ śāntirantarikṣaṁ śāntiḥ pṛthivī śāntirāpaḥ śāntiroṣadhayaḥ śāntiḥ\nvanaspatayaḥ śāntirviśvedevāḥ śāntirbrahma śāntiḥ sarvaṁ śāntiḥ\nśāntireva śāntiḥ sā mā śāntiredhi\noṁ śāntiḥ śāntiḥ śāntiḥ',
    meaning:
      'Peace in the heavens, peace in the sky, peace on earth; peace in the waters, the herbs, the trees. Peace in all the devas, peace in Brahman, peace in everything. Peace itself — may that peace come to me.',
    source: 'Yajur Veda 36.17',
    count: 3,
    bestTime: 'To close any practice',
    benefit: 'The most complete of the shanti mantras.',
  },
]

export function mantrasByCategory(category: MantraCategory | 'all'): Mantra[] {
  return category === 'all' ? MANTRAS : MANTRAS.filter(m => m.category === category)
}

/** Categories that actually have entries, in display order. */
export const CATEGORIES = (Object.keys(CATEGORY_LABELS) as MantraCategory[])
  .filter(c => MANTRAS.some(m => m.category === c))
