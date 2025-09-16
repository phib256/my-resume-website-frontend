function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}



// Visitor counter placeholder: set a static value to confirm the script is loaded
document.addEventListener('DOMContentLoaded', () => {
    const visitorEl = document.getElementById('visitor-count');
    if (visitorEl) {
        // Static value for now; backend will provide a real number later
        visitorEl.textContent = 'Visitors: 123';
    }
    // Load local badges first (so they are visible even if remote discovery fails)
    loadLocalBadges();
    // Try loading Credly badges (frontend-only attempt) as an augmentation if available
    loadCredlyBadges();
});

function loadLocalBadges() {
    const container = document.getElementById('badges');
    if (!container) return;
    fetch('./assets/badges.json')
        .then(r => { if (!r.ok) throw new Error('Could not load badges manifest'); return r.json(); })
        .then(list => {
            if (!Array.isArray(list) || list.length === 0) {
                // nothing local
                return;
            }
            const html = list.map(fname => {
                const src = `./assets/${fname}`;
                const name = fname.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
                return `
                  <div class="badge-card" data-badge-name="${name}">
                      <img src="${src}" alt="${name}" onerror="this.style.display='none'" />
                  </div>`;
            }).join('');
            container.innerHTML = html;
            // Make the whole badges area clickable and link to Credly profile
            container.style.cursor = 'pointer';
            container.onclick = () => {
                window.open('https://www.credly.com/users/ronald-mugume.c99a0f0d/badges', '_blank', 'noopener');
            };
        })
        .catch(err => {
            console.warn('Failed to load local badges manifest:', err);
        });
}

function loadCredlyBadges() {
    const credlyUrl = 'https://www.credly.com/users/ronald-mugume.c99a0f0d/badges';
    const container = document.getElementById('badges');
    if (!container) return;
    container.textContent = 'Loading badges...';

    // Try fetching the public page and parsing badge images. This will often be blocked by CORS,
    // but when it works (or when Credly exposes public image URLs) it will render badges directly.
    // Helper: attempt to fetch and parse HTML -> Document
    const fetchHtmlDoc = url => fetch(url, { credentials: 'omit' })
        .then(resp => { if (!resp.ok) throw new Error('HTTP ' + resp.status); return resp.text(); })
        .then(txt => new DOMParser().parseFromString(txt, 'text/html'));

    // Heuristic detectors
    const extractFromJsonLd = doc => {
        const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of scripts) {
            try {
                const data = JSON.parse(s.textContent || '{}');
                // Look for an array or nested badges
                const candidates = [];
                const pushIfBadge = item => {
                    if (!item) return;
                    if (item.image || item.name) candidates.push({ name: item.name || '', image: item.image || item.thumbnailUrl || '' });
                };
                if (Array.isArray(data)) data.forEach(pushIfBadge);
                else if (typeof data === 'object') {
                    if (Array.isArray(data.badges)) data.badges.forEach(pushIfBadge);
                    if (data.credential && Array.isArray(data.credential)) data.credential.forEach(pushIfBadge);
                    pushIfBadge(data);
                }
                if (candidates.length) return candidates;
            } catch (e) { /* ignore parse errors */ }
        }
        return null;
    };

    const extractFromMetaAndLinks = doc => {
        // Look for link rel=image_src or meta tags that include badge images
        const candidates = [];
        const link = doc.querySelector('link[rel="image_src"]');
        if (link && link.href) candidates.push({ name: '', image: link.href });
        const metas = Array.from(doc.querySelectorAll('meta'));
        metas.forEach(m => {
            const prop = (m.getAttribute('property') || m.getAttribute('name') || '').toLowerCase();
            if (prop.includes('image') && m.content) candidates.push({ name: '', image: m.content });
        });
        return candidates.length ? candidates : null;
    };

    const extractFromClassNames = doc => {
        // Common class names or attributes used for badge images
        const selectors = [
            'img.badge', 'img.credential-image', 'img.credly-badge', 'img.credential-img',
            '.badge img', '.credential img', '.credly-badge img'
        ];
        const imgs = selectors.flatMap(sel => Array.from(doc.querySelectorAll(sel)));
        const uniq = Array.from(new Set(imgs));
        if (uniq.length === 0) return null;
        return uniq.map(img => ({ name: img.alt || '', image: img.src || '' }));
    };

    const attemptDiscovery = async () => {
        try {
            const doc = await fetchHtmlDoc(credlyUrl);

            // 1) JSON-LD
            const fromJsonLd = extractFromJsonLd(doc);
            if (fromJsonLd && fromJsonLd.length) return fromJsonLd;

            // 2) meta/link tags
            const fromMeta = extractFromMetaAndLinks(doc);
            if (fromMeta && fromMeta.length) return fromMeta;

            // 3) class-based selections
            const fromClass = extractFromClassNames(doc);
            if (fromClass && fromClass.length) return fromClass;

            // 4) generic image heuristics (look for images with 'badge' or 'credential' in alt/src)
            const imgs = Array.from(doc.querySelectorAll('img'));
            const badgeImgs = imgs.map(i => ({ name: i.alt || '', image: i.src || '' }))
                .filter(b => /badge|credential|credly|certificate|credential-image/i.test(b.name + ' ' + b.image));
            if (badgeImgs.length) return badgeImgs;

            // If none found, try a couple of likely API-ish endpoints (they may fail due to CORS)
            const apiCandidates = [
                credlyUrl.replace('/users/', '/api/v1/people/'),
                'https://api.credly.com/v1/people/ronald-mugume/badges',
            ];
            for (const url of apiCandidates) {
                try {
                    const r = await fetch(url, { credentials: 'omit' });
                    if (!r.ok) continue;
                    const json = await r.json();
                    // Try to normalize JSON into {name,image}
                    const items = [];
                    if (Array.isArray(json)) json.forEach(it => items.push({ name: it.name || it.badge?.name || '', image: it.image || it.badge?.image || it.badge?.image_url || '' }));
                    else if (json && json.data && Array.isArray(json.data)) json.data.forEach(d => { items.push({ name: d.name || '', image: d.image || d.badge?.image || '' }); });
                    if (items.length) return items;
                } catch (e) { /* ignore per-candidate errors */ }
            }

            throw new Error('No badge candidates discovered');
        } catch (err) {
            throw err;
        }
    };

    attemptDiscovery().then(candidates => {
        if (!candidates || candidates.length === 0) throw new Error('No candidates');
        container.innerHTML = candidates.map(c => {
            let src = c.image || '';
            if (src && src.startsWith('//')) src = 'https:' + src;
            if (src && src.startsWith('/')) src = new URL(src, credlyUrl).href;
            const name = (c.name || '').trim();
            return `
                <a href="${credlyUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:6px;">
                  <img src="${src}" alt="${name || 'Credly badge'}" style="height:72px;max-width:140px;object-fit:contain;display:block;" />
                </a>
            `;
        }).join('');
    }).catch(err => {
        console.warn('Badge discovery failed:', err);
        // If local badges are already present, don't overwrite them with the remote error message
        try {
            const hasLocal = container.querySelector('.badge-card, .badge-link, img');
            if (hasLocal) return;
        } catch (e) { /* ignore */ }
        // Only show the fallback message if the container is empty
        if (container.children.length === 0 || container.textContent.trim() === '') {
            container.innerHTML = `
                <p>Could not load badges client-side due to cross-origin or discovery limits.</p>
                <p><a href="${credlyUrl}" target="_blank" rel="noopener noreferrer">View badges on Credly</a></p>
            `;
        }
    });
}

// Badge image fallback: if an image fails to load, replace with a text label so the badge area never looks empty
document.addEventListener('DOMContentLoaded', () => {
    const imgs = document.querySelectorAll('#badges img');
    imgs.forEach(img => {
        img.addEventListener('error', () => {
            console.warn('Badge image failed to load:', img.src);
            const card = img.closest('.badge-card');
            if (card) {
                // remove broken image and show label
                img.remove();
                const lbl = card.querySelector('.badge-label');
                if (lbl) lbl.style.display = 'block';
                else {
                    const newLabel = document.createElement('div');
                    newLabel.className = 'badge-label';
                    newLabel.textContent = 'Badge';
                    card.appendChild(newLabel);
                }
            }
        });
    });
});

// Set the fixed bottom-right visitor label
document.addEventListener('DOMContentLoaded', () => {
    const fixed = document.getElementById('visitor-count-fixed');
    if (fixed) fixed.textContent = 'Visited by 123 people';
});

