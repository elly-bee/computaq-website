    const nav = document.getElementById('mainNav');
    const ANCHORS = ['home','about','services','apps','why','clients','contact'];
    const isResponsive = () => document.documentElement.classList.contains('fp-responsive');
    const setNavSolid = (solid) => nav && nav.classList.toggle('scrolled', solid);

    /* ---- Day / night theme -------------------------------------------------- */
    (function(){
      const root = document.documentElement;
      const btn = document.getElementById('themeToggle');
      function syncIcon(){
        const light = root.getAttribute('data-theme') === 'light';
        const i = btn && btn.querySelector('i');
        if(i) i.className = light ? 'bi bi-moon-stars' : 'bi bi-sun';
        if(btn) btn.setAttribute('aria-pressed', String(light));
      }
      function setTheme(t){
        root.setAttribute('data-theme', t);
        try{ localStorage.setItem('cq-theme', t); }catch(e){}
        syncIcon();
      }
      syncIcon();
      if(btn){
        btn.addEventListener('click', () => {
          setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
        });
      }
      // Follow the OS setting only if the user hasn't chosen one manually
      if(window.matchMedia){
        matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
          let saved = null; try{ saved = localStorage.getItem('cq-theme'); }catch(_){}
          if(!saved){ root.setAttribute('data-theme', e.matches ? 'light' : 'dark'); syncIcon(); }
        });
      }
    })();

    /* ---- Animations are SELF-CONTAINED (do not depend on fullPage) -------- */
    function revealEl(el){
      if(!el || el.classList.contains('in')) return;
      el.classList.add('in');
    }
    function runCounter(el){
      if(!el || el.dataset.done) return;
      el.dataset.done = '1';
      const target = +el.dataset.count, suffix = el.dataset.suffix || '';
      let n = 0; const step = Math.max(1, Math.ceil(target / 38));
      const t = setInterval(() => { n += step; if(n >= target){ n = target; clearInterval(t); } el.textContent = n + suffix; }, 28);
    }
    function revealAll(){
      document.querySelectorAll('.reveal').forEach(revealEl);
      document.querySelectorAll('[data-count]').forEach(runCounter);
    }

    // Stagger reveals within each section for a nicer cascade
    document.querySelectorAll('.section').forEach(sec => {
      sec.querySelectorAll('.reveal').forEach((el,i) => { el.style.transitionDelay = (i % 4) * 90 + 'ms'; });
    });

    // IntersectionObserver works whether fullPage is active, in responsive
    // (normal-scroll) mode, or not running at all.
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if(e.isIntersecting){ revealEl(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));

      const cio = new IntersectionObserver((entries) => {
        entries.forEach(e => { if(e.isIntersecting){ runCounter(e.target); cio.unobserve(e.target); } });
      }, { threshold: 0.5 });
      document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));
    } else {
      revealAll(); // very old browsers: just show everything
    }

    // Reveal whatever is on screen at first paint immediately (e.g. the hero)
    requestAnimationFrame(() => {
      document.querySelectorAll('.section[data-anchor="home"] .reveal').forEach(revealEl);
    });

    /* ---- fullPage.js init is guarded so a load failure can't blank page --- */
    let fpStarted = false;
    try {
      if(typeof fullpage === 'undefined') throw new Error('fullPage.js did not load');
      new fullpage('#fullpage', {
        anchors: ANCHORS,
        menu: '#navMenu',
        navigation: true,
        navigationPosition: 'right',
        navigationTooltips: ['Home','About','Services','Apps','Why Us','Clients','Contact'],
        showActiveTooltip: true,
        scrollOverflow: true,
        scrollOverflowReset: true,
        responsiveWidth: 992,
        paddingTop: '76px',
        verticalCentered: true,
        scrollingSpeed: 800,
        easingcss3: 'cubic-bezier(0.86,0,0.07,1)',
        fitToSection: true,
        afterRender: function(){ setNavSolid(false); },
        afterLoad: function(origin, destination){
          setNavSolid(destination.index !== 0);
          destination.item.querySelectorAll('.reveal').forEach(revealEl);
          if(destination.anchor === 'why') destination.item.querySelectorAll('[data-count]').forEach(runCounter);
        }
      });
      fpStarted = true;
    } catch (err) {
      console.warn('[ComputaQ] fullPage.js unavailable — falling back to normal scrolling.', err);
      document.documentElement.classList.add('fp-failed'); // restores section spacing (see CSS)
      revealAll();
    }

    // Failsafe: if fullPage never enabled within 1.5s, ensure normal scroll + visible content.
    setTimeout(() => {
      if(!document.documentElement.classList.contains('fp-enabled')){
        document.documentElement.classList.add('fp-failed');
        revealAll();
      }
    }, 1500);

    // Navbar background while normal-scrolling (responsive or fallback mode)
    window.addEventListener('scroll', () => {
      if(isResponsive() || !document.documentElement.classList.contains('fp-enabled')) setNavSolid(window.scrollY > 40);
    }, { passive:true });

    // Footer + brand links → move to section (works in both modes)
    document.querySelectorAll('footer a[href^="#"], a.brand-mark[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        if(!ANCHORS.includes(id)) return;
        e.preventDefault();
        if(window.fullpage_api && !isResponsive()) fullpage_api.moveTo(id);
        else { const t = document.querySelector('[data-anchor="'+id+'"]'); if(t) t.scrollIntoView({behavior:'smooth'}); }
      });
    });

    // Close mobile menu after tapping a nav link
    document.querySelectorAll('#navMenu .nav-link, #navMenu .btn').forEach(l => {
      l.addEventListener('click', () => {
        const c = document.getElementById('navMenu');
        if(window.bootstrap && c.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(c).hide();
      });
    });

    // Contact form validation + confirmation
    document.querySelectorAll('.needs-validation').forEach(form => {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        if(form.checkValidity()){
          document.getElementById('formAlert').classList.remove('d-none');
          form.reset(); form.classList.remove('was-validated');
        } else { form.classList.add('was-validated'); }
      });
    });

    document.getElementById('year').textContent = new Date().getFullYear();

    // Recalculate fullPage when modals close (content/scroll state can shift)
    document.querySelectorAll('.modal').forEach(m => {
      m.addEventListener('hidden.bs.modal', () => { if(window.fullpage_api) fullpage_api.reBuild(); });
    });
