export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in">
      <div className="w-16 h-16 mb-6 rounded-2xl bg-surface border border-surface-border flex items-center justify-center">
        <span className="font-mono text-2xl text-text-muted">/</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-text-muted max-w-md">
        Este módulo está no roadmap e será desenvolvido nas próximas etapas.
      </p>
    </div>
  );
}
