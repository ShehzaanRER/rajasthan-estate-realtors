import ProjectCard from "./ProjectCard";

function RelatedProjects({ projects }) {
  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
        <div className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-[#B8862F]" />
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
              Related Projects
            </p>
          </div>
          <h2 className="font-serif text-4xl text-[#081221] sm:text-5xl">
            You May Also Like
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedProjects;
