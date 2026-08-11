/* ═══════════════════════════════════════════════════════════════════════════
   ICON - the site's ONE icon system.
   ───────────────────────────────────────────────────────────────────────────
   Before this, the site ran three incompatible sets at once: the Material
   Symbols web font (656 usages, variable weight/fill/grade, so stroke weight
   drifted section to section), bespoke inline SVG glyphs in the report grid at
   a different weight again, and Divine Services' filled Material icons sitting
   inside eight differently-tinted rounded squares.

   Everything now resolves through this component:
     · Lucide for the general vocabulary - one geometric family, 24px grid,
       round caps and joins.
     · VEDIC_GLYPHS for the concepts Lucide has no honest mark for - yantra,
       shikhara, chakra, dosha, diya - drawn to exactly the same spec.
     · ONE stroke width for the entire site (1.75), set here and nowhere else.
       There is no `fill` variant. Weight cannot drift again.

   `name` still accepts the legacy Material Symbols names so data-driven icon
   fields (`icon: 'temple_hindu'` in CMS rows, admin tables, service configs)
   keep working untouched. New code should prefer the semantic names -
   'yantra', 'lotus', 'shikhara' - listed at the bottom of the map.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { CSSProperties } from 'react'
import {
  Activity, Apple, ArrowLeft, ArrowRight, Backpack, Baby, BadgeCheck, BadgePercent,
  Ban, BarChart3, Bed, Bell, BookOpen, Bookmark, Bot, Brain, Briefcase,
  Cake, Calculator, Calendar, CalendarCheck, CalendarClock, CalendarDays, CalendarPlus,
  CalendarRange, CalendarX, Camera, Check, ChevronDown, ChevronLeft, ChevronRight,
  ChevronUp, Circle, CircleAlert, CircleCheck, CircleCheckBig, CircleDot, CirclePlay,
  CirclePlus, CircleX, Clock, Compass, CookingPot, Copy, CreditCard, Download,
  DoorOpen, Droplet, Eye, EyeOff, FileText, FileUp, Film, Flag, Flame, FolderOpen,
  Gem, Gift, Globe, GraduationCap, Grid3x3, Handshake, Headset, Heart, HeartHandshake,
  HeartPulse, Hexagon, Hourglass, House, Hotel, Image as ImageIcon, IndianRupee, Info,
  LayoutDashboard, LayoutGrid, Library, Lightbulb, Link as LinkIcon, LoaderCircle,
  LocateFixed, Lock, LockOpen, LogOut, Mail, Map as MapIcon, MapPin, Maximize,
  Megaphone, Menu, MessageCircle, MessagesSquare, Mic, Minimize, Minus, Monitor,
  MonitorPlay, Moon, MoonStar, Navigation, Package, PanelLeftOpen, Palette,
  PartyPopper, Pencil, PenLine, PiggyBank, Pin, Pipette, PlaneTakeoff, Play, Plus,
  Printer, ReceiptText, Rocket, RotateCcw, RotateCw, Route, Rss, Save, Search,
  Send, Settings, Shapes, Share2, Shield, ShieldCheck, ShoppingBag, ShoppingCart,
  SkipBack, SkipForward, Sparkles, Square, SquarePen, Star, Stethoscope, Store,
  Sunset, Sun, Tag, TicketCheck, Timer, TrainFront, Trash, Trash2, TriangleAlert,
  Trophy, Truck, Type, Upload, User, UserCheck, UserCog, UserPlus, Users,
  UtensilsCrossed, Video, VideoOff, Wallet, Waves, Webhook, Wind, ZoomIn, ZoomOut,
  Archive, ArchiveRestore, ArrowDown, ArrowLeftRight, ArrowUp, ArrowUpDown, Award, BellOff,
  BellRing, Bus, Captions, Car, ChartLine, ChartPie, CheckCheck, CircleHelp,
  Clipboard, Cloud, Dumbbell, Ellipsis, EllipsisVertical, ExternalLink, Fingerprint, Gauge,
  HardHat, Headphones, History, Inbox, Key, Landmark, Languages, LifeBuoy,
  ListChecks, ListFilter, MailOpen, Medal, MessageSquare, MicOff, Paperclip, PawPrint,
  Percent, Plane, QrCode, Quote, RefreshCw, SlidersHorizontal, Snowflake, Table,
  ThumbsDown, ThumbsUp, TreePine, TrendingDown, TrendingUp, Volume2, VolumeX, Wrench,
  Pause, Phone, PhoneOff, X, Zap, Infinity as InfinityIcon, List, Tv, Factory, Venus, Mars,
} from 'lucide-react'
import { VEDIC_GLYPHS, type VedicGlyphName } from './VedicGlyphs'

type LucideLike = React.ComponentType<{
  size?: number | string
  strokeWidth?: number | string
  className?: string
  style?: CSSProperties
  'aria-hidden'?: boolean
}>

/* Legacy Material Symbols name → Lucide component. Kept exhaustive so no call
   site has to change when it passes a name through from data. */
const LUCIDE_MAP: Record<string, LucideLike> = {
  abc: Type,
  add: Plus,
  add_circle: CirclePlus,
  add_shopping_cart: ShoppingCart,
  air: Wind,
  all_inclusive: InfinityIcon,
  api: Webhook,
  apps: LayoutGrid,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  article: FileText,
  auto_stories: BookOpen,
  backpack: Backpack,
  bar_chart: BarChart3,
  bed: Bed,
  bedtime: Moon,
  block: Ban,
  bolt: Zap,
  book_online: TicketCheck,
  bookmark: Bookmark,
  cake: Cake,
  calculate: Calculator,
  calendar_add_on: CalendarPlus,
  calendar_month: Calendar,
  calendar_today: CalendarDays,
  calendar_view_week: CalendarRange,
  call: Phone,
  call_end: PhoneOff,
  campaign: Megaphone,
  cancel: CircleX,
  category: Shapes,
  celebration: PartyPopper,
  chat: MessageCircle,
  check: Check,
  check_circle: CircleCheck,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  child_care: Baby,
  close: X,
  colorize: Pipette,
  content_copy: Copy,
  cooking: CookingPot,
  credit_card: CreditCard,
  currency_rupee: IndianRupee,
  dark_mode: Moon,
  dashboard: LayoutDashboard,
  delete: Trash2,
  delete_forever: Trash,
  description: FileText,
  diamond: Gem,
  directions: Navigation,
  door_front: DoorOpen,
  download: Download,
  draw: PenLine,
  edit: Pencil,
  edit_note: SquarePen,
  emoji_events: Trophy,
  error: CircleAlert,
  event: Calendar,
  event_available: CalendarCheck,
  event_busy: CalendarX,
  event_note: CalendarClock,
  expand_less: ChevronUp,
  expand_more: ChevronDown,
  explore: Compass,
  family_restroom: Users,
  favorite: Heart,
  favorite_border: Heart,
  female: Venus,
  flight_takeoff: PlaneTakeoff,
  folder_open: FolderOpen,
  format_list_bulleted: List,
  forum: MessagesSquare,
  fullscreen: Maximize,
  fullscreen_exit: Minimize,
  grid_on: Grid3x3,
  group: Users,
  groups: Users,
  handshake: Handshake,
  hd: Monitor,
  healing: HeartPulse,
  hexagon: Hexagon,
  home: House,
  hotel: Hotel,
  hourglass_empty: Hourglass,
  house: House,
  how_to_reg: UserCheck,
  image: ImageIcon,
  info: Info,
  inventory_2: Package,
  language: Globe,
  library_books: Library,
  light_mode: Sun,
  lightbulb: Lightbulb,
  link: LinkIcon,
  live_tv: Tv,
  local_fire_department: Flame,
  local_offer: Tag,
  local_shipping: Truck,
  location_on: MapPin,
  lock: Lock,
  lock_open: LockOpen,
  logout: LogOut,
  mail: Mail,
  male: Mars,
  manage_accounts: UserCog,
  manufacturing: Factory,
  map: MapIcon,
  medical_services: Stethoscope,
  meeting_room: DoorOpen,
  menu: Menu,
  menu_book: BookOpen,
  menu_open: PanelLeftOpen,
  movie: Film,
  my_location: LocateFixed,
  navigate_before: ChevronLeft,
  navigate_next: ChevronRight,
  neurology: Brain,
  new_releases: BadgeCheck,
  nightlight: Moon,
  nights_stay: MoonStar,
  notifications: Bell,
  notifications_none: Bell,
  nutrition: Apple,
  package_2: Package,
  palette: Palette,
  payment: CreditCard,
  payments: Wallet,
  person: User,
  person_add: UserPlus,
  phone: Phone,
  photo_camera: Camera,
  picture_as_pdf: FileText,
  pause: Pause,
  play_arrow: Play,
  play_circle: CirclePlay,
  play_lesson: MonitorPlay,
  price_change: BadgePercent,
  print: Printer,
  progress_activity: LoaderCircle,
  psychology: Brain,
  public: Globe,
  publish: Upload,
  push_pin: Pin,
  radio_button_checked: CircleDot,
  radio_button_unchecked: Circle,
  receipt_long: ReceiptText,
  record_voice_over: Mic,
  redeem: Gift,
  refresh: RotateCw,
  remove: Minus,
  replay: RotateCcw,
  report: Flag,
  restart_alt: RotateCcw,
  restaurant: UtensilsCrossed,
  rocket_launch: Rocket,
  route: Route,
  save: Save,
  savings: PiggyBank,
  schedule: Clock,
  school: GraduationCap,
  search: Search,
  send: Send,
  settings: Settings,
  share: Share2,
  shield: Shield,
  shopping_bag: ShoppingBag,
  shopping_cart: ShoppingCart,
  skip_next: SkipForward,
  skip_previous: SkipBack,
  smart_display: MonitorPlay,
  smart_toy: Bot,
  star: Star,
  stars: Sparkles,
  stop: Square,
  storefront: Store,
  support_agent: Headset,
  tag: Tag,
  task_alt: CircleCheckBig,
  text_fields: Type,
  timeline: Activity,
  timer: Timer,
  today: CalendarDays,
  toc: List,
  train: TrainFront,
  transgender: User,
  travel_explore: Globe,
  upload: Upload,
  upload_file: FileUp,
  verified: BadgeCheck,
  verified_user: ShieldCheck,
  video_call: Video,
  videocam: Video,
  videocam_off: VideoOff,
  view_module: LayoutGrid,
  visibility: Eye,
  visibility_off: EyeOff,
  volunteer_activism: HeartHandshake,
  warning: TriangleAlert,
  water_drop: Droplet,
  waves: Waves,
  wb_sunny: Sun,
  wb_twilight: Sunset,
  wifi_tethering: Rss,
  work: Briefcase,
  zoom_in: ZoomIn,
  zoom_out: ZoomOut,

  /* Names that only ever arrive from CMS/database rows, never from source.
     Surfaced by the dev-time warning below rather than by static analysis. */
  ac_unit: Snowflake,
  account_balance: Landmark,
  account_balance_wallet: Wallet,
  admin_panel_settings: ShieldCheck,
  archive: Archive,
  arrow_downward: ArrowDown,
  arrow_upward: ArrowUp,
  attach_file: Paperclip,
  auto_awesome: Sparkles,
  brightness_4: Sun,
  brightness_6: Sun,
  brightness_high: Sun,
  brightness_low: Sun,
  build: Wrench,
  cached: RefreshCw,
  card_giftcard: Gift,
  checklist: ListChecks,
  cloud: Cloud,
  comment: MessageSquare,
  construction: HardHat,
  contact_support: LifeBuoy,
  content_paste: Clipboard,
  currency_exchange: ArrowLeftRight,
  directions_bus: Bus,
  directions_car: Car,
  discount: BadgePercent,
  diversity_3: Users,
  do_not_disturb: BellOff,
  done: Check,
  done_all: CheckCheck,
  drafts: MailOpen,
  emoji_objects: Lightbulb,
  favorite_outline: Heart,
  feedback: MessageSquare,
  filter_list: ListFilter,
  fingerprint: Fingerprint,
  fitness_center: Dumbbell,
  flag: Flag,
  flare: Sparkles,
  flight: Plane,
  fmd_good: MapPin,
  group_add: UserPlus,
  forest: TreePine,
  format_quote: Quote,
  handyman: Wrench,
  headphones: Headphones,
  help: CircleHelp,
  help_outline: CircleHelp,
  history: History,
  inbox: Inbox,
  insights: TrendingUp,
  inventory: Package,
  key: Key,
  leaderboard: BarChart3,
  lens: Circle,
  local_activity: BadgePercent,
  local_hospital: Stethoscope,
  local_mall: ShoppingBag,
  mic_off: MicOff,
  military_tech: Medal,
  monitoring: Activity,
  near_me: Navigation,
  more_horiz: Ellipsis,
  more_vert: EllipsisVertical,
  notifications_active: BellRing,
  open_in_new: ExternalLink,
  outbox: Send,
  park: TreePine,
  percent: Percent,
  pets: PawPrint,
  pie_chart: ChartPie,
  psychology_alt: Brain,
  qr_code: QrCode,
  query_stats: ChartLine,
  rate_review: MessageSquare,
  report_problem: TriangleAlert,
  restaurant_menu: UtensilsCrossed,
  reviews: Star,
  rule: ListChecks,
  settings_video_camera: Video,
  show_chart: TrendingUp,
  sort: ArrowUpDown,
  speed: Gauge,
  star_border: Star,
  stop_circle: Square,
  star_outline: Star,
  subtitles: Captions,
  sunny: Sun,
  support: LifeBuoy,
  sync: RefreshCw,
  table_chart: Table,
  thumb_down: ThumbsDown,
  thumb_up: ThumbsUp,
  translate: Languages,
  trending_down: TrendingDown,
  trending_up: TrendingUp,
  tune: SlidersHorizontal,
  unarchive: ArchiveRestore,
  update: RefreshCw,
  volume_off: VolumeX,
  volume_up: Volume2,
  water: Droplet,
  whatshot: Flame,
  widgets: LayoutGrid,
  workspace_premium: Award,
}

/* Names - legacy and semantic - that resolve to a custom Vedic glyph instead.
   These are the marks that carry the brand, so they are never generic. */
const VEDIC_MAP: Record<string, VedicGlyphName> = {
  /* legacy Material names that were standing in for Vedic concepts */
  brightness_5: 'diya',
  brightness_7: 'nakshatra',
  candle: 'diya',
  donut_large: 'chakra',
  eco: 'dosha',
  full_tathastu: 'yantra',
  grid_4x4: 'yantra',
  kundli: 'navagraha',
  local_florist: 'lotus',
  self_improvement: 'lotus',
  spa: 'lotus',
  temple_hindu: 'shikhara',
  token: 'yantra',

  /* semantic names - prefer these in new code */
  yantra: 'yantra',
  chakra: 'chakra',
  lotus: 'lotus',
  diya: 'diya',
  kalash: 'kalash',
  shikhara: 'shikhara',
  palm: 'palm',
  dosha: 'dosha',
  mantra: 'mantra',
  nakshatra: 'nakshatra',
  bindu: 'bindu',
  navagraha: 'navagraha',
}

export type IconName = keyof typeof LUCIDE_MAP | keyof typeof VEDIC_MAP | (string & {})

export interface IconProps {
  name: IconName
  /** Rendered box in px. Defaults to 20 - the site's inline-with-text size. */
  size?: number
  className?: string
  style?: CSSProperties
  /** Accessible label. Omit for decorative icons (the default, aria-hidden). */
  title?: string
}

/* THE single stroke weight for every icon on the site. Changing this number is
   the only supported way to re-weight the icon set. */
const STROKE_WIDTH = 1.75

export default function Icon({ name, size = 20, className, style, title }: IconProps) {
  const glyph = VEDIC_MAP[name as string]

  if (glyph) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{ flexShrink: 0, ...style }}
        role={title ? 'img' : undefined}
        aria-hidden={title ? undefined : true}
      >
        {title ? <title>{title}</title> : null}
        {VEDIC_GLYPHS[glyph]}
      </svg>
    )
  }

  const Glyph = LUCIDE_MAP[name as string]

  /* Icon names also arrive from CMS rows and admin-configurable service
     records, which static analysis cannot enumerate. An unknown name falls
     back to the bindu - on-brand and clearly deliberate rather than a broken
     glyph - and shouts in development so it can be mapped properly. */
  if (!Glyph) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[Icon] Unmapped icon name "${name}" - falling back to the bindu glyph. ` +
          `Add it to LUCIDE_MAP or VEDIC_MAP in components/ui/Icon.tsx.`
      )
    }
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{ flexShrink: 0, ...style }}
        role={title ? 'img' : undefined}
        aria-hidden={title ? undefined : true}
      >
        {title ? <title>{title}</title> : null}
        {VEDIC_GLYPHS.bindu}
      </svg>
    )
  }

  return (
    <Glyph
      size={size}
      strokeWidth={STROKE_WIDTH}
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden={title ? undefined : true}
    />
  )
}
