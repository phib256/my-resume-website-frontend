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
    if (cursor) {
        window.addEventListener('mousemove', (e) => {
            cursor.style.left = `${e.clientX + 5}px`;
            cursor.style.top = `${e.clientY + 5}px`;
        });
        
        // Hide cursor when leaving window
        document.addEventListener('mouseleave', () => { cursor.style.display = 'none'; });
        document.addEventListener('mouseenter', () => { cursor.style.display = 'block'; });
    }

    // 2. Button links
    document.getElementById('download-cv-btn')?.addEventListener('click', () => {
        window.open('./assets/resume.pdf');
    });

    document.getElementById('contact-info-btn')?.addEventListener('click', () => {
        location.href = './#contact';
    });

    document.querySelectorAll('.social-links .icon').forEach(icon => {
        icon.addEventListener('click', () => {
            if (icon.dataset.href) {
                window.open(icon.dataset.href, '_blank');
            }
        });
    });

    // 3. Load Badges (Handling PDFs perfectly in sturdy frames)
    loadLocalBadges();
});

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
