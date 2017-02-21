particlesJS("particles", {
    "particles": {
        "number": {
            "value": 150,
            "density": {
                "enable": true,
                "value_area": 1750
            }
        },
        "color": {
            "value": "#000"
        },
        "shape": {
            "type": "circle",
            "stroke": {
                "width": 0,
                "color": "#000000"
            },
            "polygon": {
                "nb_sides": 5
            },
            "image": {
                "src": "img/github.svg",
                "width": 100,
                "height": 100
            }
        },
        "opacity": {
            "value": 0.75,
            "random": true,
            "anim": {
                "enable": false,
                "speed": 2,
                "opacity_min": 0.1,
                "sync": true
            }
        },
        "size": {
            "value": 3,
            "random": true,
            "anim": {
                "enable": true,
                "speed": 25,
                "size_min": 1,
                "sync": false
            }
        },
        "line_linked": {
            "enable": true,
            "distance": 200,
            "color": "#000",
            "opacity": 0.5,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 3,
            "direction": "top-left",
            "random": true,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
                "enable": true,
                "rotateX": 1000,
                "rotateY": 1000
            }
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "grab"
            },
            "onclick": {
                "enable": true,
                "mode": "repulse"
            },
            "resize": true
        },
        "modes": {
            "grab": {
                "distance": 250,
                "line_linked": {
                    "opacity": 0.5
                }
            },
            "bubble": {
                "distance": 400,
                "size": 40,
                "duration": 2,
                "opacity": 8,
                "speed": 3
            },
            "repulse": {
                "distance": 155,
                "duration": 1
            },
            "push": {
                "particles_nb": 2
            },
            "remove": {
                "particles_nb": 2
            }
        }
    },
    "retina_detect": true
});