// @ts-check

const ENABLE_PAGE_REVEALER = false;
const ENABLE_PAGE_PRELOADER = true;

const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
};

{
    const updateScrollWidth = () => {
        document.documentElement.style.setProperty('--body-scroll-width', (window.innerWidth - document.documentElement.clientWidth) + 'px');
    };
    window.addEventListener('resize', updateScrollWidth);
    updateScrollWidth();
}

// Breakpoints Classes
{
    const html = document.documentElement;
    /**
     *
     * @param {string} bp
     * @param {number} bpSize
     * @param {'min' | 'max'} type
     */
    const setupBp = (bp, bpSize, type = 'min') => {
        const media = matchMedia(`(${type}-width: ${bpSize}px)`);
        const update = () => {
            const cls = 'bp-' + bp + (type === 'max' ? '-max' : '');
            if (media.matches) {
                html.classList.add(cls);
            } else {
                html.classList.remove(cls);
            }
        };
        media.onchange = update;
        update();
    };
    Object.entries(breakpoints).forEach(([bp, bpSize]) => {
        setupBp(bp, bpSize, 'min');
        setupBp(bp, bpSize - 1, 'max');
    });
}

// Document ready class
{
    document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.classList.add('dom-ready');
    });
}

// User color scheme prefered
const isDarkMode = () => {
    return document.documentElement.classList.contains('uc-dark');
};
const setDarkMode = (enableDark = true) => {
    const isDark = isDarkMode();
    if (isDark === enableDark) return;
    if (enableDark) {
        document.documentElement.classList.add('uc-dark');
    } else {
        document.documentElement.classList.remove('uc-dark');
    }
    window.dispatchEvent(new CustomEvent('darkmodechange'));
};
if (localStorage.getItem('darkMode')) {
    setDarkMode(localStorage.getItem('darkMode') === '1');
}

// Page Revealer
const ENABLE_PAGE_REVEALER_USED = ENABLE_PAGE_REVEALER && localStorage.getItem('page-revealer') === 'show';

if (ENABLE_PAGE_REVEALER) {
    const easing = 'cubic-bezier(0.8, 0, 0.2, 1)';
    const duration = 0.5; // seconds
    {
        const style = document.createElement('style');
        // css variables is not available at this point so you should use direct values
        style.append(/*css*/`
            .page-revealer {
                pointer-events: none;
                visibility: hidden;
                height: 100%;
                width: 100%;
                position: fixed;
                right: 0;
                bottom: 0;
                left: 0;
                transform: scaleY(0);
                z-index: 12000;
                background-color: #fff;
            }
            :where(.uc-dark) .page-revealer {
                background-color: #011211;
            }
        `);
        document.head.append(style);
    }

    const revealer = document.createElement('div');
    revealer.classList.add('page-revealer');
    document.documentElement.append(revealer);
    window.addEventListener('pageshow', () => {
        revealer.style.visibility = '';
        revealer.style.transform = '';
        revealer.style.transformOrigin = '';
    });

    ENABLE_PAGE_REVEALER_USED && (async () => {
        localStorage.removeItem('page-revealer');
        revealer.style.transition = '';
        revealer.style.visibility = 'visible';
        revealer.style.transform = 'scaleY(1)';
        revealer.style.transformOrigin = 'center bottom';
        await new Promise(r => document.addEventListener('DOMContentLoaded', r));
        await new Promise(r => requestAnimationFrame(r));
        revealer.style.transition = 'transform ' + duration + 's ' + easing;
        revealer.style.transform = 'scaleY(0)';
        revealer.style.transformOrigin = 'center top';
        await new Promise(r => setTimeout(r, duration * 1100));
        revealer.style.visibility = '';
        revealer.style.transform = '';
        revealer.style.transformOrigin = '';
    })();
    /**
     *
     * @param {HTMLAnchorElement} anchor
     */
    const shouldShowRevealer = anchor => {
        const isSameOrigin = location.protocol === anchor.protocol && location.origin === anchor.origin;
        // revealer works only when navigating to the same domain
        if (!isSameOrigin) return false;
        if (anchor.target === '_blank') return false;
        const isSamePage = location.pathname === anchor.pathname && location.search === anchor.search;
        // revealer works when changing page
        if (!isSamePage) return true;
        const hasHash = anchor.hash || anchor.href !== anchor.origin + anchor.pathname + anchor.search + anchor.hash;
        // revealer don't work when anchor has hash
        if (hasHash) return false;
        return true;
    };
    document.addEventListener('click', async e => {
        /** @type {HTMLElement} */
        // @ts-ignore
        const el = e.target;
        const anchor = el.closest('a');
        if (anchor && anchor instanceof HTMLAnchorElement && !e.defaultPrevented && shouldShowRevealer(anchor)) {
            e.preventDefault();
            revealer.style.transition = 'transform ' + duration + 's ' + easing;
            revealer.style.visibility = 'visible';
            revealer.style.transform = 'scaleY(1)';
            revealer.style.transformOrigin = 'center bottom';
            await new Promise(r => setTimeout(r, duration * 1000));
            localStorage.setItem('page-revealer', 'show');
            location.href = anchor.href;
        }
    });
}

// Page Preloader
if (!ENABLE_PAGE_REVEALER_USED && ENABLE_PAGE_PRELOADER) {
    const easing = 'cubic-bezier(0.8, 0, 0.2, 1)';
    const duration = 1.1; // seconds
    {
        const style = document.createElement('style');
        // css variables is not available at this point so you should use direct values
        style.append(/*css*/`
        .uc-pageloader {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
        }

        .uc-pageloader {
            background-color: white;
        }

        .uc-pageloader:where(.uc-dark),
        :where(.uc-dark) .uc-pageloader {
            background-color: #131313;
        }

        .uc-pageloader>.loading {
            display: inline-block;
            position: relative;
            width: 40px;
            height: 40px;
        }

        .uc-pageloader>.loading>div {
            box-sizing: border-box;
            display: block;
            position: absolute;
            width: 40px;
            height: 40px;
            margin: 0;
            border: 4px solid transparent;
            border-radius: 50%;
            animation: uc-loading 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            border-color: var(--color-primary) transparent transparent transparent;
        }

        .uc-pageloader>.loading>div:nth-child(1) {
            animation-delay: -0.1s;
        }

        .uc-pageloader>.loading>div:nth-child(2) {
            animation-delay: -0.2s;
        }

        .uc-pageloader>.loading>div:nth-child(3) {
            animation-delay: -0.3s;
        }

        @keyframes uc-loading {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }
        html.show-preloader body {
            display: none;
        }
        `);
        document.head.append(style);
    }
    const preloader = document.createElement('div');
    preloader.classList.add('uc-pageloader');
    preloader.innerHTML = `
        <div class="loading">
            <div></div><div></div><div></div><div></div>
        </div>
    `;
    document.documentElement.classList.add('show-preloader');
    document.documentElement.append(preloader);
    const t0 = Date.now();
    (async () => {
        await new Promise(r => document.addEventListener('DOMContentLoaded', r));
        document.documentElement.classList.remove('show-preloader');
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, Math.max(0, 500 - (Date.now() - t0))));
        preloader.style.transition = 'opacity ' + duration + 's ' + easing;
        preloader.style.opacity = 0;
        await new Promise(r => setTimeout(r, duration * 1000));
        preloader.remove();
    })();
}


