/* =========================================================
   promme — config.js
   Supabase 프로젝트를 만든 뒤 아래 두 값을 채우면 로그인이 켜집니다.
   (Supabase 대시보드 → Project Settings → API)

   - supabaseUrl     : Project URL        예) https://abcd1234.supabase.co
   - supabaseAnonKey : anon / publishable key  (공개용 키라 여기에 넣어도 안전합니다.
                       service_role / secret 키는 절대 넣지 마세요.)
   - google          : Supabase에서 Google 로그인을 켰다면 true
   ========================================================= */
window.PROMME_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  google: false,
};
