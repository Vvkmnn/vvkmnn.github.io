// On Document Load

// particlesJS
particlesJS.load('particles-js', 'assets/particles.json', function() {
  console.log('particles.js config loaded');
});

// typedJS
$(window).on('load', (function () {
			// When the page has loaded
			$("typed-strings").fadeIn(100);
		}));

		$(function () {
			$("#typed").typed({
				stringsElement: $('#typed-strings'),
				// typing speed
				typeSpeed: 100,
				// time before typing starts
				startDelay: 5,
				// backspacing speed
				backSpeed: 100,
				// shuffle the strings
				shuffle: true,
				// time before backspacing
				backDelay: 1300,
			  // Reuse characters
			  smartBackspace: true,
				// loop
				loop: true,
				// false = infinite
				loopCount: false,
				// show cursor
				showCursor: false,
				// character for cursor
				cursorChar: "|"
			});

		});
