import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Battery, Smile, Droplets, Dumbbell, Utensils, Target, BookOpen, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hoje() {
  const navigate = useNavigate();
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState(3);
  const [water, setWater] = useState(0);
  const [victory, setVictory] = useState("");
  const [improvement, setImprovement] = useState("");

  const [habits, setHabits] = useState([
    { id: 1, name: "Leitura 15 min", done: false, icon: BookOpen },
    { id: 2, name: "Treino do dia", done: false, icon: Dumbbell },
    { id: 3, name: "Aderência Dieta", done: false, icon: Utensils },
    { id: 4, name: "Foco Profissional", done: false, icon: Target },
  ]);

  const toggleHabit = (id: number) => {
    setHabits(habits.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const handleSave = () => {
    console.log("Salvando check-in:", { energy, mood, water, habits, victory, improvement });
    // Por enquanto apenas navegamos de volta, no futuro salvaremos no Firebase
    navigate("/");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Check-in Diário</div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary">Hoje, 18 de Março</h1>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          Salvar Check-in
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Quick Metrics & Sliders */}
        <div className="space-y-8">
          
          {/* Energy & Mood */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-secondary mb-6">Estado Interno</h2>
            
            <div className="space-y-8">
              {/* Energia */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-text-muted font-medium">
                    <Battery className="w-5 h-5" />
                    Energia
                  </div>
                  <span className="font-mono font-bold text-primary">{energy}/5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={`energy-${val}`}
                      onClick={() => setEnergy(val)}
                      className={cn(
                        "flex-1 h-12 rounded-xl border transition-all",
                        energy >= val 
                          ? "bg-primary border-primary text-white shadow-sm" 
                          : "bg-background border-surface-border text-text-muted hover:border-primary/50"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Humor */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-text-muted font-medium">
                    <Smile className="w-5 h-5" />
                    Humor
                  </div>
                  <span className="font-mono font-bold text-primary">{mood}/5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={`mood-${val}`}
                      onClick={() => setMood(val)}
                      className={cn(
                        "flex-1 h-12 rounded-xl border transition-all",
                        mood >= val 
                          ? "bg-primary border-primary text-white shadow-sm" 
                          : "bg-background border-surface-border text-text-muted hover:border-primary/50"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Water Tracker */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl font-semibold text-secondary flex items-center gap-2">
                <Droplets className="w-6 h-6 text-blue-500" />
                Água
              </h2>
              <span className="font-mono font-bold text-primary">{water}L / 3L</span>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setWater(Math.max(0, water - 0.5))}
                className="w-12 h-12 rounded-full border border-surface-border flex items-center justify-center text-text-muted hover:bg-background transition-colors"
              >
                -
              </button>
              <div className="flex-1 bg-background rounded-full overflow-hidden border border-surface-border relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, (water / 3) * 100)}%` }}
                />
              </div>
              <button 
                onClick={() => setWater(water + 0.5)}
                className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors font-medium"
              >
                +
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Habits & Text Inputs */}
        <div className="space-y-8">
          
          {/* Habits Checklist */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-secondary mb-6">Checklist Diário</h2>
            <div className="space-y-3">
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200",
                    habit.done 
                      ? "bg-primary text-white border-primary shadow-md" 
                      : "bg-background border-surface-border text-text-main hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <habit.icon className={cn("w-5 h-5", habit.done ? "text-white/80" : "text-text-muted")} />
                    <span className="font-medium">{habit.name}</span>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors",
                    habit.done ? "border-white bg-white text-primary" : "border-surface-border"
                  )}>
                    {habit.done && <Check className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reflections */}
          <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm space-y-6">
            <div>
              <label className="flex items-center gap-2 font-serif text-xl font-semibold text-secondary mb-3">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Maior vitória do dia
              </label>
              <input 
                type="text" 
                value={victory}
                onChange={(e) => setVictory(e.target.value)}
                placeholder="O que você fez de melhor hoje?"
                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 font-serif text-xl font-semibold text-secondary mb-3">
                <Target className="w-5 h-5 text-primary" />
                Ajuste para amanhã
              </label>
              <input 
                type="text" 
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                placeholder="Onde você precisa melhorar?"
                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
