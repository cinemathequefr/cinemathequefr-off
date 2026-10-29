# cinemathequefr-off

This project is a static pure HTML/CSS/JS web page destined to be served as is, by a static server.
There is only one page (index.html).

When needed, refer to the docs at: https://developer.mozilla.org/en-US/docs/Web

The `div.calendar` element contains a calendar, with a 7 cols layout for desktop and 1 col for mobile.

The JS code should minimize the dependencies. To use common external libraries, you can find an online (CDN) source that will be served to the user. You can use modern JS (e. g. modules) when widely enough supported.

## Next task

When the calendar is display for mobile (touch device) on one column (see relevant breakpoint in the css), instead of having the user make a long scroll to the browse the later days, I want to implement a swipe mechanism.
The user will be able to scroll to the end of the current day. To navigate the days, swipe left for the next day and right for the previous day. The user can't swipe beyond the available data. The swipe motion will shift the content and the target content will snap into place.
Size the calendar to the current day's content. Preserve the vertical scroll position when switching days, clamping it to the bottom if the new day is too short.
Use Embla Carousel from a CDN for swipe gestures. Show the current date as the header without previous/next buttons; the focused header supports left/right arrow keys.
