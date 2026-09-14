function CardSkeleton() {
  return (
    <div className="animate-pulse border border-slate-200 bg-white">
      <div className="h-[300px] bg-slate-100" />
      <div className="space-y-3 p-6">
        <div className="h-3 w-1/3 bg-slate-100" />
        <div className="h-5 w-3/4 bg-slate-100" />
        <div className="h-3 w-1/2 bg-slate-100" />
        <div className="h-10 bg-slate-100" />
      </div>
    </div>
  );
}

export default function ProjectsLoading() {
  return (
    <main className="bg-white">
      <section className="bg-[#081221] py-20 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <div className="h-4 w-40 animate-pulse bg-white/10" />
          <div className="mt-6 h-12 w-2/3 animate-pulse bg-white/10" />
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
