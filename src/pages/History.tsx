import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PerspectiveHeader from '@/components/PerspectiveHeader';
import { useAuth } from '@/contexts/AuthContext';
import { loadUserDebates } from '@/lib/supabase-helpers';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

const History = () => {
  const [debates, setDebates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchDebates = async () => {
      try {
        const data = await loadUserDebates();
        console.log('Loaded debates:', data);
        setDebates(data);
      } catch (error) {
        console.error('Error loading debates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDebates();
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PerspectiveHeader />
        <main className="flex-1 py-8 container">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your perspective history...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PerspectiveHeader />

      <main className="flex-1 py-8 container">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Your Perspective History</h1>
              <p className="text-muted-foreground">
                Review and continue your previous perspective sessions
              </p>
            </div>
          </div>

          {debates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No perspective sessions yet</h3>
                  <p>Start exploring different viewpoints by creating your first session!</p>
                </div>
                <Button onClick={() => navigate('/')}>
                  Create Your First Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {debates.map((debate) => (
                <Card key={debate.debate_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{debate.topic}</CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(debate.created_at), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {debate.mode === 'standard'
                              ? `${debate.personas.length} personas`
                              : `${debate.personas.length} participants`}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={debate.mode === 'debate' ? 'default' : 'secondary'}>
                          {debate.mode}
                        </Badge>
                        <Badge variant={debate.status === 'ongoing' ? 'outline' : 'secondary'}>
                          {debate.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(debate.personas) && debate.personas.length > 0 ? (
                          <>
                            {debate.personas.slice(0, 3).map((persona: any, idx: number) => (
                              <Badge key={persona.persona_id || persona.id || idx} variant="outline" className="text-xs">
                                {persona.name}
                              </Badge>
                            ))}
                            {debate.personas.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{debate.personas.length - 3} more
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">No personas</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (debate.mode === 'standard') {
                            navigate(`/standard/${debate.interaction_id}`);
                          } else {
                            navigate(`/debate/${debate.debate_id}`);
                          }
                        }}
                      >
                        Continue Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
