// strings

// $(function() {
//   console.log("[vSite] strings loaded!");
//   $("#definition").typed({
//     stringsElement: $("#definitions"),
//     // typing speed
//     typeSpeed: 9,
//     // time before typing starts
//     startDelay: 0,
//     // preserve characters
//     smartBackspace: true,
//     // backspacing speed
//     backSpeed: 17,
//     // shuffle the strings
//     shuffle: true,
//     // time before backspacing
//     backDelay: 900,
//     // loop
//     loop: true,
//     // false = infinite
//     loopCount: false,
//     // show cursor
//     showCursor: false,
//     // character for cursor
//     cursorChar: "_"
//   });
// });


// console.log("[vSite] strings loaded!");
document.addEventListener("DOMContentLoaded", function() {

  var definition = document.getElementById("definition");
  var definitions = document.getElementById("definitions");

  // The remaining code assumes you're using a library like Typed.js or TypeIt.js
  // Replace 'typed' with the correct function name for the library you're using.

  new Typed(definition, {
    stringsElement: definitions,
    typeSpeed: 7,
    startDelay: 0,
    smartBackspace: true,
    backSpeed: 14,
    shuffle: true,
    backDelay: 900,
    loop: true,
    loopCount: false,
    showCursor: false,
    cursorChar: "_"
  });
});
