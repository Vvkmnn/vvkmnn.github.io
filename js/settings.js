// On Document Load

// particlesJS
particlesJS.load('particles-js', 'assets/particles.json', function () {
	console.log('particles.js config loaded');
});

// typedJS
$(window).on('load', (function () {
	// When the page has loaded
	$("#typed-strings").fadeIn(100);
}));

$(function () {
	$("#typed").typed({
		stringsElement: $('#typed-strings'),
		// typing speed
		typeSpeed: 15,
		// time before typing starts
		startDelay: 0,
		// backspacing speed
		backSpeed: 15,
		// shuffle the strings
		shuffle: true,
		// time before backspacing
		backDelay: 1350,
		// loop
		loop: true,
		// false = infinite
		loopCount: false,
		// show cursor
		showCursor: true,
		// character for cursor
		cursorChar: "|"
	});

});