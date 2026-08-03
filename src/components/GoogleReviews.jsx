import { useEffect, useState } from "react";
import {
  FaPhoneAlt,
  FaStar,
  FaClock,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function GoogleReviews() {
  const [data, setData] = useState(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
  console.log("Fetching Google Reviews...");

  fetch("http://localhost:5000/api/google-reviews")
    .then((res) => {
      console.log("Response Status:", res.status);
      return res.json();
    })
    .then((data) => {
      console.log("Received Data:", data);
      setData(data);
    })
    .catch((err) => {
      console.error("Fetch Error:", err);
    });
}, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % 3);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  if (!data) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "48px",
        background: "red",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      Loading Google Reviews...
    </div>
  );
}

  return (
    <div className="fixed top-0 left-0 w-full z-[60] bg-[#0F172A] border-b border-slate-700">

      <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-8">

        {/* LEFT */}

        <div className="flex items-center gap-6">

          <a
            href="tel:+919892371329"
            className="flex items-center gap-2 text-sm text-white hover:text-amber-400 transition"
          >
            <FaPhoneAlt className="text-amber-400" />
            +91 98923 71329
          </a>

          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-300">
            <FaClock className="text-amber-400" />
            Mon–Sat : 10 AM – 9 PM
          </div>

        </div>

        {/* CENTER */}

        <div className="relative hidden md:flex h-6 w-[420px] items-center justify-center overflow-hidden">

          <div
            key={slide}
            className="absolute flex items-center gap-3 animate-trustFade"
          >

            {slide === 0 && (
              <>
                <div className="flex text-yellow-400 gap-1">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>

                <span className="font-semibold text-white">
                  {data.rating}
                </span>

                <span className="text-slate-300">
                  Google Rating
                </span>

                <span className="text-slate-500">
                  •
                </span>

                <span className="text-slate-300">
                  {data.userRatingCount} Reviews
                </span>
              </>
            )}

            {slide === 1 && (
              <span className="text-white font-medium tracking-wide">
                🏡 Trusted Real Estate Experts Since 1988
              </span>
            )}

            {slide === 2 && (
              <span className="text-white font-medium tracking-wide">
                📍 Serving Mumbai's Western Suburbs Since 1988
              </span>
            )}

          </div>

        </div>

        {/* RIGHT */}

        <div>

          <a
            href="https://g.page/r/CfnKMudqeVu7EBk/review"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <FcGoogle className="text-xl" />
            Review us on Google
          </a>

        </div>

      </div>

    </div>
  );
}