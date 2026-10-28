# cinemathequefr-off

This project is a static pure HTML/CSS/JS web page destined to be served as is, by a static server.
There is only one page (index.html).

When needed, refer to the docs at: https://developer.mozilla.org/en-US/docs/Web

The `div.calendar` element contains a calendar, with a 7 cols layout for desktop and 1 col for mobile.

The JS code should minimize the dependencies. To use common external libraries, you can find an online (CDN) source that will be served to the user. You can use modern JS (e. g. modules) when widely enough supported.

## Next task

When the calendar is display for mobile (touch device) on one column (see relevant breakpoint in the css), instead of having the user make a long scroll to the browse the later days, I want to implement a swipe mechanism.
The user will be able to scroll to the end of the current day. To navigate the days, swipe left for the next day and right for the previous day. The user can't swipe beyond the available data. The swipe motion will shift the content and the target content will snap into place.
All the days must move in sync vertically: if the user has scrolled 200px downward from the top, the day presetend after a swipe will also be scroll 200px downward.
To achieve this, you may need to equalize the heights.
Use a robust swipe implementation (either native or with an external library, e. g. Hammer js or a modern alternative).
