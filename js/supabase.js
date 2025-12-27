(function () {

  const SUPABASE_URL = "https://bpfqaydoopbjfzasgamu.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_lQm9e9OVzJR9iU0uNlBSOg_zid5dFB7";

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  script.onload = () => {

  window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("✅ Supabase conectado");

  // AVISAR que ya está listo
  window.dispatchEvent(new Event("supabase-ready"));
  };

  document.head.appendChild(script);

})();