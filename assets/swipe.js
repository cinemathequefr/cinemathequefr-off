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
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let embla;
  let current = 0;
  let outgoing;
  let pointerDown = false;

  function calendarTop() {
    return viewport.getBoundingClientRect().top +
      parseFloat(getComputedStyle(calendar).paddingTop);
  }

  const isCarouselActive = () => embla && mobile.matches;

  // Distance between the calendar top and the bottom of the sticky header.
  function updateInactiveOffset() {
    const offset = Math.max(0, position.getBoundingClientRect().bottom - calendarTop());
    calendar.style.setProperty("--calendar-inactive-offset", `${offset}px`);
  }

  // Size the calendar to the current day (or the outgoing one during a transition).
  function updateHeight() {
    const style = getComputedStyle(calendar);
    const paddingTop = parseFloat(style.paddingTop);
    const paddingBottom = parseFloat(style.paddingBottom);
    const contentHeight = Math.max(
      days[current].getBoundingClientRect().height,
      outgoing?.getBoundingClientRect().height ?? 0,
    );
    // Keep enough scroll range to align a short day below the sticky header.
    const minimumHeight = window.innerHeight - position.getBoundingClientRect().height + paddingTop;
    const height = Math.max(contentHeight + paddingTop + paddingBottom, minimumHeight);
    calendar.style.setProperty("--calendar-height", `${height}px`);
  }

  function updateLayout() {
    updateHeight();
    updateInactiveOffset();
  }

  function clearOutgoing() {
    outgoing?.classList.remove("calendar-outgoing");
    outgoing = undefined;
    calendar.style.removeProperty("--calendar-outgoing-offset");
  }

  // While swiping, the page must not scroll vertically.
  function setSwiping(swiping) {
    document.documentElement.classList.toggle("calendar-swiping", swiping);
  }

  function resetGesture() {
    pointerDown = false;
    setSwiping(false);
  }

  function showDay(selected) {
    const previous = days[current];
    const previousTop = previous.getBoundingClientRect().top;
    if (previous.contains(document.activeElement)) {
      position.focus({ preventScroll: true });
    }
    clearOutgoing();
    previous.classList.remove("calendar-current");
    current = selected;
    days[current].classList.add("calendar-current");
    // Keep the previous day visible while the new one slides in.
    outgoing = reducedMotion.matches ? undefined : previous;
    updateHeight();

    // Keep the vertical scroll position, clamped to the new day's top.
    const top = window.scrollY + calendarTop() - position.getBoundingClientRect().bottom;
    window.scrollTo(window.scrollX, Math.min(window.scrollY, top));

    if (outgoing) {
      calendar.style.setProperty("--calendar-outgoing-offset", `${previousTop - calendarTop()}px`);
      outgoing.classList.add("calendar-outgoing");
    }
    updateInactiveOffset();
  }

  function updateLabel() {
    const date = days[current].querySelector(".date").textContent.trim();
    position.textContent = date;
    position.setAttribute(
      "aria-label",
      `${date}. Utilisez les flèches gauche et droite pour changer de jour.`,
    );
  }

  function updateDay(api) {
    if (!mobile.matches) return;
    const selected = api.selectedScrollSnap();
    if (selected !== current) showDay(selected);
    days.forEach((day, index) => {
      day.inert = index !== current;
    });
    updateLabel();
  }

  function enableCarousel() {
    viewport.classList.add("is-carousel");
    calendar.classList.add("calendar-carousel");
    position.hidden = false;
    days[current].classList.add("calendar-current");
    updateLayout();
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
    embla.on("pointerDown", () => {
      pointerDown = true;
    });
    embla.on("pointerUp", resetGesture);
    embla.on("scroll", () => {
      if (pointerDown) setSwiping(true);
    });
    embla.on("settle", () => {
      setSwiping(false);
      clearOutgoing();
      updateLayout();
    });
    embla.on("reInit", (api) => {
      if (!mobile.matches) return;
      resetGesture();
      clearOutgoing();
      updateLayout();
      updateDay(api);
    });
    updateDay(embla);
  }

  function disableCarousel() {
    resetGesture();
    embla?.destroy();
    embla = undefined;
    clearOutgoing();
    viewport.classList.remove("is-carousel");
    calendar.classList.remove("calendar-carousel");
    position.hidden = true;
    days.forEach((day) => {
      day.inert = false;
      day.classList.remove("calendar-current", "calendar-outgoing");
    });
    calendar.style.removeProperty("--calendar-height");
    calendar.style.removeProperty("--calendar-inactive-offset");
  }

  function setMobileMode() {
    if (mobile.matches) enableCarousel();
    else disableCarousel();
  }

  document.addEventListener(
    "touchmove",
    (event) => {
      // Embla prevents the move only after recognizing a horizontal drag.
      if (embla && pointerDown && event.defaultPrevented) setSwiping(true);
    },
    { passive: true },
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetGesture();
  });

  window.addEventListener("scroll", () => {
    if (isCarouselActive()) updateInactiveOffset();
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (isCarouselActive()) updateLayout();
  });

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
    const relevant = [position, days[current], outgoing];
    if (embla && entries.some((entry) => relevant.includes(entry.target))) updateLayout();
  });
  resizeObserver.observe(position, { box: "border-box" });
  days.forEach((day) => resizeObserver.observe(day, { box: "border-box" }));
  mobile.addEventListener("change", setMobileMode);
  setMobileMode();
}
initializeCalendarSwipe();
