-- Allow public (unauthenticated) read access to scenario_runs
CREATE POLICY "Public can view all runs" ON public.scenario_runs
  FOR SELECT TO anon USING (true);

-- Allow public read access to scenario_run_events
CREATE POLICY "Public can view all run events" ON public.scenario_run_events
  FOR SELECT TO anon USING (true);