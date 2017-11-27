// On Document Load

$(function () {
	console.log('type loaded!');
	$("#definition").typed({
		stringsElement: $('#definitions'),
		// typing speed
		typeSpeed: 10,
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
