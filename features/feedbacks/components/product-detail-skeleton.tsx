export function ProductDetailSkeleton() {
  return (
    <div aria-busy="true" className="bg-paper text-ink">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <p role="status" className="sr-only">
          Carregando produto…
        </p>

        <div className="h-3 w-40 animate-pulse motion-reduce:animate-none bg-line" />

        <div className="mt-8 grid gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <div className="aspect-[4/3] animate-pulse motion-reduce:animate-none border border-line bg-paper-raised" />

          <div className="flex flex-col gap-4 lg:py-1">
            <div className="h-3 w-24 animate-pulse motion-reduce:animate-none bg-line" />
            <div className="h-10 w-4/5 animate-pulse motion-reduce:animate-none bg-line" />
            <div className="mt-2 h-4 w-full animate-pulse motion-reduce:animate-none bg-line/70" />
            <div className="h-4 w-11/12 animate-pulse motion-reduce:animate-none bg-line/70" />
            <div className="h-4 w-2/3 animate-pulse motion-reduce:animate-none bg-line/70" />
            <div className="mt-6 h-9 w-28 animate-pulse motion-reduce:animate-none bg-line" />
            <div className="mt-8 border-t border-line pt-6">
              <div className="h-12 w-32 animate-pulse motion-reduce:animate-none bg-line" />
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-12 border-t border-ink/15 pt-10 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          <div className="flex flex-col gap-6">
            <div className="h-7 w-36 animate-pulse motion-reduce:animate-none bg-line" />
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex gap-4 border-t border-line pt-6">
                <div className="size-10 shrink-0 animate-pulse motion-reduce:animate-none rounded-full bg-line" />
                <div className="flex flex-1 flex-col gap-3">
                  <div className="h-3 w-32 animate-pulse motion-reduce:animate-none bg-line" />
                  <div className="h-4 w-full animate-pulse motion-reduce:animate-none bg-line/70" />
                  <div className="h-4 w-3/4 animate-pulse motion-reduce:animate-none bg-line/70" />
                </div>
              </div>
            ))}
          </div>

          <div className="h-72 animate-pulse motion-reduce:animate-none border border-line bg-paper-raised" />
        </div>
      </div>
    </div>
  );
}
