export default function LoadingHomePage() {
  return (
    <div className="min-h-screen bg-[#0b0b0f] text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 pb-20 pt-12 sm:px-8 sm:pt-16">
        <div className="h-10 w-32 animate-pulse rounded-sm bg-white/10" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded-sm bg-white/10" />
          <div className="h-4 w-1/2 animate-pulse rounded-sm bg-white/10" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-md border border-white/10 bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
