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
  /** Public site country allowlist (US+CA default). */
  geo_access?: GeoAccess;
  partners_title: string;
  /** When false, partners strip is hidden on the public home page. */
  show_partners: boolean;
  updated_at?: string;
};

export type WhyFeature = {
  number: string;
  title: string;
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
  image_media_id: string | null;
  features: WhyFeature[];
};

export type HomeProfilesTeaser = {
  headline: string;
  body: string;
  cta_label: string;
  cta_href: string;
};

export type HomeVideosSection = {
  headline: string;
  body: string;
  manual_label: string;
  manual_document_key: string;
};

export type HomeCtaCard = {
  headline: string;
  body: string;
  cta_label: string;
  cta_href?: string;
  image_media_id: string | null;
};

export type HomeCtas = {
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
  horizontal: ProfileSheetCopy;
  vertical: ProfileSheetCopy;
  universal: ProfileSheetCopy;
  quote_cta_label: string;
  manual_cta_label: string;
};

export type ProfileOrientation = "horizontal" | "vertical" | "universal";

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
  partners: Partner[];
  home_profile_jewels: HomeProfileJewel[];
  profiles: Profile[];
  dealers: Dealer[];
  videos: Video[];
  documents: DocumentRow[];
  media: Record<string, MediaAsset>;
  published_at: string;
};
