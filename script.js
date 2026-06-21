document.addEventListener('DOMContentLoaded', () => {
    
    // 0. Visitor counter dynamic fetch from Backend API
    const visitorEl = document.getElementById('visitor-count-footer');
    if (visitorEl) {
        fetch('/api/visit')
            .then(res => res.json())
            .then(data => {
                if (data && data.count) {
                    visitorEl.textContent = `[ VISITS: ${data.count} ]`;
                }
            })
            .catch(err => {
                console.error('[SYS_ERROR] Failed to connect to Redis/API:', err);
                visitorEl.textContent = `[ VISITS: ERR_CONN ]`;
            });
    }
    
    // 1. Terminal Block Cursor Tracking
    const cursor = document.querySelector('.cursor-block');
    if (cursor && window.matchMedia('(hover: hover)').matches) {
        window.addEventListener('mousemove', (e) => {
            cursor.style.display = 'block';
            cursor.style.left = `${e.clientX + 5}px`;
            cursor.style.top = `${e.clientY + 5}px`;
        });
        
        // Hide cursor when leaving window
        document.addEventListener('mouseleave', () => { cursor.style.display = 'none'; });
        document.addEventListener('mouseenter', () => { cursor.style.display = 'block'; });
    } else if (cursor) {
        cursor.style.display = 'none';
    }

    // 2. Button links
    document.getElementById('download-cv-btn')?.addEventListener('click', () => {
        window.open('./assets/resume.pdf');
    });

    document.getElementById('contact-info-btn')?.addEventListener('click', () => {
        location.href = './#contact';
    });

    document.querySelectorAll('.social-links .icon, .hero-socials .icon').forEach(icon => {
        icon.addEventListener('click', () => {
            if (icon.dataset.href) {
                window.open(icon.dataset.href, '_blank');
            }
        });
    });

    // 2.5 Live Demo modal click interception
    document.querySelectorAll('#projects .cli-btn.primary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const href = btn.getAttribute('href');
            const project = href.includes('uptime') ? 'uptime_kuma' : 'erpnext';
            openCliDemo(project, href);
        });
    });

    document.getElementById('close-modal-btn')?.addEventListener('click', closeDemoModal);
    document.getElementById('demo-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'demo-modal') closeDemoModal();
    });

    // 2.8. Strava Integration Flow
    initStravaBento();

    // 3. Load Badges (Handling PDFs perfectly in sturdy frames)
    loadLocalBadges();
});

let isTyping = false;
let typingTimeout = null;

const demoSequences = {
    erpnext: [
        { type: 'input', text: './test_erpnext_deployment.sh' },
        { type: 'output', text: '[SYS_INFO] Initializing diagnostics sequence for namespace: erpnext...' },
        { type: 'output', text: '[SYS_INFO] Checking local Netplan & routing tables... [ OK ]' },
        { type: 'output', text: '[SYS_INFO] Checking Cloudflare Tunnel daemon (cloudflared)...' },
        { type: 'output', text: '  ● cloudflared.service - cloudflared\n    Active: active (running) since Sat 2026-06-20 11:38:17 EAT\n    Tunnel xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx active at NBO Edge.' },
        { type: 'output', text: '[SYS_INFO] Querying active Kubernetes pods in namespace: erpnext' },
        { type: 'output', text: 'NAME                                      READY   STATUS      RESTARTS   AGE\nerpnext-gunicorn-78b49f889c-sntjx         1/1     Running     2          3d\nerpnext-nginx-688cc74cb9-sdfqj            1/1     Running     2          3d\nerpnext-mariadb-sts-0                     1/1     Running     1          3d\nerpnext-scheduler-798cb86f75-psrf2        1/1     Running     404        3d\nerpnext-socketio-7c54c95d7d-fxd2k         1/1     Running     5          3d\nerpnext-worker-d-8969fd6d8-wp8nm          1/1     Running     404        3d\nerpnext-valkey-cache-6cc6ddcfd5-fwjp5     1/1     Running     1          3d' },
        { type: 'output', text: '[SYS_INFO] Testing local HTTP route at http://localhost:30081...' },
        { type: 'output', text: '  HTTP/1.1 200 OK (Served from Nginx ingress, DB connection active)' },
        { type: 'success', text: '\n[SUCCESS] ERPNext cluster deployment is fully operational! 🟢' }
    ],
    uptime_kuma: [
        { type: 'input', text: './test_uptime_kuma.sh' },
        { type: 'output', text: '[SYS_INFO] Initializing diagnostics sequence for Uptime Kuma...' },
        { type: 'output', text: '[SYS_INFO] Checking hostNetwork bindings... [ OK ] (listening on hostPort 3001)' },
        { type: 'output', text: '[SYS_INFO] Validating hostPath persistent volume mount...' },
        { type: 'output', text: '  /home/phib/uptime-kuma/data/db-config.json ... [ FOUND ]' },
        { type: 'output', text: '[SYS_INFO] Checking Kubernetes pod status:' },
        { type: 'output', text: 'NAME                               READY   STATUS    RESTARTS   AGE\nuptime-kuma-656b4bbbc5-bb6pz       1/1     Running   0          19h' },
        { type: 'output', text: '[SYS_INFO] Simulating ping diagnostics from container namespace:' },
        { type: 'output', text: '  ping -c 3 10.10.30.10 (PBX 01)\n  64 bytes from 10.10.30.10: icmp_seq=1 ttl=64 time=1.84 ms\n  64 bytes from 10.10.30.10: icmp_seq=2 ttl=64 time=1.92 ms\n  3 packets transmitted, 3 received, 0% packet loss\n\n  ping -c 3 10.10.30.11 (PBX 02)\n  64 bytes from 10.10.30.11: icmp_seq=1 ttl=64 time=1.75 ms\n  64 bytes from 10.10.30.11: icmp_seq=2 ttl=64 time=1.81 ms\n  3 packets transmitted, 3 received, 0% packet loss' },
        { type: 'success', text: '\n[SUCCESS] Monitoring routes and PBX pings are fully operational! 🟢' }
    ]
};

function openCliDemo(project, liveUrl) {
    const modal = document.getElementById('demo-modal');
    const termBody = document.getElementById('modal-terminal-body');
    if (!modal || !termBody) return;

    modal.style.display = 'flex';
    termBody.innerHTML = '';
    isTyping = true;
    
    document.body.style.overflow = 'hidden'; // Lock background scroll

    let stepIndex = 0;
    const steps = demoSequences[project];

    function runNextStep() {
        if (!isTyping || stepIndex >= steps.length) {
            isTyping = false;
            // Append final redirection link
            const redirectLine = document.createElement('div');
            redirectLine.className = 'modal-line modal-success';
            redirectLine.innerHTML = `\n[REDIRECT] <a href="${liveUrl}" target="_blank" class="neon-link" style="text-decoration:underline;">CLICK_HERE_TO_OPEN_LIVE_DEMO</a>`;
            termBody.appendChild(redirectLine);
            termBody.scrollTop = termBody.scrollHeight;
            return;
        }

        const step = steps[stepIndex];
        const line = document.createElement('div');
        termBody.appendChild(line);

        if (step.type === 'input') {
            line.className = 'modal-line modal-prompt';
            line.innerHTML = `<span>ronald@cloud-engine:~$</span> `;
            
            let charIndex = 0;
            function typeChar() {
                if (!isTyping) return;
                if (charIndex < step.text.length) {
                    line.innerHTML += step.text[charIndex];
                    charIndex++;
                    termBody.scrollTop = termBody.scrollHeight;
                    typingTimeout = setTimeout(typeChar, 30);
                } else {
                    stepIndex++;
                    typingTimeout = setTimeout(runNextStep, 500);
                }
            }
            typeChar();
        } else {
            if (step.type === 'success') {
                line.className = 'modal-line modal-success';
            } else if (step.type === 'error') {
                line.className = 'modal-line modal-error';
            } else {
                line.className = 'modal-line modal-output';
            }
            line.textContent = step.text;
            termBody.scrollTop = termBody.scrollHeight;
            stepIndex++;
            typingTimeout = setTimeout(runNextStep, 400);
        }
    }

    runNextStep();
}

function closeDemoModal() {
    isTyping = false;
    clearTimeout(typingTimeout);
    const modal = document.getElementById('demo-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = ''; // Unlock background scroll
}

function loadLocalBadges() {
    const container = document.getElementById('badges');
    if (!container) return;
    
    fetch('./assets/badges.json?v=' + new Date().getTime())
        .then(r => { if (!r.ok) throw new Error('Manifest not found'); return r.json(); })
        .then(list => {
            if (!Array.isArray(list) || list.length === 0) return;
            
            const html = list.map(fname => {
                const src = `./assets/${fname}`;
                const name = fname.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
                
                // Route ACE cert to its specific credly URL
                let linkUrl = 'https://www.credly.com/users/ronald-mugume.c99a0f0d/badges';
                if (fname.includes('ace') || fname.includes('AssociateCloudEngineer')) {
                    linkUrl = 'https://www.credly.com/badges/f5d41ba3-970c-4730-88b2-433a6af1f94a/public_url';
                }

                let mediaElement;
                if (fname.toLowerCase().endsWith('.pdf')) {
                    // Force the PDF to fit inside the sturdy box without scrolling.
                    // The #view=Fit param tells the PDF viewer to fit to the box.
                    mediaElement = `<embed src="${src}#view=Fit&toolbar=0&navpanes=0&scrollbar=0" type="application/pdf" class="badge-media" />`;
                } else {
                    mediaElement = `<img src="${src}" alt="${name}" class="badge-media" onerror="this.style.display='none'" />`;
                }

                // Wrap in a perfectly square sturdy frame
                return `
                  <a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="sturdy-badge" title="${name}">
                      ${mediaElement}
                      <!-- Click overlay to prevent embed from swallowing clicks -->
                      <div style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:5;"></div>
                  </a>`;
            }).join('');
            container.innerHTML = html;
        })
        .catch(err => {
            console.error('[SYS_ERROR] Failed to load certs.log:', err);
        });
}

function initStravaBento() {
    const container = document.getElementById('strava-card-container');
    const statusTag = document.getElementById('strava-status-tag');
    if (!container) return;

    // Check query params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('strava_connected') === 'true') {
        localStorage.setItem('strava_connected', 'true');
        // Clean URL parameter
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }

    const isConnected = localStorage.getItem('strava_connected') === 'true';

    if (isConnected) {
        if (statusTag) statusTag.innerHTML = `<span style="color:var(--neon-green); font-weight:700;">[ ONLINE ]</span>`;
        container.innerHTML = `
            <div class="box-content flex-row" style="margin-top: 1rem;">
                <div class="strava-metrics">
                    <div class="strava-stat">
                        <span class="stat-num text-orange">4:32</span>
                        <span class="stat-lbl">KM PACE (10K RUN)</span>
                    </div>
                    <div class="strava-stat">
                        <span class="stat-num">180.4 KM</span>
                        <span class="stat-lbl">MONTHLY VOLUME</span>
                    </div>
                    <div class="strava-stat">
                        <span class="stat-num">58</span>
                        <span class="stat-lbl">VO2 MAX (SUPERIOR)</span>
                    </div>
                </div>
                <div class="strava-route-viz">
                    <svg class="run-path" viewBox="0 0 100 60">
                        <path d="M10,40 Q25,10 40,30 T70,20 T90,50" fill="none" stroke="#ff6b00" stroke-width="2" />
                        <circle cx="90" cy="50" r="3" fill="#ff0000" class="pulse-node-orange" />
                    </svg>
                    <span class="route-label">LAST MARATHON LOGGED IN NAIROBI</span>
                </div>
            </div>
            <div style="text-align: right; margin-top: 1.5rem;">
                <a href="#" id="strava-disconnect-link" style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); text-decoration:underline; cursor:pointer;">[ DISCONNECT_FEED ]</a>
            </div>
        `;

        document.getElementById('strava-disconnect-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('strava_connected');
            initStravaBento();
        });
    } else {
        if (statusTag) statusTag.innerHTML = `<span style="color:var(--text-muted);">[ OFFLINE ]</span>`;
        container.innerHTML = `
            <div class="box-content flex-column" style="justify-content: center; align-items: center; text-align: center; padding: 2rem 0; gap: 1rem; height: 100%;">
                <i class="fa-solid fa-lock" style="font-size: 2.5rem; color: var(--text-muted); opacity: 0.5;"></i>
                <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                    ATHLETE_TELEMETRY_FEED: SECURED
                </div>
                <button class="cli-btn primary" id="strava-connect-btn" style="border-color: var(--neon-orange); color: var(--neon-orange); width: auto; cursor:pointer;">
                    <i class="fa-brands fa-strava"></i> INITIATE_STRAVA_AUTH
                </button>
            </div>
        `;

        document.getElementById('strava-connect-btn')?.addEventListener('click', () => {
            window.location.href = "/api/strava/login";
        });
    }
}
