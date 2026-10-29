# cinemathequefr-off

This project is a static pure HTML/CSS/JS web page destined to be served as is, by a static server.
There is only one page (index.html).

When needed, refer to the docs at: https://developer.mozilla.org/en-US/docs/Web

The `div.calendar` element contains a calendar, with a 7 cols layout for desktop and 1 col for mobile.

The JS code should minimize the dependencies. To use common external libraries, you can find an online (CDN) source that will be served to the user. You can use modern JS (e. g. modules) when widely enough supported.

## Next task

When the calendar is display for mobile (touch device) on one column (see relevant breakpoint in the css), instead of having the user make a long scroll to the browse the later days, I want to implement a swipe mechanism.
The user will be able to scroll to the end of the current day. To navigate the days, swipe left for the next day and right for the previous day. The user can't swipe beyond the available data. The swipe motion will shift the content and the target content will snap into place.
Size each day to its natural height, adding only the space needed for short days to keep the date header stationary when switching days. Reset the vertical position to the top when switching days; incoming days must appear at the top even during a swipe. Keep every day white. Disable document scrolling while the pointer is dragging horizontally, and restore it on release.
Use Embla Carousel from a CDN for swipe gestures. Show the current date as the header without previous/next buttons; the focused header supports left/right arrow keys.
