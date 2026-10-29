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

  function updateInactiveOffset() {
    const offset = Math.max(0, position.getBoundingClientRect().bottom - calendarTop());
    calendar.style.setProperty("--calendar-inactive-offset", `${offset}px`);
  }

  function updateHeight() {
    const style = getComputedStyle(calendar);
    const paddingTop = parseFloat(style.paddingTop);
    const padding = paddingTop + parseFloat(style.paddingBottom);
    let height = days[current].getBoundingClientRect().height;
    if (outgoing) {
      height = Math.max(height, outgoing.getBoundingClientRect().height);
    }
    // Keep enough scroll range to align a short day below the sticky header.
    const minimumHeight = window.innerHeight - position.getBoundingClientRect().height + paddingTop;
    calendar.style.setProperty("--calendar-height", `${Math.max(height + padding, minimumHeight)}px`);
  }

  function finishTransition() {
    if (outgoing) {
      outgoing.classList.remove("calendar-outgoing");
      outgoing = undefined;
      calendar.style.removeProperty("--calendar-outgoing-offset");
    }
    updateHeight();
    updateInactiveOffset();
  }

  function lockScroll() {
    document.documentElement.classList.add("calendar-swiping");
  }

  function unlockScroll() {
    document.documentElement.classList.remove("calendar-swiping");
  }

  function resetGesture() {
    pointerDown = false;
    unlockScroll();
  }

  function updateDay(api) {
    if (!mobile.matches) return;
    const selected = api.selectedScrollSnap();
    if (selected !== current) {
      const previous = days[current];
      const previousTop = previous.getBoundingClientRect().top;
      if (previous.contains(document.activeElement)) {
        position.focus({ preventScroll: true });
      }
      if (outgoing) outgoing.classList.remove("calendar-outgoing");
      previous.classList.remove("calendar-current");
      current = selected;
      days[current].classList.add("calendar-current");
      outgoing = reducedMotion.matches ? undefined : previous;
      updateHeight();

      const top = window.scrollY + calendarTop() - position.getBoundingClientRect().bottom;
      window.scrollTo(window.scrollX, Math.min(window.scrollY, top));
      if (outgoing) {
        calendar.style.setProperty(
          "--calendar-outgoing-offset",
          `${previousTop - calendarTop()}px`,
        );
        outgoing.classList.add("calendar-outgoing");
      }
      updateInactiveOffset();
    }
    days.forEach((day, index) => {
      day.inert = index !== current;
    });
    const date = days[current].querySelector(".date").textContent.trim();
    position.textContent = date;
    position.setAttribute(
      "aria-label",
      `${date}. Utilisez les flèches gauche et droite pour changer de jour.`,
    );
  }

  function setMobileMode() {
    if (mobile.matches) {
      viewport.classList.add("is-carousel");
      calendar.classList.add("calendar-carousel");
      position.hidden = false;
      days[current].classList.add("calendar-current");
      updateHeight();
      updateInactiveOffset();
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
      embla.on("pointerUp", () => {
        resetGesture();
      });
      embla.on("scroll", () => {
        if (pointerDown) lockScroll();
      });
      embla.on("settle", () => {
        unlockScroll();
        finishTransition();
      });
      embla.on("reInit", (api) => {
        if (!mobile.matches) return;
        resetGesture();
        finishTransition();
        updateDay(api);
      });
      updateDay(embla);
    } else {
      resetGesture();
      if (embla) {
        embla.destroy();
        embla = undefined;
      }
      viewport.classList.remove("is-carousel");
      calendar.classList.remove("calendar-carousel");
      position.hidden = true;
      days.forEach((day) => {
        day.inert = false;
        day.classList.remove("calendar-current", "calendar-outgoing");
      });
      outgoing = undefined;
      calendar.style.removeProperty("--calendar-height");
      calendar.style.removeProperty("--calendar-inactive-offset");
      calendar.style.removeProperty("--calendar-outgoing-offset");
    }
  }

  document.addEventListener(
    "touchmove",
    (event) => {
      // Embla prevents the move only after recognizing a horizontal drag.
      if (embla && pointerDown && event.defaultPrevented) lockScroll();
    },
    { passive: true },
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetGesture();
  });

  window.addEventListener("scroll", () => {
    if (embla && mobile.matches) updateInactiveOffset();
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (embla && mobile.matches) {
      updateHeight();
      updateInactiveOffset();
    }
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
    if (embla && entries.some((entry) =>
      entry.target === position || entry.target === days[current] || entry.target === outgoing
    )) {
      updateHeight();
      updateInactiveOffset();
    }
  });
  resizeObserver.observe(position, { box: "border-box" });
  days.forEach((day) => resizeObserver.observe(day, { box: "border-box" }));
  mobile.addEventListener("change", setMobileMode);
  setMobileMode();
}
initializeCalendarSwipe();
