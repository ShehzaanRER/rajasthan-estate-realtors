import { FaWhatsapp } from "react-icons/fa";
import { CONTACT_WHATSAPP_NUMBER } from "../lib/siteConfig";

/**
 * The floating button is site-wide, so its message stays generic. Property and
 * project pages have their own WhatsApp actions carrying the listing title,
 * location and RER ID — those must not be flattened into this one.
 */
const GENERIC_WHATSAPP_TEXT = encodeURIComponent(
  "Hello Rajasthan Estate Realtors, I would like to discuss a property requirement.",
);

function FloatingWhatsapp() {
  return (
    <a
      href={`https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${GENERIC_WHATSAPP_TEXT}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Rajasthan Estate Realtors on WhatsApp"
      className="
        fixed
        bottom-6
        right-6
        z-40
        flex
        h-16
        w-16
        items-center
        justify-center
        rounded-full
        bg-green-500
        text-white
        shadow-xl
        transition
        duration-300
        hover:scale-110
        hover:bg-green-600
        md:z-50
      "
    >
      <FaWhatsapp size={34} aria-hidden="true" />
    </a>
  );
}

export default FloatingWhatsapp;
