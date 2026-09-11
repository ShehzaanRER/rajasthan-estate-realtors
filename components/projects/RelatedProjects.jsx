import ProjectCard from "./ProjectCard";
import CardSlider from "../ui/CardSlider";

function RelatedProjects({ projects }) {
  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
        <h2 className="mb-8 font-serif text-3xl text-[#081221]">
          Related projects
        </h2>

        {/* Matches Similar properties on the property detail page. */}
        <CardSlider label="related project">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </CardSlider>
      </div>
    </section>
  );
}

export default RelatedProjects;
