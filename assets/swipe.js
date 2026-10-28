function initializeCalendarSwipe() {
  const calendar = document.querySelector(".calendar");
  const navigation = document.querySelector(".calendar-navigation");
  const previous = navigation.querySelector(".calendar-previous");
  const next = navigation.querySelector(".calendar-next");
  const position = navigation.querySelector(".calendar-position");
  const days = Array.from(
    calendar.querySelectorAll(
      ":scope > .day[data-date]:not(.past):has(.seance:not(.hidden))",
    ),
  );
  if (days.length === 0) return;

  const mobile = window.matchMedia("screen and (max-width: 599px)");
  let current = 0;
  let gesture = null;
  let suppressClick = false;
  let clickTimer;
  let calendarWidth;

  function updatePosition(drag = 0) {
    const offset = -current * days[0].getBoundingClientRect().width + drag;
    calendar.style.setProperty("--calendar-offset", `${offset}px`);
  }

  function updateHeight() {
    const style = getComputedStyle(calendar);
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const height = days[current].getBoundingClientRect().height + padding;
    calendar.style.setProperty("--calendar-height", `${height}px`);
  }

  function showDay(index) {
    const newIndex = Math.max(0, Math.min(index, days.length - 1));
    if (newIndex !== current && days[current].contains(document.activeElement)) {
      position.focus({ preventScroll: true });
    }
    current = newIndex;
    days.forEach((day, dayIndex) => {
      day.inert = dayIndex !== current;
    });
    previous.disabled = current === 0;
    next.disabled = current === days.length - 1;
    position.textContent = `${days[current].querySelector(".date").textContent.trim()} (${current + 1}/${days.length})`;
    updatePosition();
    updateHeight();
  }

  function setMobileMode() {
    gesture = null;
    calendar.classList.remove("calendar-dragging");
    calendar.classList.toggle("calendar-carousel", mobile.matches);
    navigation.hidden = !mobile.matches;
    if (mobile.matches) {
      showDay(current);
    } else {
      days.forEach((day) => {
        day.inert = false;
      });
      calendar.style.removeProperty("--calendar-offset");
      calendar.style.removeProperty("--calendar-height");
      calendarWidth = undefined;
    }
  }

  previous.addEventListener("click", () => showDay(current - 1));
  next.addEventListener("click", () => showDay(current + 1));

  calendar.addEventListener("pointerdown", (event) => {
    if (!mobile.matches || event.pointerType !== "touch") return;
    if (!event.isPrimary) {
      gesture = null;
      calendar.classList.remove("calendar-dragging");
      updatePosition();
      return;
    }
    suppressClick = false;
    clearTimeout(clickTimer);
    gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      horizontal: false,
    };
  });

  calendar.addEventListener("pointermove", (event) => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.horizontal) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        gesture = null;
        return;
      }
      gesture.horizontal = true;
      calendar.classList.add("calendar-dragging");
      calendar.setPointerCapture(event.pointerId);
    }
    const atBoundary = (current === 0 && dx > 0) ||
      (current === days.length - 1 && dx < 0);
    const width = days[0].getBoundingClientRect().width;
    const drag = Math.max(-width, Math.min(dx, width));
    updatePosition(atBoundary ? drag / 4 : drag);
  });

  function finishGesture(event, cancelled = false) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x;
    const elapsed = Math.max(1, performance.now() - gesture.time);
    const horizontal = gesture.horizontal;
    gesture = null;
    calendar.classList.remove("calendar-dragging");
    if (horizontal) {
      suppressClick = true;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        suppressClick = false;
      }, 500);
    }
    const threshold = Math.min(80, days[0].getBoundingClientRect().width * 0.2);
    const swipe = Math.abs(dx) >= threshold ||
      (Math.abs(dx) >= 30 && Math.abs(dx) / elapsed >= 0.45);
    showDay(!cancelled && horizontal && swipe ? current - Math.sign(dx) : current);
  }

  calendar.addEventListener("pointerup", (event) => finishGesture(event));
  calendar.addEventListener("pointercancel", (event) => finishGesture(event, true));
  calendar.addEventListener("lostpointercapture", (event) => {
    if (event.target === calendar) finishGesture(event, true);
  });
  calendar.addEventListener("click", (event) => {
    if (suppressClick && event.detail !== 0) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }
  }, true);
  mobile.addEventListener("change", setMobileMode);
  const resizeObserver = new ResizeObserver((entries) => {
    if (!mobile.matches) return;
    for (const entry of entries) {
      if (entry.target === calendar && entry.contentRect.width !== calendarWidth) {
        calendarWidth = entry.contentRect.width;
        if (!gesture) updatePosition();
      }
      if (entry.target === days[current]) updateHeight();
    }
  });
  resizeObserver.observe(calendar);
  days.forEach((day) => resizeObserver.observe(day));
  setMobileMode();
}
initializeCalendarSwipe();
