// gradient

// https://apnyc.com/wp-content/uploads/2017/04/ColorChart_for_Web.jpg
var colors = new Array(
  [230, 25, 75], //  Red
  [173, 48, 41], // Tall Poppy
  [219, 187, 48], // Anzac
  [255, 128, 0], // Orange
  [45, 175, 230], // Blue
  [85, 88, 218], // Powder Blue
  [255, 215, 180], //Coral
  [170, 255, 195], //Mint
  [128, 128, 128], //Grey
  [219, 187, 48], // Anzac
  [255, 128, 0], // Orange
  [45, 175, 230], // Blue
  [85, 88, 218], // Powder Blue
  [229, 114, 94], // Terracotta
  [255, 225, 25], // Yellow
  [230, 25, 75], //  Red
  [173, 48, 41], // Tall Poppy
  [219, 187, 48], // Anzac
  [255, 128, 0], // Orange
  [45, 175, 230], // Blue
  [85, 88, 218], // Powder Blue
  [255, 215, 180], //Coral
  [170, 255, 195], //Mint
  [128, 128, 128], //Grey
  [229, 114, 94], // Terracotta
  [255, 215, 180], //Coral
  [170, 255, 195], //Mint
  [128, 128, 128], //Grey
  [229, 114, 94], // Terracotta
  [255, 225, 25], // Yellow
  [95, 209, 249], // Light Blue
  [42, 201, 185], // Old Brick
  [244, 207, 41], // Saffron
  [0, 128, 128], //  Teal
  [255, 128, 0] // Orange
  [173, 48, 41], // Tall Poppy
  [255, 225, 25], // Yellow
  [95, 209, 249], // Light Blue
  [42, 201, 185], // Old Brick
  [244, 207, 41], // Saffron
  [0, 128, 128], //  Teal
  [255, 128, 0] // Orange
  [173, 48, 41], // Tall Poppy
  [95, 209, 249], // Light Blue
  [42, 201, 185], // Old Brick
  [244, 207, 41], // Saffron
  [0, 128, 128], //  Teal
  [255, 128, 0] // Orange
  [173, 48, 41], // Tall Poppy
  [230, 25, 75], //  Red
  [173, 48, 41], // Tall Poppy
  [219, 187, 48], // Anzac
  [219, 187, 48], // Anzac
  [95, 209, 249], // Light Blue
  [42, 201, 185], // Old Brick
  [244, 207, 41], // Saffron
  [0, 128, 128], //  Teal
  [255, 128, 0] // Orange
  [173, 48, 41], // Tall Poppy
  [230, 25, 75], //  Red
  [173, 48, 41], // Tall Poppy
  [219, 187, 48], // Anzac
  [255, 128, 0], // Orange
  [45, 175, 230], // Blue
  [85, 88, 218], // Powder Blue
  [219, 187, 48], // Anzac
  [255, 128, 0], // Orange
  [45, 175, 230], // Blue
  [85, 88, 218], // Powder Blue
  [255, 128, 0], // Orange
  [45, 175, 230], // Blue
  [85, 88, 218], // Powder Blue
  [255, 215, 180], //Coral
  [170, 255, 195], //Mint
  [128, 128, 128], //Grey
  [229, 114, 94], // Terracotta
  [255, 225, 25], // Yellow
  [95, 209, 249], // Light Blue
  [42, 201, 185], // Old Brick
  [244, 207, 41], // Saffron
  [0, 128, 128], //  Teal
  [255, 128, 0] // Orange
  [173, 48, 41], // Tall Poppy

);

var step = 0;

//color table indices for:
// current color left
// next color left
// current color right
// next color right
var colorIndices = [0, 1, 2, 3];

//transition speed
var gradientSpeed = 0.005;


function updateGradient() {
    if ($ === undefined) return;

  var c0_0 = colors[colorIndices[0]];
  var c0_1 = colors[colorIndices[1]];
  var c1_0 = colors[colorIndices[2]];
  var c1_1 = colors[colorIndices[3]];

  var istep = 1 - step;
  var r1 = Math.round(istep * c0_0[0] + step * c0_1[0]);
  var g1 = Math.round(istep * c0_0[1] + step * c0_1[1]);
  var b1 = Math.round(istep * c0_0[2] + step * c0_1[2]);
  var color1 = "rgb(" + r1 + "," + g1 + "," + b1 + ")";

  var r2 = Math.round(istep * c1_0[0] + step * c1_1[0]);
  var g2 = Math.round(istep * c1_0[1] + step * c1_1[1]);
  var b2 = Math.round(istep * c1_0[2] + step * c1_1[2]);
  var color2 = "rgb(" + r2 + "," + g2 + "," + b2 + ")";

  $("#gradient-js")
    .css({
      background:
        "-webkit-gradient(linear, left top, right top, from(" +
        color1 +
        "), to(" +
        color2 +
        "))"
    })
    .css({
      background:
        "-moz-linear-gradient(left, " + color1 + " 0%, " + color2 + " 100%)"
    });

  step += gradientSpeed;
  if (step >= 1) {
    step %= 1;
    colorIndices[0] = colorIndices[1];
    colorIndices[2] = colorIndices[3];

    //pick two new target color indices
    //do not pick the same as the current one
    colorIndices[1] =
      (colorIndices[1] + Math.floor(1 + Math.random() * (colors.length - 1))) %
      colors.length;
    colorIndices[3] =
      (colorIndices[3] + Math.floor(1 + Math.random() * (colors.length - 1))) %
      colors.length;
  }
}

console.log("[vSite] gradient loaded!");
setInterval(updateGradient, 10);
