// On Document Load

$(function () {

	console.log('typle loaded!');
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
})
