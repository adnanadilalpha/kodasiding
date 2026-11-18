import type {
  KodaVentAnnotation,
  KodaVentCta,
  KodaVentHero,
  KodaVentInstalled,
  KodaVentInstallation,
  KodaVentInstallMethod,
  KodaVentInstallStep,
  KodaVentProductDesign,
  KodaVentSeo,
  PageKodaVent,
} from "@/lib/cms/types";

function step(
  id: string,
  number: string,
  title: string,
  description: string,
): KodaVentInstallStep {
  return {
    id,
    number,
    title,
    description,
    image_media_id: null,
    image_alt: "",
    visible: true,
  };
}

function annotation(
  id: string,
  title: string,
  description: string,
  x: number,
  y: number,
): KodaVentAnnotation {
  return { id, title, description, x, y, visible: true };
}

export const DEFAULT_KODAVENT_HERO: KodaVentHero = {
  eyebrow: "KODA SIDING / PRODUCT",
  heading: "KodaVent.",
  supporting_headline: "A better finish for exterior exhausts.",
  description:
    "A 4-inch exhaust vent cover designed with thoughtful installation detailing for new construction and retrofit applications.",
  image_media_id: null,
  image_alt: "KodaVent 4-inch exhaust vent cover",
  primary_cta_label: "Explore Installation",
  primary_cta_href: "#installation",
  secondary_cta_label: "Product Details",
  secondary_cta_href: "#product-design",
  visible: true,
};

export const DEFAULT_KODAVENT_PRODUCT_DESIGN: KodaVentProductDesign = {
  heading: "Flashed like a window. Sealed like one too.",
  description:
    "A mounting flange for new construction, scored for retrofit — installed with the same care as a flashed opening.",
  image_media_id: null,
  image_alt: "KodaVent product illustration with mounting flange",
  annotations: [
    annotation(
      "ann-flange",
      "Mounting Flange",
      "Designed for fastening and flashing during new construction.",
      36,
      28,
    ),
    annotation(
      "ann-seal",
      "Sealing Detail",
      "Exterior-grade silicone is applied around the back perimeter during installation.",
      68,
      46,
    ),
    annotation(
      "ann-retrofit",
      "Retrofit Configuration",
      "Scored flange grooves allow the flanges to be removed for retrofit installation.",
      42,
      74,
    ),
  ],
  visible: true,
};

export const DEFAULT_KODAVENT_INSTALLED: KodaVentInstalled = {
  heading: "Designed for the finished wall.",
  description:
    "A considered exterior detail for new construction and retrofit installations.",
  image_media_id: null,
  image_alt: "KodaVent installed on an exterior wall",
  caption: "KODAVENT / INSTALLED APPLICATION",
  visible: false,
};

const NEW_CONSTRUCTION_STEPS: KodaVentInstallStep[] = [
  step(
    "nc-01",
    "01",
    "Locate the vent position",
    "Locate the vent position on the wall, centered between structural members. Confirm there is no wiring, plumbing, or other obstruction behind the layout point before cutting.",
  ),
  step(
    "nc-02",
    "02",
    "Cut the opening",
    'Cut the opening using one of the following methods: a. Hole saw: Drill a 4-1/4" diameter hole at the marked center point. b. Template and saw: Trace the supplied template onto the wall and cut the opening with a reciprocating saw or jigsaw.',
  ),
  step(
    "nc-03",
    "03",
    "Test-fit the cover",
    "Test-fit the exhaust cover in the opening.",
  ),
  step(
    "nc-04",
    "04",
    "Apply flashing tape below",
    'Apply a 15" length of flashing tape below the cutout, centered left to right.',
  ),
  step(
    "nc-05",
    "05",
    "Apply exterior-grade silicone",
    'Apply a 1/4" bead of exterior-grade silicone around the perimeter of the back side of the nailing flange.',
  ),
  step(
    "nc-06",
    "06",
    "Position the cover",
    "Set the exhaust cover into the opening and center it.",
  ),
  step(
    "nc-07",
    "07",
    "Install the first screw",
    "Install one of the supplied screws into the top-left flange hole.",
  ),
  step(
    "nc-08",
    "08",
    "Level and fasten",
    "Level the cover with a small level and install a second screw on the right side.",
  ),
  step(
    "nc-09",
    "09",
    "Install remaining screws",
    "Recheck level, then install the remaining screws into the flange.",
  ),
  step(
    "nc-10",
    "10",
    "Flash the side flanges",
    "Apply flashing tape over the left and right flanges.",
  ),
  step(
    "nc-11",
    "11",
    "Flash the top flange",
    "Apply flashing tape over the top flange, shingled over the side tape so the top piece laps over the side pieces and sheds water outward.",
  ),
  step(
    "nc-12",
    "12",
    "Connect the duct",
    'Connect the exhaust duct to the exhaust cover with a 4" stainless steel hose clamp. Test operation.',
  ),
];

const RETROFIT_STEPS: KodaVentInstallStep[] = [
  step(
    "rt-01",
    "01",
    "Remove the mounting flanges",
    "On the back side of the exhaust cover, score one of the long grooves with a sharp utility knife three or four times, keeping the blade pulled away from your hand. Flex the scored flange back and forth until it snaps off. Repeat for the remaining three flanges.",
  ),
  step(
    "rt-02",
    "02",
    "Remove the existing cover",
    "If there is an existing exhaust cover, remove it.",
  ),
  step(
    "rt-03",
    "03",
    "Prepare the opening",
    'If there is no existing exhaust cover, cut an opening through the exterior cladding and wall assembly using one of the following methods: a. Hole saw: Drill a 4-1/4" diameter hole at the marked center point. b. Template and saw: Trace the supplied template onto the wall and cut the opening with a reciprocating saw or jigsaw.',
  ),
  step(
    "rt-04",
    "04",
    "Test-fit the cover",
    "Test-fit the exhaust cover in the opening.",
  ),
  step(
    "rt-05",
    "05",
    "Apply exterior-grade silicone",
    'Apply a 1/4" bead of exterior-grade silicone around the perimeter of the back side of the exhaust cover.',
  ),
  step(
    "rt-06",
    "06",
    "Position the cover",
    "Set the exhaust cover into the opening and center it.",
  ),
  step(
    "rt-07",
    "07",
    "Install the first screw",
    "Raise the flap to access the four screw holes inside the cover body. Install one screw into a top hole.",
  ),
  step(
    "rt-08",
    "08",
    "Level and fasten",
    "Level the cover with a small level and install a second screw on the opposite side.",
  ),
  step(
    "rt-09",
    "09",
    "Install remaining screws",
    "Recheck level, then install the remaining two screws.",
  ),
  step(
    "rt-10",
    "10",
    "Connect the duct",
    'Connect the exhaust duct to the exhaust cover with a 4" stainless steel hose clamp. Test operation.',
  ),
];

export const DEFAULT_KODAVENT_METHODS: KodaVentInstallMethod[] = [
  {
    id: "new-construction",
    tab_label: "New Construction",
    heading: "New construction installation",
    intro:
      "Follow the new construction installation instructions when installing on a wall that does not have exterior cladding materials installed.",
    pdf_document_key: "kodavent_new_construction",
    steps: NEW_CONSTRUCTION_STEPS,
    visible: true,
  },
  {
    id: "retrofit",
    tab_label: "Retrofit",
    heading: "Retrofit installation",
    intro:
      "Follow the retrofit installation instructions when replacing an existing exhaust vent or installing on a wall with exterior cladding currently installed.",
    pdf_document_key: "kodavent_retrofit",
    steps: RETROFIT_STEPS,
    visible: true,
  },
];

export const DEFAULT_KODAVENT_INSTALLATION: KodaVentInstallation = {
  heading: "Two ways to install. One considered design.",
  description:
    "Follow the documented steps for new construction or retrofit — then download the full guides.",
  methods: DEFAULT_KODAVENT_METHODS,
  visible: true,
};

export const DEFAULT_KODAVENT_CTA: KodaVentCta = {
  heading: "Ready to specify KodaVent?",
  description:
    "Get in touch with the KODA team to learn more about KodaVent and its availability.",
  cta_label: "Request a quote",
  cta_href: "#quote",
  visible: true,
};

export const DEFAULT_KODAVENT_SEO: KodaVentSeo = {
  title: "KodaVent | 4-Inch Exhaust Vent Cover | KODA Siding",
  description:
    "KodaVent is a 4-inch magnetic exhaust vent cover from KODA Siding, designed for new construction and retrofit installation.",
  og_title: "KodaVent | 4-Inch Exhaust Vent Cover",
  og_description:
    "A 4-inch exhaust vent cover designed with thoughtful installation detailing for new construction and retrofit applications.",
  og_image_media_id: null,
  canonical_path: "/kodavent",
};

export const DEFAULT_PAGE_KODAVENT: PageKodaVent = {
  id: 1,
  hero: DEFAULT_KODAVENT_HERO,
  product_design: DEFAULT_KODAVENT_PRODUCT_DESIGN,
  installed: DEFAULT_KODAVENT_INSTALLED,
  installation: DEFAULT_KODAVENT_INSTALLATION,
  cta: DEFAULT_KODAVENT_CTA,
  seo: DEFAULT_KODAVENT_SEO,
};

export function collectKodaVentMediaIds(page: PageKodaVent): string[] {
  const ids: Array<string | null | undefined> = [
    page.hero?.image_media_id,
    page.product_design?.image_media_id,
    page.installed?.image_media_id,
    page.seo?.og_image_media_id,
  ];

  for (const method of page.installation?.methods ?? []) {
    for (const s of method.steps ?? []) {
      ids.push(s.image_media_id);
    }
  }

  return [
    ...new Set(
      ids.filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
}
