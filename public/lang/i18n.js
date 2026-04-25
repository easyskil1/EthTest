const TRANSLATIONS = {
  hu: typeof hu !== 'undefined' ? hu : {},
  en: typeof en !== 'undefined' ? en : {},
  de: typeof de !== 'undefined' ? de : {},
  es: typeof es !== 'undefined' ? es : {},
};

let currentLang = localStorage.getItem('ethtest-lang') || 'hu';

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS['hu']?.[key] ?? key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  // line count frissítés
  document.querySelectorAll('.line-count').forEach(el => {
    const num = el.textContent.match(/\d+/)?.[0] || '0';
    el.textContent = `${num} ${t('out.lines')}`;
  });
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('ethtest-lang', lang);
  applyTranslations();
}
