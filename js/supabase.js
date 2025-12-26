(function () {

  const SUPABASE_URL = "https://bpfqaydoopbjfzasgamu.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_lQm9e9OVzJR9iU0uNlBSOg_zid5dFB7";

  // cargar librería desde CDN global
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.onload = () => {
    window.supabase = supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    console.log("✅ Supabase conectado");
  };

  document.head.appendChild(script);

})();
