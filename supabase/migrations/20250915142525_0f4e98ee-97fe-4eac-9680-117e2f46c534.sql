-- Add marketplace functionality to agents table
ALTER TABLE public.agents 
ADD COLUMN is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance when querying marketplace agents
CREATE INDEX idx_agents_published ON public.agents(is_published, published_at DESC) WHERE is_published = true;

-- Update RLS policies to allow reading published agents
CREATE POLICY "Anyone can view published agents in marketplace" 
ON public.agents 
FOR SELECT 
USING (is_published = true);

-- Add comment for documentation
COMMENT ON COLUMN public.agents.is_published IS 'Whether the agent is published to marketplace';
COMMENT ON COLUMN public.agents.published_at IS 'When the agent was published to marketplace';