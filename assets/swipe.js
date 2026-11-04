function initializeCalendarSwipe() {
  const calendar = document.querySelector(".calendar");
  const viewport = document.querySelector(".calendar-viewport");
  const position = document.querySelector(".calendar-position");
  if (!calendar || !viewport || !position) return;

  const originalChildren = Array.from(calendar.children);
  const days = originalChildren.filter((day) =>
    day.matches(".day[data-date]:not(.past):has(.seance:not(.hidden))"),
  );
  if (days.length === 0) return;
  if (typeof EmblaCarousel !== "function") {
    console.error("Le chargement du calendrier interactif a échoué.");
    return;
  }

  const mobile = window.matchMedia("screen and (max-width: 599px)");
  let embla;
  let current = 0;
  let pointer;

  function updateLabel() {
    const date = days[current].querySelector(".date").textContent.trim();
    position.querySelector(".calendar-position-date").textContent = date;
    position.setAttribute(
      "aria-label",
      `${date}. Utilisez les flèches gauche et droite pour changer de jour.`,
    );
  }

  function updateHeight() {
    const minimumHeight = Math.max(
      0,
      window.innerHeight - position.getBoundingClientRect().height,
    );
    calendar.style.setProperty(
      "--calendar-min-day-height",
      `${minimumHeight}px`,
    );
    calendar.style.setProperty(
      "--calendar-height",
      `${Math.max(days[current].getBoundingClientRect().height, minimumHeight)}px`,
    );
  }

  function alignCurrentDay() {
    const top =
      window.scrollY +
      viewport.getBoundingClientRect().top -
      position.getBoundingClientRect().height;
    window.scrollTo(window.scrollX, Math.max(0, top));
  }

  function updateCurrentDay(api) {
    const selected = api.selectedScrollSnap();
    if (selected === current) return;

    if (days[current].contains(document.activeElement)) {
      position.focus({ preventScroll: true });
    }
    current = selected;
    days.forEach((day, index) => {
      day.inert = index !== current;
    });
    updateLabel();
    updateHeight();
    alignCurrentDay();
  }

  function setSwiping(swiping) {
    document.documentElement.classList.toggle("calendar-swiping", swiping);
  }

  function resetPointer(event) {
    if (
      pointer &&
      event?.pointerId !== undefined &&
      event.pointerId !== pointer.id
    )
      return;
    pointer = undefined;
    setSwiping(false);
  }

  function enableCarousel() {
    calendar.replaceChildren(...days);
    viewport.classList.add("is-carousel");
    calendar.classList.add("calendar-carousel");
    position.hidden = false;
    days.forEach((day, index) => {
      day.inert = index !== current;
    });
    updateLabel();
    updateHeight();

    embla = EmblaCarousel(viewport);
    embla.on("select", updateCurrentDay);
    embla.on("settle", updateHeight);
    if (current > 0) embla.scrollTo(current, true);
  }

  function disableCarousel() {
    resetPointer();
    embla?.destroy();
    embla = undefined;
    calendar.replaceChildren(...originalChildren);
    viewport.classList.remove("is-carousel");
    calendar.classList.remove("calendar-carousel");
    position.hidden = true;
    days.forEach((day) => {
      day.inert = false;
    });
    calendar.style.removeProperty("--calendar-height");
    calendar.style.removeProperty("--calendar-min-day-height");
  }

  function setMobileMode() {
    if (mobile.matches && !embla) enableCarousel();
    else if (!mobile.matches && embla) disableCarousel();
  }

  viewport.addEventListener("pointerdown", (event) => {
    if (!embla || !event.isPrimary || event.button > 0) return;
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  });

  document.addEventListener(
    "pointermove",
    (event) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const deltaX = Math.abs(event.clientX - pointer.x);
      const deltaY = Math.abs(event.clientY - pointer.y);
      if (deltaX > 8 && deltaX > deltaY) setSwiping(true);
    },
    { passive: true },
  );

  document.addEventListener("pointerup", resetPointer);
  document.addEventListener("pointercancel", resetPointer);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetPointer();
  });
  window.addEventListener("blur", resetPointer);
  window.addEventListener("resize", () => {
    if (embla) updateHeight();
  });

  position.addEventListener("keydown", (event) => {
    if (!embla || event.target !== position) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      embla.scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      embla.scrollNext();
    }
  });

  const resizeObserver = new ResizeObserver(() => {
    if (embla) updateHeight();
  });
  resizeObserver.observe(position);
  days.forEach((day) => resizeObserver.observe(day));

  mobile.addEventListener("change", setMobileMode);
  setMobileMode();
}

initializeCalendarSwipe();
