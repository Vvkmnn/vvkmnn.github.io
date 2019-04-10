// strings

$(function() {
  console.log("type loaded!");
  $("#definition").typed({
    stringsElement: $("#definitions"),
    // typing speed
    typeSpeed: 9,
    // time before typing starts
    startDelay: 0,
    // preserve characters
    smartBackspace: true,
    // backspacing speed
    backSpeed: 17,
    // shuffle the strings
    shuffle: true,
    // time before backspacing
    backDelay: 900,
    // loop
    loop: true,
    // false = infinite
    loopCount: false,
    // show cursor
    showCursor: false,
    // character for cursor
    cursorChar: "_"
  });
});
