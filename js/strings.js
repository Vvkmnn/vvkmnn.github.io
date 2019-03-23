// strings

$(function() {
  console.log("type loaded!");
  $("#definition").typed({
    stringsElement: $("#definitions"),
    // typing speed
    typeSpeed: 10,
    // time before typing starts
    startDelay: 0,
    // preserve characters
    smartBackspace: true,
    // backspacing speed
    backSpeed: 15,
    // shuffle the strings
    shuffle: true,
    // time before backspacing
    backDelay: 1150,
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
