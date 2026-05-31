// Inexa Frontend API Client Utility

// Helper to escape HTML characters and prevent XSS
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper to split gallery images safely handling base64 data URLs
function splitGallery(galleryStr) {
  if (!galleryStr) return [];
  const urls = [];
  const parts = galleryStr.split(',');
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    if (part.startsWith('data:') && part.includes(';base64') && i + 1 < parts.length) {
      part = part + ',' + parts[i + 1];
      i++;
    }
    urls.push(part);
  }
  return urls.filter(Boolean);
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Log Page View Analytics
  const pageUrl = window.location.pathname;
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageUrl, eventType: 'PAGE_VIEW' })
  }).catch(err => console.error('Analytics error:', err));

  // Determine current page and initialize specific hydration
  const isHomepage = pageUrl === '/' || pageUrl.endsWith('index.html') || pageUrl === '';
  if (isHomepage) {
    hydrateFAQs();
    hydratePortfolioList();

    // Smooth scrolling for hash links on page load
    if (window.location.hash) {
      setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500); // delay to let dynamic content hydrate
    }

    // Set up smooth scroll event delegation for homepage anchors
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href) {
          const hashIndex = href.indexOf('#');
          if (hashIndex !== -1) {
            const hash = href.substring(hashIndex);
            const pathBeforeHash = href.substring(0, hashIndex);
            const isLocal = pathBeforeHash === '' || pathBeforeHash === 'index.html' || pathBeforeHash === '/index.html' || pathBeforeHash === '/';
            if (isLocal && hash.length > 1) {
              const target = document.querySelector(hash);
              if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.pushState(null, null, hash);
              }
            }
          }
        }
      }
    });
  } else if (pageUrl.endsWith('portfolio-details.html') || pageUrl.includes('/portfolio-details')) {
    hydratePortfolioDetail();
  }

  // Bind Form Submissions
  setupFormSubmissions();
});

// Helper to render dynamic alerts
function showAlert(form, type, message) {
  // Remove existing alerts
  const existingAlert = form.querySelector('.alert-dismissible');
  if (existingAlert) existingAlert.remove();

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3 fs-7 rounded-3`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    <strong>${type === 'success' ? 'Success!' : 'Error!'}</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  form.appendChild(alertDiv);
}

// 2. Hydrate FAQs Accordion
async function hydrateFAQs() {
  const container = document.getElementById('faq-accordion');
  if (!container) return;

  try {
    const res = await fetch('/api/faqs');
    const { faqs } = await res.json();

    if (faqs && faqs.length > 0) {
      container.innerHTML = ''; // Clear hardcoded items
      faqs.forEach((faq, index) => {
        const itemHtml = `
          <div class="card mb-4 p-3 border-0 bg-secondary-1 rounded-4 wow img-custom-anim-top">
              <div class="card-header border-0 bg-secondary-1">
                  <a class="${index === 0 ? '' : 'collapsed'} text-dark fw-bold" data-bs-toggle="collapse" href="#collapse${escapeHTML(faq.id)}">
                      ${escapeHTML(faq.question)}
                  </a>
              </div>
              <div id="collapse${escapeHTML(faq.id)}" class="collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#faq-accordion">
                  <div class="card-body text-secondary">
                      ${escapeHTML(faq.answer)}
                  </div>
              </div>
          </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHtml);
      });
    }
  } catch (err) {
    console.error('FAQs hydration error:', err);
  }
}

// 3. Hydrate Portfolio List Grid
async function hydratePortfolioList() {
  const grid = document.querySelector('.masonary-active');
  if (!grid) return;

  try {
    const res = await fetch('/api/projects');
    const { projects } = await res.json();

    if (projects && projects.length > 0) {
      grid.innerHTML = ''; // Clear default
      projects.forEach(proj => {
        const itemHtml = `
          <div class="col-lg-6 filter-item ${escapeHTML(proj.category)}">
              <div class="px-5 py-8">
                  <a href="portfolio-details.html?id=${escapeHTML(proj.id)}" class="shine-animate-item">
                      <span class="shine-animate mb-4">
                          <img class="w-100 rounded-3" src="${escapeHTML(proj.imageUrl)}" alt="${escapeHTML(proj.title)}" />
                      </span>
                      <span>
                          <span class="text-dark fw-medium mt-4 fs-2">${escapeHTML(proj.title)}</span><br />
                          <span class="fs-4 text-primary">${escapeHTML(proj.services)}</span>
                      </span>
                  </a>
              </div>
          </div>
        `;
        grid.insertAdjacentHTML('beforeend', itemHtml);
      });

      // Re-trigger imagesLoaded and Isotope if present globally
      if (window.jQuery && typeof window.jQuery.fn.isotope === 'function') {
        const $ = window.jQuery;
        $('.masonary-active').imagesLoaded(function () {
          $('.masonary-active').isotope('destroy');
          const $grid = $('.masonary-active').isotope({
            itemSelector: '.filter-item',
            filter: '*',
            masonry: { columnWidth: 1 }
          });
          $('.filter-menu-active').on('click', 'button', function () {
            const filterValue = $(this).attr('data-filter');
            $grid.isotope({ filter: filterValue });
          });
        });
      }
    }
  } catch (err) {
    console.error('Portfolio list hydration error:', err);
  }
}

// 4. Hydrate Portfolio Details specifications
async function hydratePortfolioDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) return;

  try {
    const res = await fetch(`/api/projects/${id}`);
    const { project } = await res.json();

    if (project) {
      // Set titles
      document.title = `${project.title} - Inexa`;
      const titleEl = document.querySelector('.blog_list_section1 h1');
      if (titleEl) titleEl.textContent = project.title;

      // Specifications block
      const specRow = document.querySelector('.row.wow.img-custom-anim-top .col-lg-8 .row');
      if (specRow) {
        specRow.innerHTML = `
          <div class="col">
              <span>Client</span>
              <h6 class="fs-6 fw-semibold">${escapeHTML(project.client || 'N/A')}</h6>
          </div>
          <div class="col">
              <span>Start</span>
              <h6 class="fs-6 fw-semibold">${escapeHTML(project.startDate || 'N/A')}</h6>
          </div>
          <div class="col">
              <span>Complete</span>
              <h6 class="fs-6 fw-semibold">${escapeHTML(project.completeDate || 'N/A')}</h6>
          </div>
          <div class="col">
              <span>Services</span>
              <h6 class="fs-6 fw-semibold">${escapeHTML(project.services || 'N/A')}</h6>
          </div>
          <div class="col">
              <span>Website</span>
              <h6 class="fs-6 fw-semibold"><a href="https://${escapeHTML(project.website)}" target="_blank">${escapeHTML(project.website || 'N/A')}</a></h6>
          </div>
        `;
      }

      // Detailed text
      const descEl = document.querySelector('.row.wow.img-custom-anim-top .col-lg-8 p.ds-xs-6');
      if (descEl) descEl.textContent = project.description;

      // Gallery Images Slider
      const swiperWrapper = document.querySelector('.swiper.slider-6 .swiper-wrapper');
      if (swiperWrapper && project.gallery) {
        swiperWrapper.innerHTML = '';
        const imgs = splitGallery(project.gallery);
        imgs.forEach(img => {
          swiperWrapper.insertAdjacentHTML('beforeend', `
            <div class="swiper-slide">
                <div class="position-relative">
                    <img class="rounded-4 w-100" src="${escapeHTML(img)}" alt="${escapeHTML(project.title)}" />
                </div>
            </div>
          `);
        });
      }
    }
  } catch (err) {
    console.error('Portfolio detail hydration error:', err);
  }
}

// 5. Setup Quote / Contact Form Submit Actions
function setupFormSubmissions() {
  // Quote / Projects Lead submissions
  const quoteForms = document.querySelectorAll('form');
  quoteForms.forEach(form => {
    // Normal Quote lead / contact form submissions
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Find inputs
      const name = form.querySelector('input[placeholder="Your name"]') ? form.querySelector('input[placeholder="Your name"]').value : form.querySelector('input[aria-label="username"]')?.value || '';
      const email = form.querySelector('input[placeholder="info@"]') ? form.querySelector('input[placeholder="info@"]').value : form.querySelector('input[aria-label="email"]')?.value || '';
      const phone = form.querySelector('input[placeholder="Phone"]')?.value || '';
      const subject = form.querySelector('input[placeholder="Subject"]')?.value || 'New Contact Request';
      const description = form.querySelector('textarea')?.value || '';
      
      // Budget selected
      const activeBudget = document.querySelector('.select-budget a.active')?.textContent.trim() || 'Not Specified';

      if (!name || !email || !description) {
        showAlert(form, 'danger', 'Name, email, and project description are required.');
        return;
      }

      try {
        const res = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            subject,
            description,
            budget: activeBudget,
            type: window.location.pathname.includes('get-quote') ? 'QUOTE' : 'BUDGET_CONTACT'
          })
        });

        const data = await res.json();
        if (data.success) {
          showAlert(form, 'success', 'Your lead was sent successfully! We will get back to you shortly.');
          form.reset();
        } else {
          showAlert(form, 'danger', data.error || 'Inquiry submission failed.');
        }
      } catch (err) {
        showAlert(form, 'danger', 'Network connection failed. Please try again.');
      }
    });
  });
}
