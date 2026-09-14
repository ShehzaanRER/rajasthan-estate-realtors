export type PublicPartnerLogo = {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  /**
   * True for vector uploads. next/image cannot resize an SVG, and running one
   * through the optimizer would rasterise it — the opposite of what a logo
   * strip wants — so these are served as-is.
   */
  isVector: boolean;
};

export type PublicChannelPartner = {
  id: number;
  name: string;
  websiteUrl: string | null;
  logo: PublicPartnerLogo;
};
