import { FaWhatsapp } from "react-icons/fa";

function FloatingWhatsapp() {
  return (
    <a
      href="https://wa.me/919892371329"
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
