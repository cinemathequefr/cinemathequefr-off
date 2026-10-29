function initializeCalendarSwipe() {
  const calendar = document.querySelector(".calendar");
  const viewport = document.querySelector(".calendar-viewport");
  const position = document.querySelector(".calendar-position");
  const days = Array.from(
    calendar.querySelectorAll(
      ":scope > .day[data-date]:not(.past):has(.seance:not(.hidden))",
    ),
  );
  if (days.length === 0) return;
  if (typeof EmblaCarousel !== "function") {
    console.error("Le chargement du calendrier interactif a échoué.");
    return;
  }

  const mobile = window.matchMedia("screen and (max-width: 599px)");
  let embla;
  let current = 0;

  function updateHeight() {
    const style = getComputedStyle(calendar);
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const height = days[current].getBoundingClientRect().height + padding;
    calendar.style.setProperty("--calendar-height", `${height}px`);
  }

  function updateDay(api) {
    const selected = api.selectedScrollSnap();
    if (selected !== current && days[current].contains(document.activeElement)) {
      position.focus({ preventScroll: true });
    }
    current = selected;
    days.forEach((day, index) => {
      day.inert = index !== current;
    });
    const date = days[current].querySelector(".date").textContent.trim();
    position.textContent = date;
    position.setAttribute(
      "aria-label",
      `${date}. Utilisez les flèches gauche et droite pour changer de jour.`,
    );
    updateHeight();
  }

  function setMobileMode() {
    if (mobile.matches) {
      viewport.classList.add("is-carousel");
      calendar.classList.add("calendar-carousel");
      position.hidden = false;
      embla = EmblaCarousel(viewport, {
        align: "start",
        slides: days,
        startIndex: current,
        loop: false,
        breakpoints: {
          "(prefers-reduced-motion: reduce)": { duration: 0 },
        },
      });
      embla.on("select", updateDay);
      embla.on("reInit", updateDay);
      updateDay(embla);
    } else {
      if (embla) {
        embla.destroy();
        embla = undefined;
      }
      viewport.classList.remove("is-carousel");
      calendar.classList.remove("calendar-carousel");
      position.hidden = true;
      days.forEach((day) => {
        day.inert = false;
      });
      calendar.style.removeProperty("--calendar-height");
    }
  }

  position.addEventListener("keydown", (event) => {
    if (!embla) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      embla.scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      embla.scrollNext();
    }
  });

  const resizeObserver = new ResizeObserver((entries) => {
    if (embla && entries.some((entry) => entry.target === days[current])) {
      updateHeight();
    }
  });
  days.forEach((day) => resizeObserver.observe(day));
  mobile.addEventListener("change", setMobileMode);
  setMobileMode();
}
initializeCalendarSwipe();
