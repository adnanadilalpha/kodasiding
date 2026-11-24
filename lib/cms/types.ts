export type NavLink = { label: string; href: string };

export type SiteNav = {
  logo_alt: string;
  links: NavLink[];
  find_dealer_label: string;
  find_dealer_href: string;
  /** When false, nav "Find a dealer" CTA is hidden on the public site. */
  show_find_dealer: boolean;
  quote_label: string;
};

export type SocialLink = {
  label: string;
  href: string;
  /** Tabler icon id from SOCIAL_ICON_OPTIONS */
  icon: string;
};

export type SiteFooter = {
  tagline: string;
  copyright: string;
  links: NavLink[];
  social: SocialLink[];
};

export type QuoteAttachmentFileTypeId =
  | "pdf"
  | "jpg"
  | "png"
  | "webp"
  | "heic"
  | "doc"
  | "xls"
  | "txt";

export type QuoteFormFieldKind =
  | "full_name"
  | "email"
  | "phone"
  | "city"
  | "state"
  | "message"
  | "attachment"
  | "custom";

export type QuoteFormFieldDef = {
  id: string;
  kind: QuoteFormFieldKind;
  label: string;
  required?: boolean;
  /** half = share a row with the next half field when consecutive */
  width?: "full" | "half";
  /** custom fields only */
  input?: "text" | "textarea";
};

/** Legacy label map — still read for migration. */
export type QuoteFormFieldsLegacy = {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  message: string;
  attachment: string;
  upload_label: string;
};

export type QuoteFormSettings = {
  title: string;
  submit_label: string;
  /** Upload button label (attachment field name is fixed). */
  upload_label: string;
  allowed_file_types: QuoteAttachmentFileTypeId[];
  /** Ordered fields shown on the public quote modal. */
  fields: QuoteFormFieldDef[];
};

/** Site-wide defaults for Next.js Metadata API */
export type SiteSeo = {
  title: string;
  /** e.g. "%s | Koda Siding" — used as metadata.title.template */
  title_template: string;
  description: string;
  /** Canonical origin for metadataBase, e.g. https://kodasiding.com */
  site_url: string;
  og_image_media_id: string | null;
};

/** Per-page SEO overrides (CMS tabs on each page). */
export type PageSeo = {
  title: string;
  description: string;
  og_title: string;
  og_description: string;
  og_image_media_id: string | null;
  canonical_path: string;
};

/** Extra page SEO stored on site_settings (no dedicated page row). */
export type FindDealerPageCopy = {
  search_placeholder: string;
  search_button_label: string;
  quick_search_label: string;
  call_label: string;
  directions_label: string;
  empty_results: string;
};

export type PagesSeoBag = {
  installation?: PageSeo;
  find_dealer?: PageSeo;
  find_dealer_copy?: FindDealerPageCopy;
};

export type GeoAccess = {
  enabled: boolean;
  allowed_countries: string[];
};

export type SiteSettings = {
  id: number;
  nav: SiteNav;
  footer: SiteFooter;
  quote_form: QuoteFormSettings;
  seo: SiteSeo;
  /** Installation + find-dealer SEO (pages without their own seo column). */
  pages_seo?: PagesSeoBag;
  /** Public site country allowlist (US+CA default). */
  geo_access?: GeoAccess;
  partners_title: string;
  /** When false, partners strip is hidden on the public home page. */
  show_partners: boolean;
  updated_at?: string;
};

/** Where the card image sits relative to the text. */
export type WhyFeatureLayout =
  | "image-right"
  | "image-left"
  | "image-top"
  | "image-bottom";

export type WhyFeature = {
  number: string;
  title: string;
  body: string;
  /** Per-card image for the Why Koda layout. */
  image_media_id?: string | null;
  /** Image position relative to text. Defaults to alternating left/right. */
  layout?: WhyFeatureLayout | null;
};

/** One cell in the Why Koda graphical fact banner. */
export type WhyFact = {
  /** Large figure — e.g. "Class 4", "AAMA 625", "141.7" */
  value: string;
  /** Short label under the figure — e.g. "Hail Impact" */
  label: string;
  /** Optional supporting line */
  body: string;
};

export type HomeHero = {
  headline: string;
  subheadline: string;
  cta_label: string;
  cta_href: string;
  image_media_id: string | null;
};

export type HomeWhyKoda = {
  headline: string;
  body: string;
  /**
   * @deprecated Prefer `facts` for the graphical banner.
   * Kept for older CMS JSON.
   */
  highlights?: string;
  /** Graphical fact banner cells under the Why Koda headline. */
  facts?: WhyFact[];
  /** @deprecated Per-card images only; kept null for backwards-compatible JSON. */
  image_media_id: string | null;
  features: WhyFeature[];
};

export type HomeProfilesTeaser = {
  headline: string;
  body: string;
  cta_label: string;
  cta_href: string;
};

/** Homepage local-install services teaser (stored on videos_section JSON). */
export type HomeInstallServices = {
  headline: string;
  body: string;
  service_area: string;
  primary_cta_label: string;
  diy_cta_label: string;
  diy_cta_href: string;
};

/**
 * DIY /installation page copy + optional homepage services fields.
 * Lives in page_home.videos_section (JSON) — no new DB column.
 */
export type HomeVideosSection = {
  /** /installation hero headline */
  headline: string;
  /** /installation hero body (blank line = new paragraph) */
  body: string;
  /** Eyebrow on /installation hero (e.g. Omaha & surrounding areas) */
  hero_service_label?: string;
  /** Coverage radius in miles for the /installation map */
  install_radius_miles?: number;
  /** Short helper under the coverage map / search */
  cities_intro?: string;
  /** Towns on /installation map + search, separated by · */
  cities?: string;
  /** /installation hero photo */
  hero_image_media_id?: string | null;
  manual_label: string;
  manual_document_key: string;
  /** Homepage services headline (optional; defaults in code) */
  services_headline?: string;
  services_body?: string;
  /** Homepage teaser service-area chip (e.g. Nebraska) */
  service_area?: string;
  services_cta_label?: string;
  diy_link_label?: string;
  /** Prefix before service area on home install hero (e.g. Local install) */
  eyebrow_prefix?: string;
  /** Coverage card heading */
  coverage_heading?: string;
  town_search_placeholder?: string;
  hero_image_alt?: string;
  /** /installation DIY page chrome */
  diy_eyebrow?: string;
  diy_headline?: string;
  diy_body?: string;
  videos_eyebrow?: string;
  videos_heading?: string;
  local_crews_eyebrow?: string;
  local_crews_heading?: string;
  local_crews_link_label?: string;
  local_crews_cta_label?: string;
};

export type HomeCtaCard = {
  headline: string;
  body: string;
  cta_label: string;
  cta_href?: string;
  image_media_id: string | null;
};

export type HomeCtas = {
  /** Dual-card section heading when dealer card is shown */
  section_heading?: string;
  section_description?: string;
  /** Eyebrow used in quote-only cinematic layout */
  quote_only_eyebrow?: string;
  quote: HomeCtaCard;
  dealer: HomeCtaCard;
  /** When false, the home "Find a dealer" card is hidden on the public site. */
  show_dealer: boolean;
};

export type PageHome = {
  id: number;
  hero: HomeHero;
  why_koda: HomeWhyKoda;
  profiles_teaser: HomeProfilesTeaser;
  videos_section: HomeVideosSection;
  ctas: HomeCtas;
  seo?: PageSeo;
  updated_at?: string;
};

export type MediaAsset = {
  id: string;
  bucket: string;
  path: string;
  alt: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  mime_type: string | null;
  created_at: string;
};

export type Partner = {
  id: string;
  name: string;
  logo_media_id: string | null;
  sort_order: number;
  is_published: boolean;
};

export type ProfileSheetCopy = {
  headline: string;
  helper: string;
};

export type PageProfiles = {
  id: number;
  page_title?: string;
  page_intro?: string;
  learn_more_label?: string;
  horizontal: ProfileSheetCopy;
  vertical: ProfileSheetCopy;
  universal: ProfileSheetCopy;
  soffit: ProfileSheetCopy;
  quote_cta_label: string;
  manual_cta_label: string;
  seo?: PageSeo;
};

export type ProfileOrientation =
  | "horizontal"
  | "vertical"
  | "universal"
  | "soffit";

export type Profile = {
  id: string;
  slug: string;
  name: string;
  reveal: string;
  orientation: ProfileOrientation;
  description: string;
  hover_copy: string;
  exposure: string;
  face_width: string;
  depth: string;
  install: string;
  image_media_id: string | null;
  diagram_media_id: string | null;
  sort_order: number;
  is_published: boolean;
  show_on_home: boolean;
};

/** Home page profile jewels — not the Profiles page catalog */
export type HomeProfileJewel = {
  id: string;
  name: string;
  reveal: string;
  image_media_id: string | null;
  sort_order: number;
  is_published: boolean;
};

export type Dealer = {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  postal: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  website: string;
  is_published: boolean;
};

export type Video = {
  id: string;
  title: string;
  orientation: "horizontal" | "vertical";
  thumbnail_media_id: string | null;
  video_url: string;
  sort_order: number;
  is_published: boolean;
};

export type DocumentRow = {
  id: string;
  key: string;
  title: string;
  storage_path: string;
  bucket: string;
};

/** KodaVent product page — singleton CMS content */
export type KodaVentAnnotation = {
  id: string;
  title: string;
  description: string;
  /** Desktop pin position as percent of illustration (0–100). */
  x: number;
  y: number;
  visible: boolean;
};

export type KodaVentHero = {
  eyebrow: string;
  heading: string;
  supporting_headline: string;
  description: string;
  image_media_id: string | null;
  image_alt: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  visible: boolean;
};

export type KodaVentProductDesign = {
  eyebrow: string;
  heading: string;
  description: string;
  image_media_id: string | null;
  image_alt: string;
  image_caption: string;
  /** Optional exploded / how-it-works image (falls back to public asset). */
  exploded_image_media_id?: string | null;
  exploded_image_alt?: string;
  annotations: KodaVentAnnotation[];
  visible: boolean;
};

export type KodaVentInstalled = {
  eyebrow: string;
  heading: string;
  description: string;
  image_media_id: string | null;
  image_alt: string;
  /** Small label overlaid on the photo (e.g. On the wall). */
  badge_label: string;
  caption: string;
  /** Title under the caption on the photo card. */
  figure_title: string;
  /** Short trait labels under the heading (e.g. Quiet / Square). */
  traits?: string[];
  visible: boolean;
};

export type KodaVentInstallStep = {
  id: string;
  number: string;
  title: string;
  description: string;
  image_media_id: string | null;
  image_alt: string;
  visible: boolean;
};

export type KodaVentInstallMethod = {
  id: string;
  tab_label: string;
  heading: string;
  intro: string;
  pdf_document_key: string;
  pdf_link_label: string;
  steps: KodaVentInstallStep[];
  visible: boolean;
};

export type KodaVentInstallation = {
  eyebrow: string;
  heading: string;
  description: string;
  methods: KodaVentInstallMethod[];
  visible: boolean;
};

export type KodaVentRetailerLink = {
  id: string;
  label: string;
  href: string;
  visible: boolean;
};

export type KodaVentCta = {
  eyebrow: string;
  heading: string;
  description: string;
  guides_link_label: string;
  coming_soon_label: string;
  cta_label: string;
  /** Empty or "#quote" opens the quote modal. Prefer retailer links for Order Now. */
  cta_href: string;
  retailers?: KodaVentRetailerLink[];
  visible: boolean;
};

export type KodaVentSeo = PageSeo;

export type PageKodaVent = {
  id: number;
  hero: KodaVentHero;
  product_design: KodaVentProductDesign;
  installed: KodaVentInstalled;
  installation: KodaVentInstallation;
  cta: KodaVentCta;
  seo: KodaVentSeo;
  updated_at?: string;
};

export type QuoteLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  message: string;
  attachment_path: string;
  meta: Record<string, unknown>;
  created_at: string;
};

/** SMTP mailbox settings for quote lead notifications (admin Email setup). */
export type QuoteEmailSettings = {
  enabled: boolean;
  /** Always "smtp" for custom mailbox delivery. */
  provider: "smtp" | "resend" | "brevo";
  to_email: string;
  from_email: string;
  from_name: string;
  reply_to_submitter: boolean;
  /** Send a confirmation email to the person who submitted the quote form. */
  send_lead_confirmation: boolean;
  resend_api_key: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
};

export type SiteSnapshotPayload = {
  settings: SiteSettings;
  home: PageHome;
  page_profiles: PageProfiles;
  page_kodavent: PageKodaVent;
  partners: Partner[];
  home_profile_jewels: HomeProfileJewel[];
  profiles: Profile[];
  dealers: Dealer[];
  videos: Video[];
  documents: DocumentRow[];
  media: Record<string, MediaAsset>;
  published_at: string;
};
