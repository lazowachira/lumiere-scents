import { useState } from "react";
import { Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";

const scentOptions = ["floral", "woody", "citrus", "spicy", "sweet", "fresh"];

const climateOptions = [
  { label: "Nairobi cool", value: "cool", scents: ["woody", "spicy", "sweet"] },
  { label: "Mombasa heat", value: "hot", scents: ["citrus", "fresh", "floral"] },
  { label: "Highland chill", value: "cold", scents: ["spicy", "sweet", "woody"] },
  { label: "Savanna warmth", value: "warm", scents: ["citrus", "floral", "fresh"] },
];

const occasionOptions = [
  "Sunday brunch",
  "Nairobi nightlife",
  "office / CBD hustle",
  "date night",
  "safari / outdoor",
  "church / harambee",
  "wedding / dowry ceremony",
];

const personalityOptions = ["bold", "calm", "romantic", "energetic", "mysterious", "elegant"];

const budgetOptions = [
  { label: "Under KSh 15,000", min: 0, max: 15000 },
  { label: "KSh 15,000 – 25,000", min: 15000, max: 25000 },
  { label: "KSh 25,000 – 35,000", min: 25000, max: 35000 },
  { label: "Over KSh 35,000", min: 35000, max: Infinity },
] as const;

type BudgetOption = typeof budgetOptions[number];

const occasionMap: Record<string, string[]> = {
  "Sunday brunch": ["casual"],
  "Nairobi nightlife": ["evening", "date night"],
  "office / CBD hustle": ["office"],
  "date night": ["date night"],
  "safari / outdoor": ["casual", "outdoor", "beach", "daytime"],
  "church / harambee": ["formal", "special events"],
  "wedding / dowry ceremony": ["special events", "formal"],
};

const Recommendations = () => {
  const { data: products = [] } = useProducts();
  const [step, setStep] = useState(0);
  const [scents, setScents] = useState<string[]>([]);
  const [climate, setClimate] = useState<string | null>(null);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [personalities, setPersonalities] = useState<string[]>([]);
  const [budget, setBudget] = useState<{ min: number; max: number } | null>(null);
  const [results, setResults] = useState<Product[] | null>(null);

  const toggleOption = (list: string[], setter: (v: string[]) => void, value: string) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const recommend = () => {
    // Merge climate-preferred scents with user's scent picks
    const climateScents = climateOptions.find((c) => c.value === climate)?.scents || [];
    const allScents = [...new Set([...scents, ...climateScents])];

    // Map Kenyan occasions to product occasion tags
    const mappedOccasions = occasions.flatMap((o) => occasionMap[o] || []);

    const scored = products
      .filter((p) => {
        if (!budget) return true;
        return p.price >= budget.min && p.price < budget.max;
      })
      .map((p) => {
        let score = 0;
        if (allScents.includes(p.scentFamily)) score += 3;
        p.occasion.forEach((o) => { if (mappedOccasions.includes(o)) score += 2; });
        p.personality.forEach((pr) => { if (personalities.includes(pr)) score += 2; });
        p.notesTop.concat(p.notesMiddle, p.notesBase).forEach((n) => {
          allScents.forEach((s) => { if (n.toLowerCase().includes(s)) score += 1; });
        });
        return { product: p, score };
      });

    scored.sort((a, b) => b.score - a.score);
    setResults(scored.filter((s) => s.score > 0).slice(0, 6).map((s) => s.product));
    setStep(5);
  };

  const reset = () => {
    setStep(0);
    setScents([]);
    setClimate(null);
    setOccasions([]);
    setPersonalities([]);
    setBudget(null);
    setResults(null);
  };

  const totalSteps = 5;

  const ChipSelect = ({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) => (
    <div className="flex flex-wrap gap-3 justify-center">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={`px-4 py-2 rounded-full text-sm capitalize transition-all ${
            selected.includes(opt)
              ? "bg-gradient-gold text-primary-foreground shadow-gold"
              : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-gold/10"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const SingleSelect = ({ options, selected, onSelect }: { options: { label: string; value: string }[]; selected: string | null; onSelect: (v: string) => void }) => (
    <div className="flex flex-wrap gap-3 justify-center">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`px-4 py-2 rounded-full text-sm transition-all ${
            selected === opt.value
              ? "bg-gradient-gold text-primary-foreground shadow-gold"
              : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-gold/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12 animate-fade-in">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h1 className="font-heading text-4xl md:text-5xl mb-4">Find Your Perfect Perfume</h1>
          <p className="text-muted-foreground text-sm">Answer a few questions and we'll recommend fragrances tailored to you in Kenya.</p>
        </div>

        {step < totalSteps && (
          <div className="flex gap-2 mb-10 justify-center">
            {Array.from({ length: totalSteps }).map((_, s) => (
              <div key={s} className={`h-1 w-12 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-surface"}`} />
            ))}
          </div>
        )}

        {/* Step 0: Scent preference */}
        {step === 0 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="font-heading text-2xl text-center">What scents do you love?</h2>
            <p className="text-muted-foreground text-center text-sm">Pick one or more scent families you're drawn to.</p>
            <ChipSelect options={scentOptions} selected={scents} onToggle={(v) => toggleOption(scents, setScents, v)} />
            <div className="text-center pt-4">
              <Button onClick={() => setStep(1)} disabled={scents.length === 0} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Kenya climate */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="font-heading text-2xl text-center">What's your typical weather?</h2>
            <p className="text-muted-foreground text-center text-sm">Kenya's climate varies — pick the one closest to where you live or spend most of your time.</p>
            <SingleSelect
              options={climateOptions.map((c) => ({ label: c.label, value: c.value }))}
              selected={climate}
              onSelect={setClimate}
            />
            <div className="text-center pt-4">
              <Button onClick={() => setStep(2)} disabled={!climate} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Kenyan occasions */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="font-heading text-2xl text-center">When will you wear it?</h2>
            <p className="text-muted-foreground text-center text-sm">Select the occasions that match your lifestyle in Kenya.</p>
            <ChipSelect options={occasionOptions} selected={occasions} onToggle={(v) => toggleOption(occasions, setOccasions, v)} />
            <div className="text-center pt-4">
              <Button onClick={() => setStep(3)} disabled={occasions.length === 0} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Personality */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="font-heading text-2xl text-center">How would you describe yourself?</h2>
            <p className="text-muted-foreground text-center text-sm">Choose the traits that best represent you.</p>
            <ChipSelect options={personalityOptions} selected={personalities} onToggle={(v) => toggleOption(personalities, setPersonalities, v)} />
            <div className="text-center pt-4">
              <Button onClick={() => setStep(4)} disabled={personalities.length === 0} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Budget in KSh */}
        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="font-heading text-2xl text-center">What's your budget?</h2>
            <p className="text-muted-foreground text-center text-sm">Choose a price range that works for you in Kenya Shillings.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {budgetOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setBudget(opt)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    budget?.label === opt.label
                      ? "bg-gradient-gold text-primary-foreground shadow-gold"
                      : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-gold/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="text-center pt-4">
              <Button onClick={recommend} disabled={!budget} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                <Sparkles className="w-4 h-4 mr-2" />
                Get Recommendations
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {step === 5 && results && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl mb-2">Your Perfect Matches</h2>
              <p className="text-muted-foreground text-sm">Based on your preferences, we recommend these fragrances.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
            {results.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No exact matches found. Try different preferences!</p>
            )}
            <div className="text-center mt-10">
              <Button onClick={reset} variant="outline" className="border-gold/30 hover:bg-surface">
                <RotateCcw className="w-4 h-4 mr-2" /> Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
