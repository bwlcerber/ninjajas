// Global Lazy Video Hover Logic
document.addEventListener('mouseenter', function(e) {
  const container = e.target.closest('.lazy-video-wrapper');
  if (container) {
    const src = container.getAttribute('data-video-src');
    if (src && !container.querySelector('video')) {
      const v = document.createElement('video');
      v.src = src;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.className = 'creative-card-media';
      v.style.position = 'absolute';
      v.style.top = '0';
      v.style.left = '0';
      v.style.opacity = '0';
      v.style.transition = 'opacity 0.3s ease';
      v.style.zIndex = '2'; // above the image but below the overlay
      container.appendChild(v);
      v.play().then(() => {
        v.style.opacity = '1';
      }).catch(err => {
        // Autoplay might be blocked or file is missing
        console.warn('Lazy video autoplay failed:', err);
      });
    }
  }
}, true);

document.addEventListener('mouseleave', function(e) {
  const container = e.target.closest('.lazy-video-wrapper');
  if (container) {
    const v = container.querySelector('video');
    if (v) {
      v.pause();
      v.removeAttribute('src'); // force cleanup
      v.load();
      v.remove();
    }
  }
}, true);
// YouTube-style hover playback for static video wrappers
document.addEventListener('mouseenter', function(e) {
  const container = e.target.closest('.static-video-wrapper');
  if (container) {
    const v = container.querySelector('video');
    if (v) {
      v.play().catch(err => {
        console.warn('Hover playback failed:', err);
      });
    }
  }
}, true);

document.addEventListener('mouseleave', function(e) {
  const container = e.target.closest('.static-video-wrapper');
  if (container) {
    const v = container.querySelector('video');
    if (v) {
      v.pause();
      // Optional: reset to beginning to act like a fresh preview
      v.currentTime = 0; 
    }
  }
}, true);
