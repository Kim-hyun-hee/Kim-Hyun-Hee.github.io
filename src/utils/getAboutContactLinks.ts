type ContactConfig = {
  site: { profile?: string };
  socials: { name: string; url: string; linkTitle?: string }[];
};

export function getAboutContactLinks({ site, socials }: ContactConfig) {
  return {
    github:
      socials.find(social => social.name.toLowerCase() === "github")?.url ??
      site.profile,
    email: socials.find(social =>
      social.url.toLowerCase().startsWith("mailto:")
    ),
  };
}
