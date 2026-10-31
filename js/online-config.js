// The Supabase project this copy of Neuro Arena plays online through. Anyone who opens the game connects to it
// automatically and only has to pick a username. The anon key is meant to be public: what it allows is limited by
// the rules in supabase/online.sql. (Never put the service_role or secret key here.)
// To use your own project instead, replace both values, or clear them to have players paste their own.
const ONLINE_DEFAULT = {
  url: 'https://atnyhqxtdxfcbhdyqliq.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bnlocXh0ZHhmY2JoZHlxbGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0Nzc4OTgsImV4cCI6MjEwOTA1Mzg5OH0.Wz35fOMi10IvHQHU1as9yQ57SflAjK6ocm3AojqBlpU',
};
