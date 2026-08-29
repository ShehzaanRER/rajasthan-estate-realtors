import Navbar from "../../components/layouts/Navbar";
import Footer from "../../components/layouts/Footer";
import "../../src/index.css";

export const metadata = {
  title: "Rajasthan Estate Realtors | Real Estate in Mumbai",
  description:
    "Residential and commercial real estate across Mumbai's Western Suburbs, backed by local knowledge and a family legacy since 1988.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}