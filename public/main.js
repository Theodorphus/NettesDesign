const form = document.getElementById('form');
const statusEl = document.getElementById('status');
const button = form.querySelector('button');

const PHONE_LINK = '<a href="tel:+46705287897">070-528 78 97</a>';

function setStatus(kind, html) {
  statusEl.className = kind ? `status status--${kind}` : 'status';
  statusEl.innerHTML = html;
}

function validate() {
  let firstInvalid = null;
  for (const field of form.querySelectorAll('[required]')) {
    const invalid = !field.value.trim();
    if (invalid) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    if (invalid && !firstInvalid) firstInvalid = field;
  }
  return firstInvalid;
}

form.addEventListener('input', (event) => {
  if (event.target.value.trim()) event.target.removeAttribute('aria-invalid');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const firstInvalid = validate();
  if (firstInvalid) {
    setStatus('error', 'Fyll i alla fälten, så går det iväg.');
    firstInvalid.focus();
    return;
  }

  button.disabled = true;
  button.textContent = 'Skickar...';
  setStatus('', '');

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      form.reset();
      setStatus('ok', 'Tack! Nette hör av sig så snart det går.');
    } else if (response.status === 400 && result.error === 'reach') {
      const reach = document.getElementById('reach');
      reach.setAttribute('aria-invalid', 'true');
      reach.focus();
      setStatus('error', 'Skriv ett telefonnummer eller en e-postadress, så att Nette kan svara dig.');
    } else {
      throw new Error('send failed');
    }
  } catch {
    setStatus('error', `Det gick inte att skicka just nu. Ring gärna istället: ${PHONE_LINK}`);
  } finally {
    button.disabled = false;
    button.textContent = 'Skicka';
  }
});

// Ringknappen i mobilen visas bara när telefonnumren i hero och kontakt inte syns.
const stickyCall = document.getElementById('stickycall');
const visible = new Set();
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.add(entry.target);
    else visible.delete(entry.target);
  }
  stickyCall.classList.toggle('is-visible', visible.size === 0);
});
observer.observe(document.querySelector('.hero .call'));
observer.observe(document.getElementById('kontakt'));
