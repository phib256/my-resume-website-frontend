document.addEventListener('DOMContentLoaded', () => {
    
    // SEO: Dynamic Canonical Link Injection
    (function() {
        const baseUrl = 'https://phib.net';
        let path = window.location.pathname;
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1); // Strip trailing slash
        }
        const canonicalUrl = baseUrl + path; // Ignores search params and hash
        
        let link = document.querySelector("link[rel='canonical']");
        if (!link) {
            link = document.createElement("link");
            link.rel = "canonical";
            document.head.appendChild(link);
        }
        link.href = canonicalUrl;
    })();
    
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
    
    // 1. Terminal Block Cursor Tracking (Optimized with requestAnimationFrame and GPU translate3d)
    const cursor = document.querySelector('.cursor-block');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 1024 || !window.matchMedia('(hover: hover)').matches;
    
    if (cursor && !isMobile) {
        let mouseX = 0;
        let mouseY = 0;
        let isPending = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            if (!isPending) {
                isPending = true;
                requestAnimationFrame(() => {
                    cursor.style.display = 'block';
                    cursor.style.transform = `translate3d(${mouseX + 5}px, ${mouseY + 5}px, 0) translate(-50%, -50%)`;
                    isPending = false;
                });
            }
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
            let project;
            if (href.includes('uptime')) project = 'uptime_kuma';
            else if (href.includes('launchpad')) project = 'launchpad';
            else if (href.includes('#contact')) project = 'managed_saas';
            else project = 'erpnext';
            openCliDemo(project, href);
        });
    });

    document.getElementById('close-modal-btn')?.addEventListener('click', closeDemoModal);
    document.getElementById('demo-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'demo-modal') closeDemoModal();
    });

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
    ],
    launchpad: [
        { type: 'input', text: './init_saas_launchpad.sh --discover-services' },
        { type: 'output', text: '[SYS_INFO] Bootstrapping Multi-Tenant SaaS Gateway...' },
        { type: 'output', text: '[SYS_INFO] Scanning Kubernetes cluster for active B2B architectures...' },
        { type: 'output', text: '  - Directus (Headless CMS) ...... [ READY ]' },
        { type: 'output', text: '  - Vaultwarden (Zero-Trust) ..... [ READY ]' },
        { type: 'output', text: '  - ERPNext (Enterprise ERP) ..... [ READY ]' },
        { type: 'output', text: '  - osTicket (Support Desk) ...... [ READY ]' },
        { type: 'output', text: '[SYS_INFO] Generating secure edge tunnels via Cloudflare... [ OK ]' },
        { type: 'output', text: '[WARNING] Admin login required to provision new tenants.' },
        { type: 'success', text: '\n[SUCCESS] Gateway is active. Want your own private SaaS deployment? Let\'s talk.' }
    ],
    managed_saas: [
        { type: 'input', text: './provision_new_client_tenant.sh --plan=enterprise' },
        { type: 'output', text: '[SYS_INFO] Initializing High-Density SaaS Provisioning...' },
        { type: 'output', text: '[SYS_INFO] Allocating isolated Kubernetes namespaces... [ OK ]' },
        { type: 'output', text: '[SYS_INFO] Deploying requested services:' },
        { type: 'output', text: '  - Directus (Content DB) ........ [ PROVISIONED ]' },
        { type: 'output', text: '  - Vaultwarden (Password Mgr) ... [ PROVISIONED ]' },
        { type: 'output', text: '  - Umami (Analytics) ............ [ PROVISIONED ]' },
        { type: 'output', text: '[SYS_INFO] Configuring Zero-Trust network policies and daily backups... [ OK ]' },
        { type: 'success', text: '\n[SUCCESS] Infrastructure ready. Want your own managed SaaS stack? Let\'s talk.' }
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
            
            if (project === 'managed_saas') {
                redirectLine.innerHTML = `\n[ACTION] <a href="https://www.linkedin.com/in/ronaldmugume" target="_blank" class="neon-link" style="text-decoration:underline;">MESSAGE_ME_ON_LINKEDIN</a>\n<br>[EMAIL] <span class="neon-link" style="text-decoration:underline; cursor:pointer;" onclick="navigator.clipboard.writeText('ronniemugs@gmail.com'); this.innerText='COPIED_TO_CLIPBOARD!';">COPY_EMAIL_ADDRESS</span>`;
            } else if (project === 'launchpad') {
                redirectLine.innerHTML = `\n[ACTION] <a href="https://www.linkedin.com/in/ronaldmugume" target="_blank" class="neon-link" style="text-decoration:underline;">MESSAGE_ME_ON_LINKEDIN</a>\n<br>[EMAIL] <span class="neon-link" style="text-decoration:underline; cursor:pointer;" onclick="navigator.clipboard.writeText('ronniemugs@gmail.com'); this.innerText='COPIED_TO_CLIPBOARD!';">COPY_EMAIL_ADDRESS</span>\n<br><br>[PORTAL] <a href="${liveUrl}" target="_blank" class="neon-link" style="text-decoration:underline; font-size: 0.85em; opacity: 0.8;">OPEN_ADMIN_GATEWAY</a>`;
            } else {
                redirectLine.innerHTML = `\n[REDIRECT] <a href="${liveUrl}" target="_blank" class="neon-link" style="text-decoration:underline;">CLICK_HERE_TO_OPEN_LIVE_DEMO</a>`;
            }
            termBody.appendChild(redirectLine);
            
            // Append Return to Site button
            const returnBtn = document.createElement('button');
            returnBtn.className = 'cli-btn primary';
            returnBtn.style.cssText = 'margin-top: 20px; width: 100%; border: 1px solid var(--neon-green); color: var(--neon-green); background: rgba(0,255,102,0.05); padding: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 0.9rem; transition: all 0.3s;';
            returnBtn.innerText = '[ CLOSE & RETURN TO PORTFOLIO ]';
            returnBtn.onmouseover = () => { returnBtn.style.background = 'var(--neon-green)'; returnBtn.style.color = '#000'; };
            returnBtn.onmouseout = () => { returnBtn.style.background = 'rgba(0,255,102,0.05)'; returnBtn.style.color = 'var(--neon-green)'; };
            returnBtn.onclick = closeDemoModal;
            termBody.appendChild(returnBtn);
            
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


