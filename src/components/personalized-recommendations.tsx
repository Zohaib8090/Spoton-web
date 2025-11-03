"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generatePersonalizedRecommendations } from '@/ai/flows/personalized-recommendations';
import { usePlayer } from '@/context/player-context';
import { Sparkles, Loader2, Music2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';

export function PersonalizedRecommendations() {
  const { listeningHistory } = usePlayer();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGetRecommendations = async () => {
    if (listeningHistory.length === 0) {
      toast({
        variant: "destructive",
        title: "Not enough history",
        description: "Play some songs first to get personalized recommendations.",
      });
      return;
    }

    setIsLoading(true);
    setRecommendations([]);
    try {
      // Format the listening history into an array of strings as expected by the AI flow.
      const historyAsStrings = listeningHistory.map(song => `${song.title} by ${song.artist}`);
      const result = await generatePersonalizedRecommendations({ listeningHistory: historyAsStrings });
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate recommendations at this time.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearchRecommendation = (recommendation: string) => {
    router.push(`/search?q=${encodeURIComponent(recommendation)}`);
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Personalized Suggestions</AlertTitle>
        <AlertDescription>
          Our AI will recommend songs based on your listening history. The more you listen, the better the recommendations.
        </AlertDescription>
      </Alert>

      <Button onClick={handleGetRecommendations} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Generating..." : "Get Fresh Recommendations"}
      </Button>

      {recommendations.length > 0 && (
        <div className="space-y-2">
            <h3 className="text-lg font-semibold">Here are some tracks you might like:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2 min-w-0">
                            <Music2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{rec}</span>
                        </div>
                         <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleSearchRecommendation(rec)}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
}
