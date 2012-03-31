TeeTee
======

This is an experimental website designed to be the mobile interface to the BWDTTA.

It is considered experimental because it is an adventure into HTML5 techniques. Some of its features are:

 * Dynamic layout - three different layouts using only media queries should allow it to cope with desktop and devices of almost all sizes.
 * Data caching - data is fetched via a number of different files and cached in localStorage.
 * Templating - using pure.js there is complete separation of visual design and the data.
 * LINQ - Uses linq.js to allow easy querying of the datastore, exactly like .Net LINQ.

Still to be added:

 * Application caching - so the application can be cached too and act more like an app on devices.
 * Style - I'm a programmer, not a designer.


Notes:

 * pure.js has been extended to accept a generator function for lists. See [my fork](https://github.com/Technium/pure) for details.
