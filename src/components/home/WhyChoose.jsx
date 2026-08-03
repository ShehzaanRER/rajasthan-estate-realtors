import {
  Home,
  BadgeCheck,
  Users,
  Building2,
} from "lucide-react";

function WhyChoose() {
  const items = [
    {
      icon: <BadgeCheck size={36} />,
      title: "Since 1988",
      text: "Over 35 years of trusted real estate expertise in Mumbai.",
    },
    {
      icon: <Home size={36} />,
      title: "1000+ Properties",
      text: "Residential, commercial and investment opportunities.",
    },
    {
      icon: <Users size={36} />,
      title: "Personal Guidance",
      text: "One-to-one consultation from search to registration.",
    },
    {
      icon: <Building2 size={36} />,
      title: "Local Specialists",
      text: "Experts in Jogeshwari, Andheri, Goregaon and Mira Road.",
    },
  ];

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-slate-900">
            Why Choose Rajasthan Estate Realtors?
          </h2>

          <p className="mt-4 text-slate-600">
            Trusted by families and investors across Mumbai for more than three decades.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {items.map((item, index) => (

            <div
              key={index}
              className="rounded-2xl bg-white p-8 shadow-md transition hover:-translate-y-2 hover:shadow-xl"
            >

              <div className="mb-5 text-amber-500">
                {item.icon}
              </div>

              <h3 className="text-xl font-semibold">
                {item.title}
              </h3>

              <p className="mt-3 text-slate-600">
                {item.text}
              </p>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}

export default WhyChoose;