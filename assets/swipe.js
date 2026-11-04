function initializeCalendarSwipe() {
  const calendar = document.querySelector(".calendar");
  const viewport = document.querySelector(".calendar-viewport");
  const position = document.querySelector(".calendar-position");
  if (!calendar || !viewport || !position) return;

  const buttons = position.querySelectorAll(".calendar-position-button");
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
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let embla;
  let current = 0;
  let outgoing;
  let pointer;

  function targetIndex(offset) {
    if (Math.abs(offset) === 1) {
      const target = current + offset;
      return target >= 0 && target < days.length ? target : -1;
    }
    const date = new Date(
      Date.parse(days[current].dataset.date) + offset * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10);
    return days.findIndex((day) => day.dataset.date === date);
  }

  function updateLabel() {
    const date = days[current].querySelector(".date").textContent.trim();
    position.querySelector(".calendar-position-date").textContent = date;
    position.setAttribute(
      "aria-label",
      `${date}. Utilisez les flèches gauche et droite pour changer de jour.`,
    );
    buttons.forEach((button) => {
      const disabled = targetIndex(Number(button.dataset.days)) === -1;
      if (disabled && document.activeElement === button) {
        position.focus({ preventScroll: true });
      }
      button.disabled = disabled;
    });
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
    // Measure the natural height without the current slide's container fill.
    days[current].classList.remove("calendar-current");
    const contentHeight = days[current].getBoundingClientRect().height;
    days[current].classList.add("calendar-current");
    calendar.style.setProperty(
      "--calendar-height",
      `${Math.max(contentHeight, outgoing?.getBoundingClientRect().height ?? 0, minimumHeight)}px`,
    );
  }

  function updatePosition() {
    const header = position.getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    const visible = header.bottom > 0 && header.top < window.innerHeight;
    position.classList.toggle(
      "is-docked",
      visible &&
        (header.top <= 0 ||
          (bounds.bottom > 0 && bounds.bottom <= window.innerHeight)),
    );
    calendar.style.setProperty(
      "--calendar-inactive-offset",
      `${Math.max(0, header.bottom - bounds.top)}px`,
    );
  }

  function clearOutgoing() {
    outgoing?.classList.remove("calendar-outgoing");
    outgoing = undefined;
    calendar.style.removeProperty("--calendar-outgoing-offset");
  }

  function updateCurrentDay(api) {
    const selected = api.selectedScrollSnap();
    if (selected === current) return;

    const previous = days[current];
    const previousTop = previous.getBoundingClientRect().top;
    if (previous.contains(document.activeElement)) {
      position.focus({ preventScroll: true });
    }
    clearOutgoing();
    previous.classList.remove("calendar-current");
    outgoing = reducedMotion.matches ? undefined : previous;
    current = selected;
    days[current].classList.add("calendar-current");
    days.forEach((day, index) => {
      day.inert = index !== current;
    });
    updateLabel();
    updateHeight();

    // Preserve an undocked header; otherwise return to the top of the day.
    const top =
      window.scrollY +
      viewport.getBoundingClientRect().top -
      position.getBoundingClientRect().bottom;
    window.scrollTo(window.scrollX, Math.min(window.scrollY, top));
    if (outgoing) {
      calendar.style.setProperty(
        "--calendar-outgoing-offset",
        `${previousTop - viewport.getBoundingClientRect().top}px`,
      );
      outgoing.classList.add("calendar-outgoing");
    }
    updatePosition();
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
    days[current].classList.add("calendar-current");
    updateLabel();
    updateHeight();
    updatePosition();

    embla = EmblaCarousel(viewport, {
      breakpoints: {
        "(prefers-reduced-motion: reduce)": { duration: 0 },
      },
    });
    embla.on("select", updateCurrentDay);
    embla.on("settle", () => {
      clearOutgoing();
      updateHeight();
      updatePosition();
    });
    embla.on("reInit", () => {
      resetPointer();
      clearOutgoing();
      updateHeight();
      updatePosition();
    });
    if (current > 0) embla.scrollTo(current, true);
  }

  function disableCarousel() {
    resetPointer();
    embla?.destroy();
    embla = undefined;
    clearOutgoing();
    calendar.replaceChildren(...originalChildren);
    viewport.classList.remove("is-carousel");
    calendar.classList.remove("calendar-carousel");
    position.hidden = true;
    position.classList.remove("is-docked");
    days.forEach((day) => {
      day.inert = false;
      day.classList.remove("calendar-current");
    });
    calendar.style.removeProperty("--calendar-height");
    calendar.style.removeProperty("--calendar-min-day-height");
    calendar.style.removeProperty("--calendar-inactive-offset");
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
  window.addEventListener(
    "scroll",
    () => {
      if (embla) updatePosition();
    },
    { passive: true },
  );
  window.addEventListener("resize", () => {
    if (embla) {
      updateHeight();
      updatePosition();
    }
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

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!embla) return;
      const target = targetIndex(Number(button.dataset.days));
      if (target !== -1) embla.scrollTo(target);
    });
  });

  const resizeObserver = new ResizeObserver((entries) => {
    if (
      embla &&
      entries.some((entry) => {
        const target = entry.target;
        return (
          target === position ||
          target === days[current] ||
          target === outgoing ||
          target.parentElement === days[current] ||
          target.parentElement === outgoing
        );
      })
    ) {
      updateHeight();
      updatePosition();
    }
  });
  resizeObserver.observe(position);
  days.forEach((day) => {
    resizeObserver.observe(day);
    resizeObserver.observe(day.querySelector(":scope > .seances"));
  });

  mobile.addEventListener("change", setMobileMode);
  setMobileMode();
}

initializeCalendarSwipe();
