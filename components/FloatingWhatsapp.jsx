import { FaWhatsapp } from "react-icons/fa";

function FloatingWhatsapp() {
  return (
    <a
      href="https://wa.me/919892371329"
      target="_blank"
      rel="noopener noreferrer"
      className="
        fixed
        bottom-6
        right-6
        z-50
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
      "
    >
      <FaWhatsapp size={34} />
    </a>
  );
}

export default FloatingWhatsapp;