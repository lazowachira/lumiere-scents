import { useState } from "react";
import { Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import { products } from "@/data/products";
import { Product } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";

const scentOptions = ["floral", "woody", "citrus", "spicy", "sweet"];
const occasionOptions = ["casual", "date night", "office", "evening", "special events"];
const personalityOptions = ["bold", "calm", "romantic", "energetic", "mysterious", "elegant"];

const Recommendations = () => {
  const [step, setStep] = useState(0);
  const [scents, setScents] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [personalities, setPersonalities] = useState<string[]>([]);
  const [results, setResults] = useState<Product[] | null>(null);

  const toggleOption = (list: string[], setter: (v: string[]) => void, value: string) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const recommend = () => {
    const scored = products.map((p) => {
      let score = 0;
      if (scents.includes(p.scentFamily)) score += 3;
      p.occasion.forEach((o) => { if (occasions.includes(o)) score += 2; });
      p.personality.forEach((pr) => { if (personalities.includes(pr)) score += 2; });
      p.notesTop.concat(p.notesMiddle, p.notesBase).forEach((n) => {
        scents.forEach((s) => { if (n.toLowerCase().includes(s)) score += 1; });
      });
      return { product: p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    setResults(scored.filter((s) => s.score > 0).slice(0, 5).map((s) => s.product));
    setStep(3);
  };

  const reset = () => {
    setStep(0);
    setScents([]);
    setOccasions([]);
    setPersonalities([]);
    setResults(null);
  };

  const ChipSelect = ({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) => (
    <div className="flex flex-wrap gap-3">
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

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12 animate-fade-in">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h1 className="font-heading text-4xl md:text-5xl mb-4">Find Your Perfect Perfume</h1>
          <p className="text-muted-foreground text-sm">Answer a few questions and we'll recommend fragrances tailored to you.</p>
        </div>

        {step < 3 && (
          <div className="flex gap-2 mb-10 justify-center">
            {[0, 1, 2].map((s) => (
              <div key={s} className={`h-1 w-16 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-surface"}`} />
            ))}
          </div>
        )}

        {step === 0 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="font-heading text-2xl text-center">What scents do you love?</h2>
            <ChipSelect options={scentOptions} selected={scents} onToggle={(v) => toggleOption(scents, setScents, v)} />
            <div className="text-center pt-4">
              <Button onClick={() => setStep(1)} disabled={scents.length === 0} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="font-heading text-2xl text-center">When will you wear it?</h2>
            <ChipSelect options={occasionOptions} selected={occasions} onToggle={(v) => toggleOption(occasions, setOccasions, v)} />
            <div className="text-center pt-4">
              <Button onClick={() => setStep(2)} disabled={occasions.length === 0} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="font-heading text-2xl text-center">How would you describe yourself?</h2>
            <ChipSelect options={personalityOptions} selected={personalities} onToggle={(v) => toggleOption(personalities, setPersonalities, v)} />
            <div className="text-center pt-4">
              <Button onClick={recommend} disabled={personalities.length === 0} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                <Sparkles className="w-4 h-4 mr-2" />
                Get Recommendations
              </Button>
            </div>
          </div>
        )}

        {step === 3 && results && (
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
