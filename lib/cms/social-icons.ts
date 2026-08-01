import type { IconProps } from "@tabler/icons-react";
import {
  IconBrandDribbble,
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandWhatsapp,
  IconBrandX,
  IconBrandYoutube,
  IconMail,
  IconPhone,
  IconWorld,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

export type SocialIconComponent = ComponentType<IconProps>;

export const SOCIAL_ICON_OPTIONS = [
  { id: "facebook", label: "Facebook", Icon: IconBrandFacebook },
  { id: "instagram", label: "Instagram", Icon: IconBrandInstagram },
  { id: "linkedin", label: "LinkedIn", Icon: IconBrandLinkedin },
  { id: "youtube", label: "YouTube", Icon: IconBrandYoutube },
  { id: "x", label: "X", Icon: IconBrandX },
  { id: "tiktok", label: "TikTok", Icon: IconBrandTiktok },
  { id: "whatsapp", label: "WhatsApp", Icon: IconBrandWhatsapp },
  { id: "github", label: "GitHub", Icon: IconBrandGithub },
  { id: "dribbble", label: "Dribbble", Icon: IconBrandDribbble },
  { id: "mail", label: "Email", Icon: IconMail },
  { id: "phone", label: "Phone", Icon: IconPhone },
  { id: "website", label: "Website", Icon: IconWorld },
] as const;

export type SocialIconId = (typeof SOCIAL_ICON_OPTIONS)[number]["id"];

const iconMap: Record<SocialIconId, SocialIconComponent> = {
  facebook: IconBrandFacebook,
  instagram: IconBrandInstagram,
  linkedin: IconBrandLinkedin,
  youtube: IconBrandYoutube,
  x: IconBrandX,
  tiktok: IconBrandTiktok,
  whatsapp: IconBrandWhatsapp,
  github: IconBrandGithub,
  dribbble: IconBrandDribbble,
  mail: IconMail,
  phone: IconPhone,
  website: IconWorld,
};

export function isSocialIconId(value: string): value is SocialIconId {
  return value in iconMap;
}

export function getSocialIcon(id: string): SocialIconComponent {
  if (isSocialIconId(id)) return iconMap[id];
  return IconWorld;
}
