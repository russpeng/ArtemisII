/**
 * Maps scroll position → u_progress [0, 1].
 * Full transition completes after scrolling 3× the viewport height.
 *
 * Also updates the UI labels and progress bar.
 */

const PHASE_LABELS = [
  { threshold: 0.0,  label: 'Formation'          },
  { threshold: 0.08, label: 'T-0 / Ignition'     },
  { threshold: 0.28, label: 'Max-Q'               },
  { threshold: 0.52, label: 'MECO / Staging'      },
  { threshold: 0.78, label: 'TLI Burn'            },
  { threshold: 0.95, label: 'Trans-Lunar Injection'},
];

export function createScrollDriver(material) {
  let progress       = 0.0;
  let targetProgress = 0.0;

  const phaseEl     = document.getElementById('phase-label');
  const hintEl      = document.getElementById('scroll-hint');
  const progressBar = document.getElementById('progress-bar');

  const onScroll = () => {
    targetProgress = Math.min(window.scrollY / (window.innerHeight * 3), 1.0);

    // Fade out the scroll hint once movement starts
    if (targetProgress > 0.02 && hintEl) {
      hintEl.style.opacity = '0';
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  const update = () => {
    // Smooth follow with momentum feel
    progress += (targetProgress - progress) * 0.06;
    material.uniforms.u_progress.value = progress;

    // Update phase label
    if (phaseEl) {
      let currentLabel = PHASE_LABELS[0].label;
      for (const phase of PHASE_LABELS) {
        if (progress >= phase.threshold) currentLabel = phase.label;
      }
      if (phaseEl.textContent !== currentLabel) {
        phaseEl.textContent = currentLabel;
        // Color shift at ignition
        phaseEl.style.color = progress > 0.06 && progress < 0.55
          ? 'rgba(255, 140, 60, 0.5)'
          : 'rgba(255, 255, 255, 0.25)';
      }
    }

    // Progress bar
    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
      progressBar.style.background = progress < 0.5
        ? 'rgba(255, 140, 50, 0.6)'
        : 'rgba(100, 160, 255, 0.5)';
    }
  };

  return { update };
}
